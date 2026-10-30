import { classifyComplaintText } from './_classifier.js';

const MAX_DESCRIPTION_LENGTH = 1000;
const MAX_IMAGE_DATA_LENGTH = 4 * 1024 * 1024; // base64 chars; Vercel's request body limit is ~4.5MB
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
    const body = req.body || {};
    const textDesc = typeof body.description === 'string' ? body.description.trim().slice(0, MAX_DESCRIPTION_LENGTH) : '';

    // Photo: either an inline data URL from the app, or a Cloudinary https URL
    const imageData =
      typeof body.imageData === 'string' && body.imageData.length <= MAX_IMAGE_DATA_LENGTH ? body.imageData : null;
    const imageUrl =
      typeof body.imageUrl === 'string' && /^https:\/\/res\.cloudinary\.com\//.test(body.imageUrl) ? body.imageUrl : null;
    const hasImage = Boolean(imageData || imageUrl || body.hasImage);

    if (!textDesc && !hasImage) {
      return res.status(400).json({ error: 'Complaint description or photo evidence is required' });
    }

    const classification = await classifyComplaintText(textDesc, { imageData, imageUrl, hasImage });
    return res.status(200).json(classification);
  } catch (error) {
    console.error('Classification error:', error);
    return res.status(200).json({
      category: 'Other',
      urgency: 'Medium',
      aiReasoning: 'Auto-classification unavailable — flagged for manual review.',
      source: 'error-fallback',
    });
  }
}
