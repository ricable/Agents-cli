/**
 * Vercel serverless function: POST /api/billing/checkout
 * Creates a Stripe Checkout session and returns the redirect URL.
 *
 * Required env vars (set in Vercel dashboard):
 *   STRIPE_SECRET_KEY — sk_test_... or sk_live_...
 */
import Stripe from 'stripe';

const PRICE_TO_TIER = {
  'price_1TAsLJ2QpzdUwTFgn4OhkLig': 'starter',   // $29/mo (original)
  'price_1TAsLK2QpzdUwTFgqe4HP5Jh': 'pro',       // $79/mo (original)
  'price_1TAsLK2QpzdUwTFgZQQ56NrE': 'enterprise', // $199/mo (original)
  'price_1TAumR2QpzdUwTFgUWWQsbTe': 'starter',   // $14.99/mo (50% OFF launch promo)
  'price_1TAumW2QpzdUwTFgMyJIn89A': 'pro',       // $39.99/mo (50% OFF launch promo)
  'price_1TAumX2QpzdUwTFgDDWYS4V8': 'enterprise', // $99/mo (50% OFF launch promo)
};

// Reuse client across warm invocations (module scope persists in Vercel containers)
let stripeClient = null;

const ALLOWED_ORIGINS = new Set([
  'https://ui.spectredve.com',
  'http://localhost:8080',
  'http://localhost:3000',
  'http://127.0.0.1:8080',
]);

function isAllowedOrigin(origin) {
  return origin && ALLOWED_ORIGINS.has(origin);
}

function isSameOrigin(url, origin) {
  try {
    const parsed = new URL(url);
    const originParsed = new URL(origin);
    return parsed.origin === originParsed.origin;
  } catch {
    return false;
  }
}

export default async function handler(req, res) {
  const origin = req.headers.origin || '';
  const corsOrigin = isAllowedOrigin(origin) ? origin : 'https://ui.spectredve.com';

  res.setHeader('Access-Control-Allow-Origin', corsOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Vary', 'Origin');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return res.status(500).json({ success: false, error: 'Stripe not configured' });
  }

  const { priceId, successUrl, cancelUrl } = req.body || {};

  if (!priceId) {
    return res.status(400).json({ success: false, error: 'priceId is required' });
  }

  if (!(priceId in PRICE_TO_TIER)) {
    return res.status(400).json({ success: false, error: 'Invalid priceId' });
  }

  // Determine a safe origin for redirect URLs
  const requestOrigin = isAllowedOrigin(origin) ? origin : 'https://ui.spectredve.com';

  // Validate redirect URLs are same-origin (prevent open redirect)
  const success_url = (successUrl && isSameOrigin(successUrl, requestOrigin))
    ? successUrl
    : `${requestOrigin}/?checkout=success`;
  const cancel_url = (cancelUrl && isSameOrigin(cancelUrl, requestOrigin))
    ? cancelUrl
    : requestOrigin;

  stripeClient ??= new Stripe(secretKey);
  const stripe = stripeClient;

  try {
    const meta = { priceId, tier: PRICE_TO_TIER[priceId] };
    const session = await stripe.checkout.sessions.create({
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url,
      cancel_url,
      metadata: meta,
      subscription_data: { metadata: meta },
    });

    return res.status(200).json({ success: true, data: { url: session.url } });
  } catch (err) {
    console.error('[checkout] Stripe error:', err?.message ?? err);
    return res.status(400).json({ success: false, error: 'Checkout session creation failed' });
  }
}
