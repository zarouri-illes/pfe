const { ChargilyClient } = require('@chargily/chargily-pay');
const crypto = require('crypto');

const client = new ChargilyClient({
  api_key: process.env.CHARGILY_SECRET_KEY,
  mode: process.env.NODE_ENV === 'production' ? 'live' : 'test',
});

/**
 * Creates a checkout session for a credit pack
 */
const createCheckoutSession = async (user, pack) => {
  const checkout = await client.createCheckout({
    amount: pack.priceDa,
    currency: 'dzd',
    success_url: `${process.env.FRONTEND_URL}/dashboard?payment=success`,
    failure_url: `${process.env.FRONTEND_URL}/dashboard?payment=failed`,
    webhook_endpoint: `${process.env.BACKEND_URL}/api/credits/webhook`,
    metadata: {
      userId: user.id,
      packId: pack.id,
      credits: pack.credits
    }
  });

  return checkout.checkout_url;
};

/**
 * Validates the HMAC SHA256 signature from Chargily's Webhook
 * @param {string} signature - the signature from req.headers['signature']
 * @param {Buffer} rawBody - the raw req.body buffer
 * @returns {boolean}
 */
const verifySignature = (signature, rawBody) => {
  if (!signature || !rawBody) return false;
  
  const computedSignature = crypto
    .createHmac('sha256', process.env.CHARGILY_WEBHOOK_SECRET || process.env.CHARGILY_SECRET_KEY)
    .update(rawBody)
    .digest('hex');
    
  // Using timingSafeEqual is a best practice to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(computedSignature),
      Buffer.from(signature)
    );
  } catch (e) {
    // Fallback if lengths differ or Buffer.from throws
    return computedSignature === signature;
  }
};

module.exports = { client, createCheckoutSession, verifySignature };
