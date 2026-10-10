import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { useAuth } from '../../context/AuthContext.jsx';
import { fetchPublicStats } from '../../services/api.js';
import { StatCard, Spinner, Alert, CategoryChip, formatDate } from '../../components/ui.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import UrgencyBadge from '../../components/UrgencyBadge.jsx';
import {
  PlusCircle,
  ListChecks,
  Inbox,
  Clock,
  Wrench,
  CheckCircle2,
  Flame,
  MapPin,
  Timer,
  ChevronRight,
  RefreshCw,
  ImageOff,
} from 'lucide-react';

const CATEGORY_COLORS = {
  Road: '#186a42',
  Water: '#0284c7',
  Electricity: '#f59e0b',
  Waste: '#84cc16',
  Drainage: '#8b5cf6',
  Other: '#64748b',
};
const STATUS_META = {
  submitted: { label: 'Submitted', color: '#94a3b8' },
  assigned: { label: 'Assigned', color: '#3b82f6' },
  in_progress: { label: 'In progress', color: '#f59e0b' },
  resolved: { label: 'Resolved', color: '#2a9d62' },
};

function Panel({ title, subtitle, children, className = '' }) {
  return (
    <section className={`card p-5 sm:p-6 ${className}`}>
      <h2 className="text-sm font-extrabold text-slate-900">{title}</h2>
      {subtitle && <p className="text-xs text-slate-500 mt-0.5 mb-4">{subtitle}</p>}
      {!subtitle && <div className="mb-4" />}
      {children}
    </section>
  );
}

function formatDuration(hours) {
  if (hours === null || hours === undefined) return '—';
  if (hours < 48) return `${Math.round(hours)}h`;
  return `${Math.round(hours / 24)}d`;
}

