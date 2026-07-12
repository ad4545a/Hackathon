const { ValidationError } = require('../shared/errors/customErrors');

const validate = (schema) => (req, res, next) => {
  try {
    const parsed = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (!parsed.success) {
      const details = {};
      parsed.error.errors.forEach((err) => {
        // e.g. path is ['body', 'registrationNumber'] => we want to display 'registrationNumber'
        const fieldPath = err.path.slice(1).join('.') || err.path[0];
        details[fieldPath] = err.message;
      });

      return next(new ValidationError('Validation failed', details));
    }

    // Replace request data with Zod coerced and cleaned values
    if (parsed.data.body) req.body = parsed.data.body;
    if (parsed.data.query) req.query = parsed.data.query;
    if (parsed.data.params) req.params = parsed.data.params;

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = validate;
