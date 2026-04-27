const prisma = require('../lib/prisma');
const asyncHandler = require('../utils/asyncHandler');
const { getChatbotResponse } = require('../services/geminiService');

/**
 * @route   POST /api/chatbot
 * @desc    Get AI response (costs 1 credit)
 * @access  Private
 */
const chat = asyncHandler(async (req, res, next) => {
  // The requireCredits(1) middleware has successfully deducted 1 credit from the DB 
  // and updated req.user.creditBalance in memory before this block runs.
  const { message } = req.body;
  const userId = req.user.id;

  try {
    const aiResponse = await getChatbotResponse(message);
    
    res.status(200).json({
      data: {
        text: aiResponse,
        creditBalance: req.user.creditBalance,
      },
    });
  } catch (error) {
    // If we reach this catch block, the Gemini API call failed for some reason
    // (rate limits, network timeout, strict safety block, etc.) 
    // AND the student has already lost a credit. We MUST issue a refund.
    await prisma.user.update({
      where: { id: userId },
      data: {
        creditBalance: {
          increment: 1,
        },
      },
    });
    req.user.creditBalance += 1;

    console.error('Gemini API Error:', error);

    const refundError = new Error('The AI service is temporarily unavailable. Your credit has been automatically refunded.');
    refundError.status = 503; 
    return next(refundError);
  }
});

module.exports = { chat };
