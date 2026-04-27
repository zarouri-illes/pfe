const { ChargilyClient } = require('@chargily/chargily-pay');
const crypto = require('crypto');

function resolveChargilyMode() {
  const explicit = process.env.CHARGILY_MODE;
  if (explicit === 'live' || explicit === 'test') return explicit;
  return process.env.NODE_ENV === 'production' ? 'live' : 'test';
}

const client = new ChargilyClient({
  api_key: process.env.CHARGILY_SECRET_KEY,
  mode: resolveChargilyMode(),
});

/**
 * Use the checkout URL exactly as Chargily returns it (only normalize http→https).
 * Rewriting hostnames (.com → .net, etc.) can break the hosted pay page (CSS/JS or routing).
 */
function normalizeCheckoutUrl(url) {
  if (!url || typeof url !== 'string') return url;
  const trimmed = url.trim();
  if (trimmed.startsWith('http://')) {
    return `https://${trimmed.slice('http://'.length)}`;
  }
  return trimmed;
}

/**
 * Creates a checkout session for a credit pack
 */
const createCheckoutSession = async (user, pack) => {
  const base = (process.env.FRONTEND_URL || '').replace(/\/$/, '');
  if (!base.startsWith('http')) {
    throw new Error('FRONTEND_URL must be a full URL (https://...) for Chargily redirects');
  }

  const backend = (process.env.BACKEND_URL || '').replace(/\/$/, '');
  if (!backend.startsWith('http')) {
    throw new Error('BACKEND_URL must be a full public https URL so Chargily can call your webhook');
  }

  try {
    const checkout = await client.createCheckout({
      amount: pack.priceDa,
      currency: 'dzd',
      success_url: `${base}/payment-success`,
      failure_url: `${base}/payment-fail`,
      webhook_endpoint: `${backend}/api/credits/webhook`,
      description: `Crédits BacPrep — ${pack.name}`,
      locale: process.env.CHARGILY_LOCALE === 'en' || process.env.CHARGILY_LOCALE === 'ar' ? process.env.CHARGILY_LOCALE : 'fr',
      metadata: {
        userId: String(user.id),
        packId: String(pack.id),
        credits: String(pack.credits)
      }
    });

    return normalizeCheckoutUrl(checkout.checkout_url);
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
    return false;
  }

  const webhookSecret = process.env.CHARGILY_WEBHOOK_SECRET;
  const secretKey = process.env.CHARGILY_SECRET_KEY;
  const finalSecret =
    !webhookSecret || webhookSecret.startsWith('http') || webhookSecret.includes('YOUR_BACKEND')
      ? secretKey
      : webhookSecret;

  if (!finalSecret || typeof finalSecret !== 'string') {
    return false;
  }

  const computedHex = crypto.createHmac('sha256', finalSecret).update(rawBody).digest('hex');

  let received = String(signature).trim();
  if (received.startsWith('sha256=')) {
    received = received.slice(7).trim();
  }

  // Timing-safe compare (hex-encoded HMAC, same length)
  try {
    const a = Buffer.from(received, 'hex');
    const b = Buffer.from(computedHex, 'hex');
    if (a.length !== b.length || a.length === 0) {
      return false;
    }
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
};

module.exports = { client, createCheckoutSession, verifySignature };
