const { validationResult } = require('express-validator');

/**
 * Validation Formatter Middleware
 * Standardizes express-validator errors into the expected format.
 * Placed at the end of every route's validation chain.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array().map((err) => ({
        field: err.path,
        message: err.msg,
      })),
    });
  }
  next();
};

module.exports = { validate };
