/**
 * Vercel serverless function: GET /api/config
 * Returns public config — no auth required.
 * Set CLERK_PUBLISHABLE_KEY in Vercel environment variables.
 */
export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');
  res.json({
    success: true,
    data: {
      clerkPublishableKey: process.env.CLERK_PUBLISHABLE_KEY?.trim() ?? null,
    },
  });
}
