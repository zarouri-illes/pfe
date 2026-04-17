const express = require('express');
const { body } = require('express-validator');
const rateLimit = require('express-rate-limit');
const { register, login, getMe } = require('../controllers/auth.controller');
const { verifyToken } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();

// Stricter rate limiter for auth routes (brute-force protection)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // Only 10 login/register attempts per 15 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts. Please try again later.' }
});

router.post(
  '/register',
  authLimiter,
  [
    body('name').isString().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
    body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
    validate,
  ],
  register
);

router.post(
  '/login',
  authLimiter,
  [
    body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
    body('password').notEmpty().withMessage('Password is required'),
    validate,
  ],
  login
);

router.get('/me', verifyToken, getMe);

module.exports = router;
