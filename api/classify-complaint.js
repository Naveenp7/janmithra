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

    if (!description || typeof description !== 'string') {
      return res.status(400).json({ error: 'Complaint description is required' });
    }

    const classification = await classifyComplaintText(
      description,
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