export default function PublicOverview() {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      setStats(await fetchPublicStats());
      setError(null);
    } catch (err) {
      setError(
        err.code === 'not-configured'
          ? 'Live statistics are not switched on yet. The administrator needs to add the Firebase service account on the server.'
          : err.message
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(() => load(true), 60_000);
    return () => clearInterval(t);
  }, [load]);

  const statusData = stats
    ? Object.entries(STATUS_META)
        .map(([key, m]) => ({ name: m.label, value: stats.byStatus[key] || 0, color: m.color }))
        .filter((d) => d.value > 0)
    : [];
  const categoryMax = stats ? Math.max(1, ...Object.values(stats.byCategory)) : 1;
  const open = stats ? stats.total - stats.byStatus.resolved : 0;

  return (
    <div>
      {/* Hero */}
      <div className="rounded-3xl bg-gradient-to-br from-brand-800 via-brand-700 to-brand-600 text-white p-6 sm:p-8 mb-6 relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-56 h-56 rounded-full bg-white/5" aria-hidden="true" />
        <div className="absolute right-16 -bottom-16 w-44 h-44 rounded-full bg-white/5" aria-hidden="true" />
        <div className="relative max-w-xl">
          <p className="text-xs font-bold uppercase tracking-wider text-brand-200 mb-2">Public overview</p>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {currentUser ? `Welcome, ${currentUser.name?.split(' ')[0]}.` : 'Report. Track. Resolve.'}
          </h1>
          <p className="mt-2 text-sm text-white/80 leading-relaxed">
            See how Kerala's civic issues are being handled in real time — every number below is live from the
            platform. Your voice helps build a cleaner, safer Kerala.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link to="/citizen" className="btn bg-white text-brand-900 hover:bg-brand-50">
              <PlusCircle className="w-4 h-4" /> Report an issue
            </Link>
            <Link to="/citizen/my-complaints" className="btn bg-white/10 hover:bg-white/20 text-white border border-white/25">
              <ListChecks className="w-4 h-4" /> Track my complaints
            </Link>
          </div>
        </div>
      </div>

      {loading ? (
        <Spinner label="Loading live statistics…" />
      ) : error ? (
        <Alert tone="warning" className="max-w-2xl">
          {error}
        </Alert>
      ) : (
        <div className="space-y-5">
          {/* KPI tiles */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <StatCard label="Total reports" value={stats.total} icon={Inbox} tone="slate" hint={`${stats.thisWeek} this week`} />
            <StatCard label="Awaiting review" value={stats.byStatus.submitted} icon={Clock} tone="amber" />
            <StatCard
              label="In progress"
              value={stats.byStatus.assigned + stats.byStatus.in_progress}
              icon={Wrench}
              tone="blue"
            />
            <StatCard label="Resolved" value={stats.byStatus.resolved} icon={CheckCircle2} tone="green" hint={`${stats.resolutionRate}% resolution rate`} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Category breakdown */}
            <Panel title="Issues by category" subtitle="Where citizens are reporting problems" className="lg:col-span-2">
              <ul className="space-y-3">
                {Object.entries(stats.byCategory).map(([cat, count]) => (
                  <li key={cat} className="flex items-center gap-3 text-sm">
                    <span className="w-24 font-semibold text-slate-700 flex-shrink-0">{cat}</span>
                    <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${(count / categoryMax) * 100}%`, background: CATEGORY_COLORS[cat] }}
                      />
                    </div>
                    <span className="w-16 text-right text-xs font-bold text-slate-600">
                      {count}
                      <span className="font-medium text-slate-400"> · {stats.total ? Math.round((count / stats.total) * 100) : 0}%</span>
                    </span>
                  </li>
                ))}
              </ul>
            </Panel>

            {/* Status donut */}
            <Panel title="Status breakdown" subtitle="Current state of all reports">
              {statusData.length === 0 ? (
                <p className="text-sm text-slate-400 py-10 text-center">No reports yet.</p>
              ) : (
                <>
                  <div className="relative h-44">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={52} outerRadius={78} paddingAngle={3} stroke="none">
                          {statusData.map((d) => (
                            <Cell key={d.name} fill={d.color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-2xl font-extrabold text-slate-900">{stats.total}</span>
                      <span className="text-[11px] text-slate-500">total</span>
                    </div>
                  </div>
                  <ul className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
                    {statusData.map((d) => (
                      <li key={d.name} className="flex items-center gap-2 text-slate-600">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                        {d.name} <strong className="ml-auto text-slate-900">{d.value}</strong>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </Panel>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Service performance */}
            <Panel title="Service performance" subtitle="How the authorities are doing">
              <dl className="space-y-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <dt className="flex items-center gap-2 text-slate-600"><CheckCircle2 className="w-4 h-4 text-brand-600" /> Resolution rate</dt>
                  <dd className="font-extrabold text-slate-900">{stats.resolutionRate}%</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="flex items-center gap-2 text-slate-600"><Timer className="w-4 h-4 text-blue-600" /> Avg. time to resolve</dt>
                  <dd className="font-extrabold text-slate-900">{formatDuration(stats.avgResolutionHours)}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="flex items-center gap-2 text-slate-600"><Flame className="w-4 h-4 text-rose-600" /> Critical issues open</dt>
                  <dd className="font-extrabold text-slate-900">{stats.criticalOpen}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="flex items-center gap-2 text-slate-600"><Wrench className="w-4 h-4 text-amber-600" /> Open reports</dt>
                  <dd className="font-extrabold text-slate-900">{open}</dd>
                </div>
              </dl>
            </Panel>

            {/* 7-day trend */}
            <Panel title="Reports this week" subtitle="New reports per day">
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.trend.map((t) => ({ ...t, day: new Date(t.date).toLocaleDateString('en-IN', { weekday: 'short' }) }))} margin={{ top: 4, right: 0, left: -28, bottom: 0 }}>
                    <XAxis dataKey="day" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip formatter={(v) => [`${v} reports`, '']} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} cursor={{ fill: '#f1f5f9' }} />
                    <Bar dataKey="count" fill="#2a9d62" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Panel>

            {/* Top wards */}
            <Panel title="Busiest wards" subtitle="Most reports by area">
              {stats.topWards.length === 0 ? (
                <p className="text-sm text-slate-400 py-6 text-center">No location data yet.</p>
              ) : (
                <ol className="space-y-2.5">
                  {stats.topWards.map((w, i) => (
                    <li key={w.ward} className="flex items-center gap-3 text-sm">
                      <span className="w-6 h-6 rounded-full bg-brand-50 text-brand-700 text-xs font-extrabold flex items-center justify-center">{i + 1}</span>
                      <span className="flex items-center gap-1 min-w-0 flex-1 text-slate-700 font-semibold">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span className="truncate">{w.ward}</span>
                      </span>
                      <span className="text-xs font-bold text-slate-500">{w.count}</span>
                    </li>
                  ))}
                </ol>
              )}
            </Panel>
          </div>

          {/* Public feed: what people are reporting */}
          <Panel
            title="What people are reporting"
            subtitle="Latest issues across the state. Reporters' names and contact details are never shown."
          >
            {stats.recent.length === 0 ? (
              <p className="text-sm text-slate-400 py-6 text-center">No reports yet — be the first to report an issue.</p>
            ) : (
              <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {stats.recent.map((r, i) => (
                  <li key={i} className="rounded-2xl border border-slate-200 bg-white overflow-hidden flex flex-col">
                    <div className="h-40 bg-slate-100 flex items-center justify-center">
                      {r.imageUrl ? (
                        <img src={r.imageUrl} alt={`${r.category} issue in ${r.ward}`} loading="lazy" className="w-full h-full object-cover" />
                      ) : (
                        <ImageOff className="w-7 h-7 text-slate-300" />
                      )}
                    </div>
                    <div className="p-4 flex-1 flex flex-col gap-2.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <CategoryChip category={r.category} />
                        <UrgencyBadge urgency={r.urgency} size="sm" />
                      </div>
                      <p className="text-sm text-slate-800 font-medium leading-snug line-clamp-3">
                        {r.description || 'Issue reported with a photo.'}
                      </p>
                      <div className="mt-auto pt-2 flex items-center justify-between gap-2 text-xs text-slate-500">
                        <span className="flex items-center gap-1 min-w-0">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span className="truncate">{r.ward}</span>
                        </span>
                        <span className="flex-shrink-0">{formatDate(r.createdAt, false)}</span>
                      </div>
                      <StatusBadge status={r.status} size="sm" />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>Updated {formatDate(stats.generatedAt)}</span>
            <button type="button" onClick={() => load(true)} className="inline-flex items-center gap-1.5 font-semibold text-brand-700 hover:underline cursor-pointer">
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
        <Link to="/citizen" className="card p-4 flex items-center gap-4 hover:border-brand-300 transition">
          <div className="w-11 h-11 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center"><PlusCircle className="w-5 h-5" /></div>
          <div className="flex-1">
            <div className="text-sm font-bold text-slate-900">Report a new issue</div>
            <div className="text-xs text-slate-500">Photo, description and location in under a minute</div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-300" />
        </Link>
        <Link to="/citizen/my-complaints" className="card p-4 flex items-center gap-4 hover:border-brand-300 transition">
          <div className="w-11 h-11 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center"><ListChecks className="w-5 h-5" /></div>
          <div className="flex-1">
            <div className="text-sm font-bold text-slate-900">Track my complaints</div>
            <div className="text-xs text-slate-500">Live status of everything you have reported</div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-300" />
        </Link>
      </div>
    </div>
  );
}
