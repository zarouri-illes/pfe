const prisma = require('../lib/prisma');
const asyncHandler = require('../utils/asyncHandler');
const { createCheckoutSession, verifySignature } = require('../services/chargilyService');

/**
 * @route   GET /api/credits/packs
 * @desc    Get all active credit packs
 * @access  Private
 */
const getAvailablePacks = asyncHandler(async (req, res) => {
  const packs = await prisma.creditPack.findMany({
    where: { isActive: true },
    orderBy: { id: 'asc' },
  });
  
  res.status(200).json({ data: packs });
});

/**
 * @route   POST /api/credits/checkout
 * @desc    Generate a checkout URL
 * @access  Private
 */
const createCheckout = asyncHandler(async (req, res) => {
  const { packId } = req.body;
  
  const pack = await prisma.creditPack.findUnique({
    where: { id: parseInt(packId, 10) },
  });

  if (!pack || !pack.isActive) {
    return res.status(404).json({ error: 'Credit pack not found or inactive' });
  }

  // Generate checkout session
  const checkoutUrl = await createCheckoutSession(req.user, pack);

  res.status(200).json({ checkoutUrl });
});

/**
 * @route   POST /api/credits/webhook
 * @desc    Chargily Webhook receiver for successful payments
 * @access  Public (Protected by HMAC Signature)
 */
const handleWebhook = asyncHandler(async (req, res) => {
  const signature = req.headers.signature;
  const rawBody = req.body;

  // 1. Verify cryptographic signature
  if (!verifySignature(signature, rawBody)) {
    return res.status(403).json({ error: 'Invalid signature' });
  }

  // 2. Parse the safely verified raw body
  let eventData;
  try {
    eventData = JSON.parse(rawBody.toString('utf-8'));
  } catch (err) {
    return res.status(400).json({ error: 'Invalid JSON payload' });
  }

  // 3. Process the event
  if (eventData.type === 'checkout.paid') {
    const checkout = eventData.data;
    const { userId, packId, credits } = checkout.metadata;
    const chargilyId = checkout.id;

    // Check idempotency (ensure we haven't processed this transaction already)
    const existingTx = await prisma.transaction.findUnique({
      where: { chargilyId },
    });

    if (!existingTx) {
      // Create transaction and award credits atomically
      await prisma.$transaction([
        prisma.transaction.create({
          data: {
            userId: parseInt(userId, 10),
            creditPackId: parseInt(packId, 10),
            chargilyId: chargilyId,
            amountDa: parseFloat(checkout.amount),
            status: 'COMPLETED',
          },
        }),
        prisma.user.update({
          where: { id: parseInt(userId, 10) },
          data: { creditBalance: { increment: parseInt(credits, 10) } },
        }),
      ]);
    }
  }

  // Acknowledge receipt to Chargily quickly
  res.status(200).send('Webhook received');
});

module.exports = { getAvailablePacks, createCheckout, handleWebhook };
