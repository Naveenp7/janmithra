/**
 * API Service for contacting the AI classification backend
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

/**
 * Calls the backend Gemini classifier.
 * @param {string} description  citizen text (may be empty when a photo is attached)
 * @param {{imageData?: string, imageUrl?: string}} [media]  photo as a data URL, or a Cloudinary https URL
 */
export async function classifyComplaint(description, media = {}) {
  const imageData = typeof media.imageData === 'string' && media.imageData.startsWith('data:image/') ? media.imageData : null;
  const imageUrl = typeof media.imageUrl === 'string' && media.imageUrl.startsWith('https://') ? media.imageUrl : null;

  try {
    const response = await fetch(`${API_BASE}/api/classify-complaint`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description: (description || '').slice(0, 1000),
        hasImage: Boolean(imageData || imageUrl),
        imageData,
        imageUrl: imageData ? null : imageUrl,
      }),
    });

    if (!response.ok) throw new Error(`Server returned ${response.status}`);
    return await response.json();
  } catch (error) {
    console.warn('[API Client] Classification request failed:', error);

    const hasPhoto = Boolean(imageData || imageUrl);
    return {
      category: detectCategory(description),
      urgency: 'Medium',
      aiReasoning: hasPhoto
        ? 'AI analysis was unavailable, so this report was flagged for manual review by an officer.'
        : 'AI analysis was unavailable; category was chosen from keywords and will be reviewed by an officer.',
      source: 'offline-fallback',
    };
  }
}

function detectCategory(text) {
  const t = (text || '').toLowerCase();
  if (/pothole|road|tar|asphalt|traffic|lane/.test(t)) return 'Road';
  if (/water|pipe|leak|tap|supply/.test(t)) return 'Water';
  if (/electric|wire|pole|light|shock|power/.test(t)) return 'Electricity';
  if (/waste|garbage|trash|dump|plastic/.test(t)) return 'Waste';
  if (/drain|drainage|gutter|sewage|manhole/.test(t)) return 'Drainage';
  return 'Other';
}

/**
 * Checks API server health
 */
export async function checkApiHealth() {
  try {
    const res = await fetch(`${API_BASE}/api/health`);
    if (!res.ok) return { status: 'down' };
    return await res.json();
  } catch (e) {
    return { status: 'unreachable' };
  }
}

/**
 * Public, aggregate-only statistics for the whole system (served by /api/public-stats)
 */
export async function fetchPublicStats() {
  const res = await fetch(`${API_BASE}/api/public-stats`);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(body.message || 'Could not load public statistics.');
    err.code = body.error || 'failed';
    throw err;
  }
  return body;
}
