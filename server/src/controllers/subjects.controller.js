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
        },
      },
    },
    orderBy: {
      id: 'asc',
    },
  });

  res.status(200).json({ data: subjects });
});

module.exports = { getAllSubjects };
