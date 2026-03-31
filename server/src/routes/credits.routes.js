const express = require('express');
const { body } = require('express-validator');
const { getAvailablePacks, createCheckout, handleWebhook } = require('../controllers/credits.controller');
const { verifyToken } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();

router.get('/packs', verifyToken, getAvailablePacks);

router.post(
  '/checkout',
  verifyToken,
  [
    body('packId').isInt().withMessage('packId must be an integer'),
    validate,
  ],
  createCheckout
);

// Note: webhook must NOT have verifyToken or body parser.
// In app.js, this route has `express.raw()` mapped directly to it BEFORE `express.json()`.
router.post('/webhook', handleWebhook);

module.exports = router;
