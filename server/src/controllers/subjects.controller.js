const prisma = require('../lib/prisma');
const asyncHandler = require('../utils/asyncHandler');

/**
 * @route   GET /api/subjects
 * @desc    Get all subjects along with their nested chapters ordered by orderIndex
 * @access  Public
 */
const getAllSubjects = asyncHandler(async (req, res) => {
  const subjects = await prisma.subject.findMany({
    include: {
      chapters: {
        orderBy: {
          orderIndex: 'asc',
        },
        select: {
          id: true,
          name: true,
          orderIndex: true,
          creditCost: true,
          _count: { select: { questions: true } }
        },
      },
    },
    orderBy: {
      id: 'asc',
    },
  });

  // If student is logged in, attach their progress per chapter
  if (req.user) {
    const statsRows = await prisma.$queryRaw`
      SELECT 
        a.chapter_id as "chapterId",
        COALESCE(AVG(CAST(a.total_score AS FLOAT) / NULLIF(a.max_score, 0)) * 100, 0) as "averagePercentage"
      FROM attempts a
      WHERE a.user_id = ${req.user.id} AND a.submitted_at IS NOT NULL
      GROUP BY a.chapter_id
    `;

    const progressMap = {};
    statsRows.forEach(row => {
      progressMap[row.chapterId] = Math.round(Number(row.averagePercentage));
    });

    // Merge progress into subjects structure
    subjects.forEach(subject => {
      subject.chapters.forEach(chapter => {
        chapter.progress = progressMap[chapter.id] || 0;
      });
    });
  }

  res.status(200).json({ data: subjects });
});

module.exports = { getAllSubjects };
