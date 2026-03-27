const prisma = require('../lib/prisma');
const asyncHandler = require('../utils/asyncHandler');
const { gradeAttempt } = require('../services/gradingService');

/**
 * @route   POST /api/quiz/start
 * @desc    Deduct credits, create attempt, fetch shuffled questions
 * @access  Private
 */
const startQuiz = asyncHandler(async (req, res) => {
  // At this point, the route-level wrapper has verified the token, 
  // looked up the chapter, applied requireCredits, and saved req.chapter.
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

  // Fetch questions in random order using raw SQL
  // Prisma generates table names automatically. We mapped them to lowercase plural form in schema.prisma.
  const questions = await prisma.$queryRaw`
    SELECT id, "chapter_id" as "chapterId", type, content, options, points 
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

  // 1. Verify attempt exists and belongs to the requesting user
  const attempt = await prisma.attempt.findUnique({
    where: { id: attemptId },
  });

  if (!attempt) {
    return res.status(404).json({ error: 'Attempt not found' });
  }

  if (attempt.userId !== req.user.id) {
    return res.status(403).json({ error: 'You do not own this attempt' });
  }

  // 2. Check that it hasn't been submitted already
  if (attempt.submittedAt !== null) {
    return res.status(400).json({ error: 'This quiz has already been submitted' });
  }

  // 3. Fetch all questions for this chapter including correct answers
  const questions = await prisma.question.findMany({
    where: { chapterId: attempt.chapterId },
  });

  // 4. Run grading service
  const gradedResults = gradeAttempt(questions, answers);

  // Calculate total score
  const totalScore = gradedResults.reduce((sum, current) => sum + current.score, 0);

  // 5. Save answers and update attempt in an atomic transaction
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
  ]);

  // Create detailed breakdown for the student
  const breakdown = questions.map(q => {
    const result = gradedResults.find(r => r.questionId === q.id);
    return {
      questionId: q.id,
      content: q.content,
      type: q.type,
      studentAnswer: result.studentAnswer,
      correctAnswer: q.correctAnswer,
      isCorrect: result.isCorrect,
      score: result.score,
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

module.exports = { startQuiz, submitQuiz };
