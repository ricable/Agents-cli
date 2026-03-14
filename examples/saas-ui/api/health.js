/**
 * Vercel serverless function: GET /api/health
 * Returns server status — no auth required.
 */
export default function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.json({ ok: true, ts: Date.now() });
}
