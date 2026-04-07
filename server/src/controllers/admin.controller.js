const prisma = require('../lib/prisma');
const asyncHandler = require('../utils/asyncHandler');
const { uploadBufferToCloudinary, deleteFromCloudinary, extractPublicId } = require('../services/cloudinaryService');

/**
 * @route   POST /api/admin/exams
 * @desc    Upload an exam PDF directly to Cloudinary and create the SQL record
 */
const createExam = asyncHandler(async (req, res) => {
  const { title, subjectId, year, stream, type } = req.body;
  
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
      type
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

  await prisma.question.delete({ where: { id: parseInt(id, 10) } });
  res.status(200).json({ message: 'Question deleted successfully' });
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
  const exams = await prisma.exam.findMany({
    include: { subject: { select: { name: true } } },
    orderBy: { uploadedAt: 'desc' },
  });
  res.status(200).json({ data: exams });
});

/**
 * @route   GET /api/admin/questions
 * @desc    List all questions with optional chapterId filter
 */
const getAllQuestions = asyncHandler(async (req, res) => {
  const { chapterId } = req.query;
  const where = chapterId ? { chapterId: parseInt(chapterId, 10) } : {};

  const questions = await prisma.question.findMany({
    where,
    include: { chapter: { select: { name: true, subject: { select: { name: true } } } } },
    orderBy: { id: 'desc' },
  });
  res.status(200).json({ data: questions });
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

module.exports = {
  getAllExams,
  createExam,
  deleteExam,
  getAllQuestions,
  createQuestion,
  deleteQuestion,
  createCreditPack,
  updateCreditPack,
  deleteCreditPack
};
