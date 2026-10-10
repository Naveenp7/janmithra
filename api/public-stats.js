import { getAdminDb } from './_firebaseAdmin.js';

const CACHE_MS = 60_000;
let cache = { at: 0, data: null };

const CATEGORIES = ['Road', 'Water', 'Electricity', 'Waste', 'Drainage', 'Other'];
const STATUSES = ['submitted', 'assigned', 'in_progress', 'resolved'];
const URGENCIES = ['Critical', 'High', 'Medium', 'Low'];

const toDate = (v) => (v?.toDate ? v.toDate() : v ? new Date(v) : null);

/**
 * Aggregates plus a short public feed (category, ward, description, photo). Citizen names, emails
 * and exact coordinates never leave the server.
 */
function buildStats(docs) {
  const byStatus = Object.fromEntries(STATUSES.map((s) => [s, 0]));
  const byCategory = Object.fromEntries(CATEGORIES.map((c) => [c, 0]));
  const byUrgency = Object.fromEntries(URGENCIES.map((u) => [u, 0]));
  const wards = new Map();
  const resolutionHours = [];

  const now = new Date();
  const dayKey = (d) => d.toISOString().slice(0, 10);
  const trend = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    trend.push({ date: dayKey(d), count: 0 });
  }
  const trendIndex = Object.fromEntries(trend.map((t, i) => [t.date, i]));

  const recent = [];
  let thisWeek = 0;
  const weekAgo = now.getTime() - 7 * 24 * 3600 * 1000;

  for (const doc of docs) {
    const d = doc.data();
    const status = STATUSES.includes(d.status) ? d.status : 'submitted';
    const category = CATEGORIES.includes(d.category) ? d.category : 'Other';
    byStatus[status] += 1;
    byCategory[category] += 1;
    if (URGENCIES.includes(d.urgency)) byUrgency[d.urgency] += 1;

    const ward = d.location?.ward;
    if (ward) wards.set(ward, (wards.get(ward) || 0) + 1);

    const created = toDate(d.createdAt);
    if (created) {
      if (created.getTime() >= weekAgo) thisWeek += 1;
      const idx = trendIndex[dayKey(created)];
      if (idx !== undefined) trend[idx].count += 1;
    }
    const updated = toDate(d.updatedAt);
    if (status === 'resolved' && created && updated && updated >= created) {
      resolutionHours.push((updated - created) / 3600000);
    }

    recent.push({
      category,
      urgency: URGENCIES.includes(d.urgency) ? d.urgency : 'Medium',
      status,
      ward: ward || 'Kerala',
      description: typeof d.description === 'string' ? d.description.trim().slice(0, 180) : '',
      imageUrl: typeof d.imageUrl === 'string' && d.imageUrl.startsWith('https://') ? d.imageUrl : null,
      createdAt: created ? created.toISOString() : null,
    });
  }

  recent.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

  const total = docs.length;
  const avgResolutionHours = resolutionHours.length
    ? resolutionHours.reduce((a, b) => a + b, 0) / resolutionHours.length
    : null;

  return {
    generatedAt: now.toISOString(),
    total,
    thisWeek,
    byStatus,
    byCategory,
    byUrgency,
    criticalOpen: docs.filter((x) => x.data().urgency === 'Critical' && x.data().status !== 'resolved').length,
    resolutionRate: total ? Math.round((byStatus.resolved / total) * 100) : 0,
    avgResolutionHours: avgResolutionHours === null ? null : Math.round(avgResolutionHours * 10) / 10,
    topWards: [...wards.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([ward, count]) => ({ ward, count })),
    trend,
    recent: recent.slice(0, 9),
  };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    if (cache.data && Date.now() - cache.at < CACHE_MS) {
      res.setHeader('Cache-Control', 'public, s-maxage=60');
      return res.status(200).json(cache.data);
    }

    const db = getAdminDb();
    if (!db) {
      return res.status(503).json({
        error: 'not-configured',
        message: 'Public statistics are not configured on the server yet.',
      });
    }

    const snap = await db
      .collection('complaints')
      .select('status', 'category', 'urgency', 'location.ward', 'createdAt', 'updatedAt', 'description', 'imageUrl')
      .get();

    cache = { at: Date.now(), data: buildStats(snap.docs) };
    res.setHeader('Cache-Control', 'public, s-maxage=60');
    return res.status(200).json(cache.data);
  } catch (error) {
    console.error('[public-stats] failed:', error);
    return res.status(500).json({ error: 'failed', message: 'Could not load public statistics.' });
  }
}
