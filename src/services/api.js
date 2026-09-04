/**
 * API Service for contacting the AI classification backend
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

/**
 * Calls backend NVIDIA NIM classifier endpoint
 */
export async function classifyComplaint(description, hasImage = false, imageUrl = null) {
  const actualImageUrl =
    typeof hasImage === 'string' && hasImage.startsWith('http')
      ? hasImage
      : typeof imageUrl === 'string' && imageUrl.startsWith('http')
      ? imageUrl
      : null;
  const isImagePresent = Boolean(hasImage || actualImageUrl);

  try {
    const response = await fetch(`${API_BASE}/api/classify-complaint`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        description,
        hasImage: isImagePresent,
        imageUrl: actualImageUrl,
      }),
    });

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.warn('[API Client] Backend classification request failed, using client-side heuristic:', error);

    // Client-side instant fallback in case backend is completely offline
    return {
      category: detectCategory(description),
      urgency: 'Medium',
      aiReasoning: 'Auto-classification computed locally (server offline fallback).',
      source: 'client-fallback',
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
