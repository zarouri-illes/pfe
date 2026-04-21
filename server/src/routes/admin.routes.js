const express = require('express');
const { body } = require('express-validator');
const { 
  getAdminStats,
  getAllExams, createExam, deleteExam, 
  getAllQuestions, createQuestion, updateQuestion, deleteQuestion, 
  getAllCreditPacks, createCreditPack, updateCreditPack, deleteCreditPack,
  getAllTransactions,
  getStudents,
  getExamFile
} = require('../controllers/admin.controller');
const { verifyToken } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/admin');
const { validate } = require('../middleware/validate');
const upload = require('../middleware/upload');

const router = express.Router();

// ALL admin routes are strictly protected by BOTH token verification and the admin role check
router.use(verifyToken, requireAdmin);

// === DASHBOARD STATS ===
router.get('/stats', getAdminStats);

// === EXAMS CRUD ===
router.get('/exams', getAllExams);
router.get('/exams/:id/view', getExamFile);

router.post(
  '/exams',
  upload.single('pdf'),
  [
    body('title').isString().notEmpty(),
    body('subjectId').isInt(),
    body('year').isInt(),
    body('stream').isString().notEmpty(),
    body('type').isString().notEmpty(),
    body('semester').optional().isInt({ min: 1, max: 3 }),
    validate
  ],
  createExam
);

router.delete('/exams/:id', deleteExam);

// === QUESTIONS CRUD ===
router.get('/questions', getAllQuestions);

router.post(
  '/questions',
  upload.single('image'),
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

router.put('/questions/:id', upload.single('image'), updateQuestion);
router.delete('/questions/:id', deleteQuestion);

// === CREDIT PACKS CRUD ===
router.get('/credit-packs', getAllCreditPacks);

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
router.delete('/credit-packs/:id', deleteCreditPack);

// === TRANSACTIONS ===
router.get('/transactions', getAllTransactions);

// === STUDENTS ===
router.get('/students', getStudents);

module.exports = router;
