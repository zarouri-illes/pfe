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
  console.log('Creating checkout for user:', user.id, 'pack:', pack.id);
  try {
    const checkout = await client.createCheckout({
      amount: pack.priceDa,
      currency: 'dzd',
      success_url: `${process.env.FRONTEND_URL}/dashboard?payment=success`,
      failure_url: `${process.env.FRONTEND_URL}/dashboard?payment=failed`,
      webhook_endpoint: `${process.env.BACKEND_URL}/api/credits/webhook`,
      metadata: {
        userId: String(user.id),
        packId: String(pack.id),
        credits: String(pack.credits)
      }
    });

    console.log('Chargily Response:', JSON.stringify(checkout, null, 2));
    return checkout.checkout_url;
  } catch (error) {
    console.error('Chargily SDK Error:', error);
    throw error;
  }
};

/**
 * Validates the HMAC SHA256 signature from Chargily's Webhook
 * @param {string} signature - the signature from req.headers['signature']
 * @param {Buffer} rawBody - the raw req.body buffer
 * @returns {boolean}
 */
const verifySignature = (signature, rawBody) => {
  if (!signature || !rawBody) {
    console.warn('Missing signature or rawBody');
    return false;
  }
  
  const secret = process.env.CHARGILY_WEBHOOK_SECRET || process.env.CHARGILY_SECRET_KEY;
  
  // Basic check: if secret looks like a URL, it's definitely wrong
  if (secret.startsWith('http')) {
    console.warn('CHARGILY_WEBHOOK_SECRET seems to be a URL instead of a secret key!');
  }

  const computedSignature = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');
    
  console.log('Computed Signature:', computedSignature);
  console.log('Received Signature:', signature);

  try {
    return crypto.timingSafeEqual(
      Buffer.from(computedSignature),
      Buffer.from(signature)
    );
  } catch (e) {
    return computedSignature === signature;
  }
};

module.exports = { client, createCheckoutSession, verifySignature };
