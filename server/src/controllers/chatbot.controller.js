const prisma = require('../lib/prisma');
const asyncHandler = require('../utils/asyncHandler');
const { getChatbotResponse } = require('../services/groqService');

/**
 * @route   POST /api/chatbot
 * @desc    Get AI response (costs 1 credit), supports multi-turn conversations
 * @body    { message: string, history: Array<{ role: 'user'|'model', parts: [{text}] }> }
 * @access  Private
 */
const chat = asyncHandler(async (req, res, next) => {
  // The requireCredits(1) middleware has successfully deducted 1 credit from the DB 
  // and updated req.user.creditBalance in memory before this block runs.
  const { message, history = [] } = req.body;
  const userId = req.user.id;

  try {
    const aiResponse = await getChatbotResponse(history, message);
    
    res.status(200).json({
      data: {
        text: aiResponse,
        creditBalance: req.user.creditBalance,
      },
    });
  } catch (error) {
    // If we reach this catch block, the AI API call failed for some reason
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

    if (error.isProviderUnavailable) {
      console.warn('Groq API unavailable (rate limit or quota) — see https://console.groq.com');
    } else {
      console.error('Groq API Error:', error);
    }

    const refundError = new Error('The AI service is temporarily unavailable. Your credit has been automatically refunded.');
    refundError.status = 503; 
    return next(refundError);
  }
});

module.exports = { chat };

