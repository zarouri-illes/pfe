const prisma = require('../lib/prisma');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Credits Middleware Factory
 * Atomically checks and deducts the required number of credits.
 * Prevents race conditions by using a WHERE condition on the balance.
 * 
 * @param {number} requiredAmount - The number of credits to deduct.
 * @returns {Function} Express middleware
 */
const requireCredits = (requiredAmount) => asyncHandler(async (req, res, next) => {
  const currentBalance = req.user.creditBalance;

  if (currentBalance < requiredAmount) {
    return res.status(402).json({
      error: 'Insufficient credits',
      requiredAmount,
      currentBalance,
    });
  }

  // Atomic deduction: Update ONLY IF the balance is still >= requiredAmount
  const result = await prisma.user.updateMany({
    where: {
      id: req.user.id,
      creditBalance: {
        gte: requiredAmount,
      },
    },
    data: {
      creditBalance: {
        decrement: requiredAmount,
      },
    },
  });

  if (result.count === 0) {
    // Another concurrent request drained the balance between our read and write
    return res.status(402).json({
      error: 'Insufficient credits',
      requiredAmount,
      currentBalance: req.user.creditBalance, // Note: this might be slightly outdated, but sufficient
    });
  }

  // Deduction successful
  req.creditsSpent = requiredAmount;
  
  // Update req.user.creditBalance so the controller has the newly available balance
  req.user.creditBalance -= requiredAmount;
  
  next();
});

module.exports = { requireCredits };
