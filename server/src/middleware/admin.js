/**
 * Admin Role Middleware
 * Must run AFTER auth middleware. Ensures req.user has admin role.
 */
const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ error: 'Access denied, admin privileges required' });
  }
};

module.exports = { requireAdmin };
