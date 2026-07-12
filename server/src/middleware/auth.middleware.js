const jwt = require('jsonwebtoken');
const User = require('../modules/users/user.model');
const { UnauthorizedError, ForbiddenError } = require('../shared/errors/customErrors');

const protect = async (req, res, next) => {
  try {
    let token;

    // Check cookies first (as per HTTP-only cookie recommendation)
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      // Fallback for tools / testing convenience
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new UnauthorizedError('You are not logged in. Please log in to gain access.'));
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return next(new UnauthorizedError('Invalid or expired session token. Please log in again.'));
    }

    // Check if user still exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return next(new UnauthorizedError('The user belonging to this token no longer exists.'));
    }

    // Save user details to request object
    req.user = currentUser;
    next();
  } catch (error) {
    next(error);
  }
};

const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new ForbiddenError('You do not have permission to perform this action.'));
    }
    next();
  };
};

module.exports = {
  protect,
  restrictTo,
};
