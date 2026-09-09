import { classifyComplaintText } from './_classifier.js';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { description, hasImage, imageUrl } = req.body || {};
    const textDesc = typeof description === 'string' ? description.trim() : '';

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
