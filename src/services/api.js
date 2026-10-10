/**
 * API Service for contacting the AI classification backend
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

/**
 * Calls backend NVIDIA NIM classifier endpoint
 */
export async function classifyComplaint(description, hasImage = false, imageUrl = null) {
  // Only publicly reachable https URLs can be sent to the vision model (never blob: previews)
  const actualImageUrl = typeof imageUrl === 'string' && imageUrl.startsWith('https://') ? imageUrl : null;
  const isImagePresent = Boolean(hasImage || actualImageUrl);

  try {
    const response = await fetch(`${API_BASE}/api/classify-complaint`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        description: (description || '').slice(0, 1000),
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

    return {
      category: detectCategory(description),
      urgency: 'Medium',
      aiReasoning: 'Automated civic triage scheduled for initial departmental review.',
      source: 'automated-triage',
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
