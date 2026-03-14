/**
 * Vercel serverless function: POST /api/billing/checkout
 * Creates a Stripe Checkout session and returns the redirect URL.
 *
 * Required env vars (set in Vercel dashboard):
 *   STRIPE_SECRET_KEY — sk_test_... or sk_live_...
 */
import Stripe from 'stripe';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

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

  const stripe = new Stripe(secretKey);
  const { priceId, successUrl, cancelUrl } = req.body || {};

  if (!priceId) {
    return res.status(400).json({ success: false, error: 'priceId is required' });
  }

  const origin = req.headers.origin || req.headers.referer?.replace(/\/$/, '') || 'https://ui.spectredve.com';
  const success = successUrl || `${origin}/?checkout=success`;
  const cancel = cancelUrl || origin;

  try {
    const session = await stripe.checkout.sessions.create({
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: success,
      cancel_url: cancel,
    });

    return res.status(200).json({ success: true, data: { url: session.url } });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Checkout failed';
    return res.status(400).json({ success: false, error: message });
  }
}
