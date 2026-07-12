const Driver = require('../models/Driver');
const { NotFoundError, ConflictError, AppError } = require('../shared/errors/customErrors');

// GET /api/drivers - list all, support query params: status, region
const getDrivers = async (req, res, next) => {
  try {
    const query = {};
    if (req.query.status) query.status = req.query.status;
    if (req.query.region) query.region = req.query.region;

    const drivers = await Driver.find(query);
    res.status(200).json({
      success: true,
      count: drivers.length,
      data: drivers,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/drivers/available - Available & License not expired
const getAvailableDrivers = async (req, res, next) => {
  try {
    const drivers = await Driver.find({
      status: 'Available',
      license_expiry_date: { $gt: new Date() },
    });
    res.status(200).json({
      success: true,
      count: drivers.length,
      data: drivers,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/drivers/:id - get one
const getDriverById = async (req, res, next) => {
  try {
    const driver = await Driver.findById(req.params.id);
    if (!driver) {
      return next(new NotFoundError(`Driver with ID ${req.params.id} not found`));
    }
    res.status(200).json({
      success: true,
      data: driver,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/drivers - create
const createDriver = async (req, res, next) => {
  try {
    const {
      name,
      license_number,
      license_category,
      license_expiry_date,
      contact_number,
      safety_score,
      status,
      region,
    } = req.body;

    // Simple explicit check for required fields to throw a Bad Request before DB attempt
    if (!name || !license_number || !license_category || !license_expiry_date || !contact_number) {
      return next(new AppError('Missing required fields: name, license_number, license_category, license_expiry_date, and contact_number are all required', 400, 'BAD_REQUEST'));
    }

    // License expiry date format check
    const expiryDate = new Date(license_expiry_date);
    if (isNaN(expiryDate.getTime())) {
      return next(new AppError('Invalid license expiry date format', 400, 'BAD_REQUEST'));
    }

    // Safety score check
    if (safety_score !== undefined && (safety_score < 0 || safety_score > 100)) {
      return next(new AppError('Safety score must be between 0 and 100', 400, 'BAD_REQUEST'));
    }

    const newDriver = await Driver.create({
      name,
      license_number,
      license_category,
      license_expiry_date: expiryDate,
      contact_number,
      safety_score,
      status,
      region,
    });

    res.status(201).json({
      success: true,
      data: newDriver,
    });
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      const val = error.keyValue[field];
      return next(new ConflictError(`Driver with ${field} '${val}' already exists`));
    }
    next(error);
  }
};

// PUT /api/drivers/:id - update
const updateDriver = async (req, res, next) => {
  try {
    const { safety_score, license_expiry_date } = req.body;

    if (safety_score !== undefined && (safety_score < 0 || safety_score > 100)) {
      return next(new AppError('Safety score must be between 0 and 100', 400, 'BAD_REQUEST'));
    }

    if (license_expiry_date) {
      const expiryDate = new Date(license_expiry_date);
      if (isNaN(expiryDate.getTime())) {
        return next(new AppError('Invalid license expiry date format', 400, 'BAD_REQUEST'));
      }
    }

    const driver = await Driver.findById(req.params.id);
    if (!driver) {
      return next(new NotFoundError(`Driver with ID ${req.params.id} not found`));
    }

    // Update fields
    const fieldsToUpdate = [
      'name',
      'license_number',
      'license_category',
      'license_expiry_date',
      'contact_number',
      'safety_score',
      'status',
      'region'
    ];
    fieldsToUpdate.forEach((field) => {
      if (req.body[field] !== undefined) {
        if (field === 'license_expiry_date') {
          driver[field] = new Date(req.body[field]);
        } else {
          driver[field] = req.body[field];
        }
      }
    });

    await driver.save();

    res.status(200).json({
      success: true,
      data: driver,
    });
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      const val = error.keyValue[field];
      return next(new ConflictError(`Driver with ${field} '${val}' already exists`));
    }
    next(error);
  }
};

// DELETE /api/drivers/:id - soft-delete (set status to 'Off Duty')
const softDeleteDriver = async (req, res, next) => {
  try {
    const driver = await Driver.findById(req.params.id);
    if (!driver) {
      return next(new NotFoundError(`Driver with ID ${req.params.id} not found`));
    }

    driver.status = 'Off Duty';
    await driver.save();

    res.status(200).json({
      success: true,
      message: 'Driver soft-deleted successfully',
      data: driver,
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/drivers/:id/status - body: { status }
const updateDriverStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = ['Available', 'On Trip', 'Off Duty', 'Suspended'];

    if (!status || !validStatuses.includes(status)) {
      return next(new AppError('Invalid or missing status values', 400, 'BAD_REQUEST'));
    }

    const driver = await Driver.findById(req.params.id);
    if (!driver) {
      return next(new NotFoundError(`Driver with ID ${req.params.id} not found`));
    }

    driver.status = status;
    await driver.save();

    res.status(200).json({
      success: true,
      data: driver,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDrivers,
  getAvailableDrivers,
  getDriverById,
  createDriver,
  updateDriver,
  softDeleteDriver,
  updateDriverStatus,
};
