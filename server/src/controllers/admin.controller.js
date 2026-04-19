const prisma = require('../lib/prisma');
const asyncHandler = require('../utils/asyncHandler');
const { uploadBufferToCloudinary, deleteFromCloudinary, extractPublicId } = require('../services/cloudinaryService');

/**
 * @route   POST /api/admin/exams
 * @desc    Upload an exam PDF directly to Cloudinary and create the SQL record
 */
const createExam = asyncHandler(async (req, res) => {
  const { title, subjectId, year, stream, type, semester } = req.body;
  
  if (!req.file) {
    return res.status(400).json({ error: 'Please upload a PDF file' });
  }

  // Stream directly to Cloudinary without disk touching
  const result = await uploadBufferToCloudinary(req.file.buffer, 'bacprep/exams');

  const exam = await prisma.exam.create({
    data: {
      title,
      fileUrl: result.secure_url,
      publicId: result.public_id,
      subjectId: parseInt(subjectId, 10),
      year: parseInt(year, 10),
      stream,
      type,
      semester: semester ? parseInt(semester, 10) : null
    }
  });

  res.status(201).json({ data: exam });
});

/**
 * @route   DELETE /api/admin/exams/:id
 * @desc    Delete an exam from both the SQL DB and Cloudinary AWS servers
 */
const deleteExam = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const exam = await prisma.exam.findUnique({ where: { id: parseInt(id, 10) } });
  if (!exam) return res.status(404).json({ error: 'Exam not found' });

  // Delete from Cloudinary using the stored public_id
  if (exam.publicId) {
    await deleteFromCloudinary(exam.publicId);
  }

  // Delete from DB strictly after deletion is confirmed from Cloud so we don't end up with ghost files
  await prisma.exam.delete({ where: { id: parseInt(id, 10) } });

  res.status(200).json({ message: 'Exam deleted successfully' });
});

/**
 * @route   POST /api/admin/questions
 * @desc    Create a new question
 */
const createQuestion = asyncHandler(async (req, res) => {
  const { chapterId, type, content, options, correctAnswer, tolerance, points } = req.body;
  
  let imageUrl = null;

  // If an image was provided, stream it to Cloudinary into a questions folder
  if (req.file) {
    const uploadResult = await uploadBufferToCloudinary(req.file.buffer, 'bacprep/questions');
    imageUrl = uploadResult.secure_url;
  }

  const question = await prisma.question.create({
    data: {
      chapterId: parseInt(chapterId, 10),
      type,
      content,
      imageUrl,
      // Express might send arrays as strings if sent via multipart/form-data. Properly handle parsing.
      options: options ? (typeof options === 'string' ? JSON.parse(options) : options) : [],
      correctAnswer,
      tolerance: tolerance ? parseFloat(tolerance) : null,
      points: parseInt(points, 10),
    }
  });

  res.status(201).json({ data: question });
});

/**
 * @route   DELETE /api/admin/questions/:id
 * @desc    Delete a question
 */
const deleteQuestion = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const question = await prisma.question.findUnique({ where: { id: parseInt(id, 10) } });
  if (!question) return res.status(404).json({ error: 'Question not found' });

  // Clean up Cloudinary image if one exists
  if (question.imageUrl) {
    const publicId = extractPublicId(question.imageUrl);
    if (publicId) {
      await deleteFromCloudinary(publicId);
    }
  }

  // 0. Check if any Answer records reference this question to avoid corrupted history
  const answerCount = await prisma.answer.count({ where: { questionId: parseInt(id, 10) } });
  if (answerCount > 0) {
    return res.status(409).json({ 
      error: 'Cannot delete question because it has existing student answers. Deactivating it is recommended instead (if implemented).' 
    });
  }

  await prisma.question.delete({ where: { id: parseInt(id, 10) } });
  res.status(200).json({ message: 'Question deleted successfully' });
});

/**
 * @route   GET /api/admin/credit-packs
 * @desc    List all credit packs (active and inactive)
 */
const getAllCreditPacks = asyncHandler(async (req, res) => {
  const packs = await prisma.creditPack.findMany({
    orderBy: { id: 'asc' },
  });
  res.status(200).json({ data: packs });
});

/**
 * @route   POST /api/admin/credit-packs
 * @desc    Create a new credit pack
 */
const createCreditPack = asyncHandler(async (req, res) => {
  const { name, credits, priceDa, isActive } = req.body;
  const pack = await prisma.creditPack.create({
    data: {
      name,
      credits: parseInt(credits, 10),
      priceDa: parseFloat(priceDa),
      isActive: isActive !== undefined ? isActive : true
    }
  });
  res.status(201).json({ data: pack });
});

/**
 * @route   PUT /api/admin/credit-packs/:id
 * @desc    Update a credit pack
 */
const updateCreditPack = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, credits, priceDa, isActive } = req.body;

  const pack = await prisma.creditPack.update({
    where: { id: parseInt(id, 10) },
    data: {
      name,
      credits: credits !== undefined ? parseInt(credits, 10) : undefined,
      priceDa: priceDa !== undefined ? parseFloat(priceDa) : undefined,
      isActive
    }
  });

  res.status(200).json({ data: pack });
});

/**
 * @route   GET /api/admin/exams
 * @desc    List all exams (for admin table view)
 */
