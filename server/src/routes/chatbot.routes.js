const express = require('express');
const { body } = require('express-validator');
const { chat } = require('../controllers/chatbot.controller');
const { verifyToken } = require('../middleware/auth');
const { requireCredits } = require('../middleware/credits');
const { validate } = require('../middleware/validate');

const router = express.Router();

router.post(
  '/',
  verifyToken,
  requireCredits(1),
  [
    body('message')
      .isString()
      .withMessage('Message must be text')
      .trim()
      .isLength({ min: 1, max: 500 })
      .withMessage('Message must be between 1 and 500 characters'),
    validate,
  ],
  chat
);

module.exports = router;
