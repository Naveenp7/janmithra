export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  const hasNimKey = Boolean(process.env.NIM_API_KEY && !process.env.NIM_API_KEY.includes('your_nvidia_nim_key'));
  const model = process.env.NIM_MODEL || 'meta/llama-3.1-8b-instruct';

  res.status(200).json({
    status: 'ok',
    service: 'JanMithra Civic AI API',
    nimConfigured: hasNimKey,
    nimModel: model,
    timestamp: new Date().toISOString(),
  });
}