const getAllExams = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const skip = (page - 1) * limit;

  const [exams, total] = await Promise.all([
    prisma.exam.findMany({
      include: { subject: { select: { name: true } } },
      orderBy: { uploadedAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.exam.count(),
  ]);

  res.status(200).json({
    data: exams,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
  });
});

/**
 * @route   GET /api/admin/questions
 * @desc    List all questions with optional chapterId filter
 */
const getAllQuestions = asyncHandler(async (req, res) => {
  const { chapterId, subjectId, type } = req.query;
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const skip = (page - 1) * limit;

  const where = {};
  if (chapterId) where.chapterId = parseInt(chapterId, 10);
  if (type) where.type = type;
  if (subjectId) {
    where.chapter = { subjectId: parseInt(subjectId, 10) };
  }

  const [questions, total] = await Promise.all([
    prisma.question.findMany({
      where,
      include: { chapter: { select: { name: true, subject: { select: { name: true } } } } },
      orderBy: { id: 'desc' },
      skip,
      take: limit,
    }),
    prisma.question.count({ where }),
  ]);

  res.status(200).json({
    data: questions,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
  });
});

/**
 * @route   DELETE /api/admin/credit-packs/:id
 * @desc    Delete a credit pack
 */
const deleteCreditPack = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await prisma.creditPack.delete({ where: { id: parseInt(id, 10) } });
  res.status(200).json({ message: 'Credit pack deleted successfully' });
});

/**
 * @route   GET /api/admin/stats
 * @desc    Get top-level platform statistics for the admin dashboard
 */
const getAdminStats = asyncHandler(async (req, res) => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [
    studentCount, 
    questionCount, 
    examCount, 
    revenueData,
    revenueHistory,
    activityHistory,
    subjectsBreakdown
  ] = await Promise.all([
    prisma.user.count({ where: { role: 'student' } }),
    prisma.question.count(),
    prisma.exam.count(),
    prisma.transaction.aggregate({
      where: { status: 'COMPLETED' },
      _sum: { amountDa: true },
    }),
    // Revenue history (last 30 days)
    prisma.transaction.groupBy({
      by: ['createdAt'],
      where: { 
        status: 'COMPLETED',
        createdAt: { gte: thirtyDaysAgo }
      },
      _sum: { amountDa: true },
      orderBy: { createdAt: 'asc' }
    }),
    // Activity history (last 7 days)
    prisma.attempt.groupBy({
      by: ['startedAt'],
      where: { startedAt: { gte: sevenDaysAgo } },
      _count: { _all: true },
      orderBy: { startedAt: 'asc' }
    }),
    // Questions per subject
    prisma.subject.findMany({
      select: {
        name: true,
        _count: {
          select: { chapters: true } // This counts chapters, we want questions
        },
        chapters: {
          select: {
            _count: { select: { questions: true } }
          }
        }
      }
    })
  ]);

  // Find most attempted chapter
  const mostAttempted = await prisma.attempt.groupBy({
    by: ['chapterId'],
    _count: { _all: true },
    orderBy: { _count: { chapterId: 'desc' } },
    take: 1,
  });

  let topChapter = null;
  if (mostAttempted.length > 0) {
    topChapter = await prisma.chapter.findUnique({
      where: { id: mostAttempted[0].chapterId },
      include: { subject: { select: { name: true } } },
    });
    topChapter = {
      name: topChapter.name,
      subjectName: topChapter.subject.name,
      attemptCount: mostAttempted[0]._count._all,
    };
  }

  // Format history data (Prisma groupBy on DateTime usually returns per-millisecond groups which is not ideal,
  // in a real prod app we'd use raw SQL for date truncation, 
  // but let's approximate by day in JS for safety or use a simplified grouping)
  
  const formatHistory = (data, dateKey, sumKey, countKey) => {
    const map = {};
    data.forEach(item => {
      const date = new Date(item[dateKey]).toLocaleDateString('en-US');
      if (sumKey) {
        map[date] = (map[date] || 0) + (item._sum[sumKey] || 0);
      } else {
        map[date] = (map[date] || 0) + (item._count[countKey] || 0);
      }
    });
    return Object.entries(map).map(([name, value]) => ({ 
      name, 
      [sumKey || 'count']: value 
    }));
  };

  const formattedRevenue = formatHistory(revenueHistory, 'createdAt', 'amountDa');
  const formattedActivity = formatHistory(activityHistory, 'startedAt', null, '_all');

  // Format subjects breakdown
  const subjectStats = subjectsBreakdown.map(s => ({
    name: s.name,
    questionCount: s.chapters.reduce((acc, c) => acc + c._count.questions, 0)
  }));

  res.status(200).json({
    data: {
      totalStudents: studentCount,
      totalQuestions: questionCount,
      totalExams: examCount,
      totalRevenue: revenueData._sum.amountDa || 0,
      mostAttemptedChapter: topChapter,
      revenueHistory: formattedRevenue,
      activityHistory: formattedActivity,
      subjectStats: subjectStats
    },
  });
});

module.exports = {
  getAdminStats,
  getAllExams,
  createExam,
  deleteExam,
  getAllQuestions,
  createQuestion,
  deleteQuestion,
  getAllCreditPacks,
  createCreditPack,
  updateCreditPack,
  deleteCreditPack
};
