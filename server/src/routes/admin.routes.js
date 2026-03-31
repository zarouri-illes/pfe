const express = require('express');
const { body } = require('express-validator');
const { 
  createExam, deleteExam, 
  createQuestion, deleteQuestion, 
  createCreditPack, updateCreditPack 
} = require('../controllers/admin.controller');
const { verifyToken } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/admin');
const { validate } = require('../middleware/validate');
const upload = require('../middleware/upload');

const router = express.Router();

// ALL admin routes are strictly protected by BOTH token verification and the admin role check
router.use(verifyToken, requireAdmin);

// === EXAMS CRUD ===
router.post(
  '/exams',
  upload.single('pdf'),
  [
    body('title').isString().notEmpty(),
    body('subjectId').isInt(),
    body('year').isInt(),
    body('stream').isString().notEmpty(),
    body('type').isString().notEmpty(),
    validate
  ],
  createExam
);

router.delete('/exams/:id', deleteExam);

// === QUESTIONS CRUD ===
router.post(
  '/questions',
  [
    body('chapterId').isInt(),
    body('type').isIn(['mcq', 'numerical']),
    body('content').isString().notEmpty(),
    body('correctAnswer').isString().notEmpty(),
    body('points').isInt({ min: 1 }),
    validate
  ],
  createQuestion
);

router.delete('/questions/:id', deleteQuestion);

// === CREDIT PACKS CRUD ===
router.post(
  '/credit-packs',
  [
    body('name').isString().notEmpty(),
    body('credits').isInt({ min: 1 }),
    body('priceDa').isNumeric(),
    validate
  ],
  createCreditPack
);

router.put('/credit-packs/:id', updateCreditPack);

module.exports = router;
