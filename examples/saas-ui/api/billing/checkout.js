/**
 * POST /api/billing/checkout — Vercel serverless function.
 * Creates a Stripe Checkout session in subscription mode.
 *
 * Validates priceId against an allowlist and enforces same-origin
 * redirect URLs. CORS restricted to known origins.
 *
 * Required env vars (set in Vercel dashboard):
 *   STRIPE_SECRET_KEY — sk_test_... or sk_live_...
 */
import Stripe from 'stripe';

// ── Allowlists ────────────────────────────────────────────────────────

const ALLOWED_PRICE_IDS = new Set([
  'price_1TAsLJ2QpzdUwTFgn4OhkLig', // Starter $29/mo
  'price_1TAsLK2QpzdUwTFgqe4HP5Jh', // Pro $79/mo
  'price_1TAsLK2QpzdUwTFgZQQ56NrE', // Enterprise $199/mo
]);

const ALLOWED_ORIGINS = [
  'https://ui.spectredve.com',
  'http://localhost:8080',
  'http://localhost:3000',
  'http://localhost:3100',
  'http://127.0.0.1:8080',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3100',
];

// ── Helpers ───────────────────────────────────────────────────────────

function getCorsOrigin(req) {
  const raw = req.headers.origin || '';
  if (ALLOWED_ORIGINS.includes(raw)) return raw;
  // Try extracting origin from referer
  const ref = req.headers.referer || '';
  try {
    const candidate = new URL(ref).origin;
    if (ALLOWED_ORIGINS.includes(candidate)) return candidate;
  } catch { /* not a valid URL */ }
  return null;
}

function isAllowedRedirectUrl(url, requestOrigin) {
  try {
    const urlOrigin = new URL(url).origin;
    if (urlOrigin === requestOrigin) return true;
    if (ALLOWED_ORIGINS.includes(urlOrigin)) return true;
  } catch { /* invalid URL */ }
  return false;
}

// ── Handler ───────────────────────────────────────────────────────────

export default async function handler(req, res) {
  const corsOrigin = getCorsOrigin(req);

  // Set CORS headers only for allowed origins
  if (corsOrigin) {
    res.setHeader('Access-Control-Allow-Origin', corsOrigin);
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { priceId, successUrl, cancelUrl } = req.body || {};

  // Validate priceId
  if (!priceId || !ALLOWED_PRICE_IDS.has(priceId)) {
    return res.status(400).json({ error: 'Invalid or missing priceId' });
  }

  const requestOrigin = corsOrigin || 'https://ui.spectredve.com';

  // Validate redirect URLs if provided
  if (successUrl && !isAllowedRedirectUrl(successUrl, requestOrigin)) {
    return res.status(400).json({ error: 'Invalid successUrl: must be same-origin' });
  }
  if (cancelUrl && !isAllowedRedirectUrl(cancelUrl, requestOrigin)) {
    return res.status(400).json({ error: 'Invalid cancelUrl: must be same-origin' });
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return res.status(500).json({ error: 'Stripe not configured' });
  }

  try {
    const stripe = new Stripe(secretKey);
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl || `${requestOrigin}/?checkout=success`,
      cancel_url: cancelUrl || `${requestOrigin}/?checkout=cancel`,
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Checkout session creation failed' });
  }
}
