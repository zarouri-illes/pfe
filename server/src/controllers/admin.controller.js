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
      chapter: { connect: { id: parseInt(chapterId, 10) } },
      type,
      content,
      imageUrl,
      // Express might send arrays as strings if sent via multipart/form-data. Properly handle parsing.
      options: options ? (typeof options === 'string' ? JSON.parse(options) : options) : [],
      correctAnswer,
      tolerance: tolerance ? parseFloat(tolerance) : 0,
      points: points ? parseInt(points, 10) : 10,
    }
  });

  res.status(201).json({ data: question });
});

/**
 * @route   PUT /api/admin/questions/:id
 * @desc    Update an existing question
 */
const updateQuestion = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { chapterId, type, content, options, correctAnswer, tolerance, points } = req.body;
  
  const existingQuestion = await prisma.question.findUnique({ where: { id: parseInt(id, 10) } });
  if (!existingQuestion) return res.status(404).json({ error: 'Question non trouvée' });

  let imageUrl = undefined; // undefined means "don't update" in Prisma if not provided

  if (req.file) {
    // If a new image is uploaded, send to Cloudinary
    const uploadResult = await uploadBufferToCloudinary(req.file.buffer, 'bacprep/questions');
    imageUrl = uploadResult.secure_url;

    // Optional: Clean up old image from Cloudinary
    if (existingQuestion.imageUrl) {
      const oldPublicId = extractPublicId(existingQuestion.imageUrl);
      if (oldPublicId) await deleteFromCloudinary(oldPublicId);
    }
  }

  const question = await prisma.question.update({
    where: { id: parseInt(id, 10) },
    data: {
      chapter: chapterId ? { connect: { id: parseInt(chapterId, 10) } } : undefined,
      type,
      content,
      imageUrl,
      options: options ? (typeof options === 'string' ? JSON.parse(options) : options) : undefined,
      correctAnswer,
      tolerance: tolerance !== undefined ? parseFloat(tolerance) : undefined,
      points: points ? parseInt(points, 10) : undefined,
    }
  });

  res.status(200).json({ data: question });
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

  // Delete all associated answers first to prevent foreign key constraint conflicts
  await prisma.answer.deleteMany({ where: { questionId: parseInt(id, 10) } });

  await prisma.question.delete({ where: { id: parseInt(id, 10) } });
  res.status(200).json({ message: 'Question deleted successfully' });
});

/**
 * @route   GET /api/admin/transactions
 * @desc    Get all platform transactions for history log
 */
const getAllTransactions = asyncHandler(async (req, res) => {
  const transactions = await prisma.transaction.findMany({
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      pack: {
        select: {
          name: true,
          credits: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  res.status(200).json({ data: transactions });
});

/**
 * @route   GET /api/admin/students
 * @desc    Get all registered students for management
 */
const getStudents = asyncHandler(async (req, res) => {
  const students = await prisma.user.findMany({
    where: { role: 'student' },
    select: {
      id: true,
      name: true,
      email: true,
      creditBalance: true,
      createdAt: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  res.status(200).json({ data: students });
});

/**
 * @route   GET /api/admin/students/:id
 * @desc    Get full details of a specific student
 */
const getStudentDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const student = await prisma.user.findUnique({
    where: { id: parseInt(id, 10), role: 'student' },
    include: {
      transactions: {
        include: { pack: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
      },
      attempts: {
        include: { chapter: { select: { name: true, subject: { select: { name: true } } } } },
        orderBy: { startedAt: 'desc' },
      },
      goals: true,
      activities: {
        orderBy: { date: 'desc' },
        take: 30
      }
    }
  });

  if (!student) {
    return res.status(404).json({ error: 'Étudiant non trouvé' });
  }

  res.status(200).json({ data: student });
});

/**
 * @route   DELETE /api/admin/students/:id
 * @desc    Permanently delete a student and all their associated data
 */
const deleteStudent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = parseInt(id, 10);

  const student = await prisma.user.findUnique({ where: { id: userId } });
  if (!student) return res.status(404).json({ error: 'Étudiant non trouvé' });

  // Safety check: Prevent deleting admins via this route
  if (student.role === 'admin') {
    return res.status(403).json({ error: 'Les administrateurs ne peuvent pas être supprimés.' });
  }

  // Delete everything related to the user in a transaction
  await prisma.$transaction([
    prisma.activity.deleteMany({ where: { userId } }),
    prisma.goal.deleteMany({ where: { userId } }),
    prisma.transaction.deleteMany({ where: { userId } }),
    // Delete answers associated with the user's attempts
    prisma.answer.deleteMany({ where: { attempt: { userId } } }),
    prisma.attempt.deleteMany({ where: { userId } }),
    prisma.user.delete({ where: { id: userId } }),
  ]);

  res.status(200).json({ message: 'Étudiant supprimé avec succès' });
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
  try {
    await prisma.creditPack.delete({ where: { id: parseInt(id, 10) } });
    res.status(200).json({ message: 'Credit pack deleted successfully' });
  } catch (error) {
    // P2003 is Prisma's Foreign Key constraint failed error
    if (error.code === 'P2003') {
      return res.status(409).json({ 
        error: 'Impossible de supprimer ce pack car il possède un historique de transactions. Désactivez-le plutôt.' 
      });
    }
    throw error;
  }
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

/**
 * Securely stream a PDF file from Cloudinary (or local) to the frontend.
 * This prevents 401/CORS issues when the browser tries to fetch the file directly
 * and allows for future permission checks.
 */
const getExamFile = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const exam = await prisma.exam.findUnique({ where: { id: parseInt(id) } });

  if (!exam) {
    return res.status(404).json({ error: 'Examen non trouvé' });
  }

  try {
    let fetchUrl = exam.fileUrl;

    if (exam.publicId) {
      const cloudinary = require('cloudinary').v2;
      const versionMatch = exam.fileUrl.match(/\/upload\/v(\d+)\//);
      const version = versionMatch ? versionMatch[1] : undefined;
      
      const isRaw = exam.fileUrl.includes('/raw/upload/');
      const detectedResourceType = isRaw ? 'raw' : 'image';

      // Use the public ID exactly as stored. If it's a raw resource and 
      // doesn't have the extension, we don't force it, as the fileUrl shows
      // it was uploaded without it. Force-adding .pdf will cause a 404.
      const publicIdForSigning = exam.publicId;

      fetchUrl = cloudinary.url(publicIdForSigning, {
        sign_url: true,
        secure: true,
        resource_type: detectedResourceType,
        version: version
      });
    }

    const response = await fetch(fetchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('Cloudinary fetch failed:', response.status, response.statusText);
      }
      throw new Error(`Erreur Cloudinary: ${response.status} ${response.statusText}`);
    }

    const buffer = await response.arrayBuffer();
    const nodeBuffer = Buffer.from(buffer);
    
    console.log(`[PDF DOWNLOAD] Size: ${nodeBuffer.length} bytes`);
    console.log(`[PDF DOWNLOAD] Header signature: ${nodeBuffer.toString('utf8', 0, 5)}`);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${exam.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf"`);
    res.send(nodeBuffer);
  } catch (error) {
    console.error('Streaming error:', error);
    res.status(500).json({ message: 'Erreur lors du chargement du PDF' });
  }
});

module.exports = {
  getAdminStats,
  getAllExams,
  createExam,
  deleteExam,
  getAllQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  getAllCreditPacks,
  createCreditPack,
  updateCreditPack,
  deleteCreditPack,
  getAllTransactions,
  getStudents,
  getStudentDetails,
  deleteStudent,
  getExamFile
};
