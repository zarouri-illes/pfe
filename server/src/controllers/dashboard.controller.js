const prisma = require('../lib/prisma');
const asyncHandler = require('../utils/asyncHandler');

/**
 * @route   GET /api/dashboard
 * @desc    Get aggregated student dashboard data in a single request
 * @access  Private
 */
const getDashboardData = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // 1. Credit Balance
  const creditBalance = req.user.creditBalance;

  // 2. Days until Bac (June 10th algorithmic target)
  const today = new Date();
  let bacDate = new Date(today.getFullYear(), 5, 10); // Month 5 is June in JS Dates
  // If today is past June 10th, target the next year's 10th of June
  if (today > bacDate) {
    bacDate = new Date(today.getFullYear() + 1, 5, 10);
  }
  const diffTime = Math.abs(bacDate - today);
  const daysUntilBac = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // 3. Recent Attempts (Last 5 completed)
  const attemptsData = await prisma.attempt.findMany({
    where: { 
      userId, 
      submittedAt: { not: null } 
    },
    orderBy: { submittedAt: 'desc' },
    take: 5,
    include: {
      chapter: {
        select: {
          name: true,
          subject: { select: { name: true } }
        }
      }
    }
  });

  const recentAttempts = attemptsData.map(a => ({
    id: a.id,
    subjectName: a.chapter.subject.name,
    chapterName: a.chapter.name,
    percentage: a.maxScore > 0 ? Math.round((a.totalScore / a.maxScore) * 100) : 0,
    submittedAt: a.submittedAt
  }));

  // 4. Chapter Stats (Raw SQL to correctly calculate average percentage across completely differing max_score variants)
  const statsRows = await prisma.$queryRaw`
    SELECT 
      c.id as "chapterId",
      c.name as "chapterName",
      CAST(COUNT(a.id) AS INTEGER) as "attemptCount",
      COALESCE(AVG(CAST(a.total_score AS FLOAT) / NULLIF(a.max_score, 0)) * 100, 0) as "averagePercentage"
    FROM attempts a
    JOIN chapters c ON a.chapter_id = c.id
    WHERE a.user_id = ${userId} AND a.submitted_at IS NOT NULL
    GROUP BY c.id, c.name
  `;

  const chapterStats = statsRows.map(row => ({
    chapterId: row.chapterId,
    chapterName: row.chapterName,
    attemptCount: Number(row.attemptCount),
    averagePercentage: Math.round(Number(row.averagePercentage))
  }));

  // 5. Weakest Chapters (bottom 3 among chapters with at least 2 attempts to filter out single-try flukes)
  const weakestChapters = chapterStats
    .filter(stat => stat.attemptCount >= 2)
    .sort((a, b) => a.averagePercentage - b.averagePercentage)
    .slice(0, 3);

  // 6. Subject Progression (Grouped by subject)
  const subjectStatsRows = await prisma.$queryRaw`
    SELECT 
      s.id as "subjectId",
      s.name as "subjectName",
      COALESCE(AVG(CAST(a.total_score AS FLOAT) / NULLIF(a.max_score, 0)) * 100, 0) as "averagePercentage"
    FROM attempts a
    JOIN chapters c ON a.chapter_id = c.id
    JOIN subjects s ON c.subject_id = s.id
    WHERE a.user_id = ${userId} AND a.submitted_at IS NOT NULL
    GROUP BY s.id, s.name
  `;

  const subjectStats = subjectStatsRows.map(row => ({
    subjectId: row.subjectId,
    subjectName: row.subjectName,
    averagePercentage: Math.round(Number(row.averagePercentage))
  }));

  // 7. Activity Heatmap (Last 1 year)
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  const activities = await prisma.activity.findMany({
    where: {
      userId,
      date: { gte: oneYearAgo }
    },
    select: {
      date: true,
      count: true
    }
  });

  // 8. Goals Overview
  const goalsCount = await prisma.goal.count({ where: { userId } });
  const completedGoalsCount = await prisma.goal.count({ where: { userId, isCompleted: true } });

  res.status(200).json({
    data: {
      user: {
        name: req.user.name,
        email: req.user.email,
        creditBalance
      },
      daysUntilBac,
      recentAttempts,
      chapterStats,
      weakestChapters,
      subjectStats,
      heatmap: activities,
      goals: {
        total: goalsCount,
        completed: completedGoalsCount
      }
    }
  });
});

module.exports = { getDashboardData };
