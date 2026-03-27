const prisma = require('../lib/prisma');
const asyncHandler = require('../utils/asyncHandler');

/**
 * @route   GET /api/exams
 * @desc    Get exams with optional filtering by subjectId, year, stream, and type
 * @access  Public
 */
const getExams = asyncHandler(async (req, res) => {
  const { subjectId, year, stream, type } = req.query;

  const where = {};
  
  if (subjectId) {
    where.subjectId = parseInt(subjectId, 10);
  }
  
  if (year) {
    where.year = parseInt(year, 10);
  }
  
  if (stream) {
    where.stream = stream;
  }
  
  if (type) {
    where.type = type;
  }

  const exams = await prisma.exam.findMany({
    where,
    include: {
      subject: {
        select: { name: true },
      },
    },
    orderBy: {
      uploadedAt: 'desc', // Newest first
    },
  });

  res.status(200).json({ data: exams });
});

module.exports = { getExams };
