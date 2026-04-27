const prisma = require('../lib/prisma');
const asyncHandler = require('../utils/asyncHandler');
const { gradeAttempt } = require('../services/gradingService');

/**
 * @route   POST /api/quiz/start
 * @desc    Deduct credits, create attempt, fetch shuffled questions
 * @access  Private
 */
const startQuiz = asyncHandler(async (req, res) => {
  const chapterId = req.chapter.id;
  const creditsSpent = req.creditsSpent;

  // Verify chapter has questions
  const questionsCount = await prisma.question.count({
    where: { chapterId },
  });

  if (questionsCount === 0) {
    return res.status(400).json({ error: 'This chapter has no questions yet' });
  }

  // Calculate max_score for the attempt
  const agg = await prisma.question.aggregate({
    where: { chapterId },
    _sum: { points: true },
  });
  const maxScore = agg._sum.points || 0;

  // Create Attempt record
  const attempt = await prisma.attempt.create({
    data: {
      userId: req.user.id,
      chapterId: chapterId,
      maxScore: maxScore,
      creditsSpent: creditsSpent,
      totalScore: 0,
    },
  });

  const questions = await prisma.$queryRaw`
    SELECT id, "chapter_id" as "chapterId", type, content, "image_url" as "imageUrl", options, points 
    FROM questions 
    WHERE chapter_id = ${chapterId}
    ORDER BY RANDOM()
  `;

  res.status(200).json({
    data: {
      attemptId: attempt.id,
      creditBalance: req.user.creditBalance,
      questions,
    },
  });
});

/**
 * @route   POST /api/quiz/submit
 * @desc    Receive answers, run grading, save records inside transaction
 * @access  Private
 */
const submitQuiz = asyncHandler(async (req, res) => {
  const { attemptId, answers } = req.body;

  const attempt = await prisma.attempt.findUnique({
    where: { id: attemptId },
  });

  if (!attempt) {
    return res.status(404).json({ error: 'Attempt not found' });
  }

  if (attempt.userId !== req.user.id) {
    return res.status(403).json({ error: 'You do not own this attempt' });
  }

  if (attempt.submittedAt !== null) {
    return res.status(400).json({ error: 'This quiz has already been submitted' });
  }

  const questions = await prisma.question.findMany({
    where: { chapterId: attempt.chapterId },
  });

  const gradedResults = gradeAttempt(questions, answers);
  const totalScore = gradedResults.reduce((sum, current) => sum + current.score, 0);

  // Atomic transaction for saving results and tracking activity
  await prisma.$transaction([
    prisma.answer.createMany({
      data: gradedResults.map((result) => ({
        attemptId: attempt.id,
        questionId: result.questionId,
        studentAnswer: result.studentAnswer,
        isCorrect: result.isCorrect,
        score: result.score,
      })),
    }),
    prisma.attempt.update({
      where: { id: attempt.id },
      data: {
        totalScore: totalScore,
        submittedAt: new Date(),
      },
    }),
    prisma.activity.upsert({
      where: {
        userId_date: {
          userId: req.user.id,
          // Use local date at UTC midnight to avoid timezone day-boundary bugs
          date: (() => {
            const d = new Date();
            d.setHours(0, 0, 0, 0);
            return d;
          })(),
        },
      },
      update: { count: { increment: 1 } },
      create: {
        userId: req.user.id,
        date: (() => {
          const d = new Date();
          d.setHours(0, 0, 0, 0);
          return d;
        })(),
        count: 1,
      },
    }),
  ]);

  const breakdown = questions.map(q => {
    const result = gradedResults.find(r => r.questionId === q.id);
    return {
      questionId: q.id,
      content: q.content,
      type: q.type,
      studentAnswer: result?.studentAnswer || null,
      correctAnswer: q.correctAnswer,
      isCorrect: result?.isCorrect || false,
      score: result?.score || 0,
      maxPoints: q.points,
    };
  });

  const percentage = attempt.maxScore > 0 ? (totalScore / attempt.maxScore) * 100 : 0;

  res.status(200).json({
    data: {
      score: totalScore,
      maxScore: attempt.maxScore,
      percentage: Math.round(percentage),
      breakdown,
    },
  });
});

/**
 * @route   GET /api/quiz/:attemptId/results
 * @desc    Fetch the results of a completed, owned attempt (for page-refresh support)
 * @access  Private
 */
const getAttemptResults = asyncHandler(async (req, res) => {
  const attemptId = parseInt(req.params.attemptId, 10);

  const attempt = await prisma.attempt.findUnique({
    where: { id: attemptId },
    include: {
      answers: {
        include: { question: true },
      },
    },
  });

  if (!attempt) {
    return res.status(404).json({ error: 'Attempt not found' });
  }

  if (attempt.userId !== req.user.id) {
    return res.status(403).json({ error: 'You do not own this attempt' });
  }

  if (!attempt.submittedAt) {
    return res.status(400).json({ error: 'This attempt has not been submitted yet' });
  }

  const breakdown = attempt.answers.map(a => ({
    questionId: a.questionId,
    content: a.question.content,
    type: a.question.type,
    studentAnswer: a.studentAnswer,
    correctAnswer: a.question.correctAnswer,
    isCorrect: a.isCorrect,
    score: a.score,
    maxPoints: a.question.points,
  }));

  const percentage = attempt.maxScore > 0
    ? Math.round((attempt.totalScore / attempt.maxScore) * 100)
    : 0;

  res.status(200).json({
    data: {
      score: attempt.totalScore,
      maxScore: attempt.maxScore,
      percentage,
      breakdown,
    },
  });
});

module.exports = { startQuiz, submitQuiz, getAttemptResults };
