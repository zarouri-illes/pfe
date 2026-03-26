/**
 * Utility wrapper for async route handlers.
 * Catches rejected promises and forwards them to Express's global error handler.
 * Prevents unhandled promise rejections from crashing the server or hanging requests.
 *
 * @param {Function} fn - The async Express middleware/controller function
 * @returns {Function} Express middleware function
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
