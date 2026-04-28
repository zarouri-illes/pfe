const express = require('express');
const { body } = require('express-validator');
const { startQuiz, submitQuiz, getAttemptResults } = require('../controllers/quiz.controller');
const { verifyToken } = require('../middleware/auth');
const { requireCredits } = require('../middleware/credits');
const { validate } = require('../middleware/validate');
const prisma = require('../lib/prisma');

const router = express.Router();

// Custom route-level middleware for startQuiz to fetch dynamic chapter cost
const ensureQuizCredits = async (req, res, next) => {
  const chapterId = req.body.chapterId;
  
  if (!chapterId) {
    return res.status(400).json({ 
      error: 'Validation failed',
      details: [{ field: 'chapterId', message: 'chapterId is required' }] 
    });
  }

  try {
    const chapter = await prisma.chapter.findUnique({
      where: { id: parseInt(chapterId, 10) },
    });

    if (!chapter) {
      return res.status(404).json({ error: 'Chapter not found' });
    }

    // Attach for startQuiz controller to use
    req.chapter = chapter;

    // Apply the factory middleware dynamically using the retrieved cost
    return requireCredits(chapter.creditCost)(req, res, next);
  } catch (error) {
    next(error);
  }
};

router.post(
  '/start',
  verifyToken,
  [
    body('chapterId').isInt().withMessage('chapterId must be an integer'),
    validate,
  ],
  ensureQuizCredits,
  startQuiz
);

router.post(
  '/submit',
  verifyToken,
  [
    body('attemptId').isInt().withMessage('attemptId must be an integer'),
    body('answers').isArray({ min: 1 }).withMessage('answers must be a non-empty array'),
    body('answers.*.questionId').isInt({ min: 1 }).withMessage('Each answer must have a valid questionId'),
    body('answers.*.studentAnswer').exists().withMessage('Each answer must include an studentAnswer field'),
    validate,
  ],
  submitQuiz
);

router.get('/:attemptId/results', verifyToken, getAttemptResults);

module.exports = router;
