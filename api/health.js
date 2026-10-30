export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*');
  res.setHeader('Content-Type', 'application/json');

  const key = process.env.GEMINI_API_KEY;
  const geminiConfigured = Boolean(key && key.trim() && !key.includes('your_gemini'));

  res.status(200).json({
    status: 'ok',
    service: 'JanMithra Civic AI API',
    aiProvider: 'gemini',
    aiConfigured: geminiConfigured,
    aiModel: process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite',
    timestamp: new Date().toISOString(),
  });
}
