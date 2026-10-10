import { classifyComplaintText } from './_classifier.js';

const MAX_DESCRIPTION_LENGTH = 1000;
const RATE_LIMIT = { windowMs: 60_000, max: 12 };
const hits = new Map(); // best-effort, per server instance

function isRateLimited(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < RATE_LIMIT.windowMs);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > RATE_LIMIT.max;
}

export default async function handler(req, res) {
  // CORS: set ALLOWED_ORIGIN (e.g. https://your-app.vercel.app) in production; '*' only for local dev
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
  if (isRateLimited(ip)) {
    return res.status(429).json({ error: 'Too many requests. Please wait a minute and try again.' });
  }

  try {
    const { description, hasImage } = req.body || {};
    const textDesc = typeof description === 'string' ? description.trim().slice(0, MAX_DESCRIPTION_LENGTH) : '';
    // Only accept https image URLs hosted on Cloudinary (what the app uploads to)
    const imageUrl =
      typeof req.body?.imageUrl === 'string' && /^https:\/\/res\.cloudinary\.com\//.test(req.body.imageUrl)
        ? req.body.imageUrl
        : null;

    if (!textDesc && !hasImage && !imageUrl) {
      return res.status(400).json({ error: 'Complaint description or photo evidence is required' });
    }

    const safeDescription = textDesc || 'Civic issue reported via on-site photo evidence.';

    const classification = await classifyComplaintText(
      safeDescription,
      Boolean(hasImage || imageUrl),
      imageUrl || null
    );
    return res.status(200).json(classification);
  } catch (error) {
    console.error('Classification error:', error);
    return res.status(200).json({
      category: 'Other',
      urgency: 'Medium',
      aiReasoning: 'Auto-classification unavailable — please review manually.',
      source: 'error-fallback',
    });
  }
}
