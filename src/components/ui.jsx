import React from 'react';
import { Link } from 'react-router-dom';
import { Loader2, AlertTriangle, CheckCircle2, Info } from 'lucide-react';

export function PageHeader({ eyebrow, title, subtitle, actions }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
      <div className="min-w-0">
        {eyebrow && (
          <div className="text-[11px] font-bold uppercase tracking-wider text-brand-700 mb-1">{eyebrow}</div>
        )}
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-1 max-w-2xl">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}

const TONES = {
  slate: { box: 'bg-slate-100 text-slate-600', card: 'bg-white' },
  green: { box: 'bg-brand-100 text-brand-700', card: 'bg-brand-50/50' },
  blue: { box: 'bg-blue-100 text-blue-700', card: 'bg-blue-50/50' },
  amber: { box: 'bg-amber-100 text-amber-700', card: 'bg-amber-50/50' },
  rose: { box: 'bg-rose-100 text-rose-700', card: 'bg-rose-50/50' },
};

export function StatCard({ label, value, icon: Icon, tone = 'slate', hint }) {
  const t = TONES[tone] || TONES.slate;
  return (
    <div className={`card p-4 sm:p-5 flex items-center gap-3 sm:gap-4 ${t.card}`}>
      {Icon && (
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${t.box}`}>
          <Icon className="w-5 h-5" />
        </div>
      )}
      <div className="min-w-0">
        <div className="text-2xl font-extrabold text-slate-900 leading-none">{value}</div>
        <div className="text-xs font-semibold text-slate-600 mt-1.5 truncate">{label}</div>
        {hint && <div className="text-[11px] text-slate-400 mt-0.5 truncate">{hint}</div>}
      </div>
    </div>
  );
}

export function Spinner({ label = 'Loading…' }) {
  return (
    <div className="py-16 flex flex-col items-center justify-center text-center">
      <Loader2 className="w-8 h-8 text-brand-600 animate-spin mb-3" />
      <p className="text-sm font-medium text-slate-500">{label}</p>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, text, actionLabel, actionTo }) {
  return (
    <div className="card p-10 text-center max-w-lg mx-auto">
      {Icon && (
        <div className="w-14 h-14 bg-brand-50 text-brand-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Icon className="w-7 h-7" />
        </div>
      )}
      <h3 className="text-base font-bold text-slate-900 mb-1">{title}</h3>
      {text && <p className="text-sm text-slate-500 mb-5">{text}</p>}
      {actionTo && (
        <Link to={actionTo} className="btn-primary">
          {actionLabel}
        </Link>
      )}
    </div>
  );
}

const ALERT_STYLES = {
  error: { cls: 'bg-rose-50 border-rose-200 text-rose-800', icon: AlertTriangle, ic: 'text-rose-600' },
  success: { cls: 'bg-emerald-50 border-emerald-200 text-emerald-800', icon: CheckCircle2, ic: 'text-emerald-600' },
  info: { cls: 'bg-blue-50 border-blue-200 text-blue-800', icon: Info, ic: 'text-blue-600' },
  warning: { cls: 'bg-amber-50 border-amber-200 text-amber-900', icon: AlertTriangle, ic: 'text-amber-600' },
};

export function Alert({ tone = 'info', children, className = '' }) {
  const s = ALERT_STYLES[tone] || ALERT_STYLES.info;
  const Icon = s.icon;
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={`p-3.5 border rounded-xl text-sm flex items-start gap-3 ${s.cls} ${className}`}
    >
      <Icon className={`w-5 h-5 flex-shrink-0 mt-px ${s.ic}`} />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export const CATEGORIES = ['Road', 'Water', 'Electricity', 'Waste', 'Drainage', 'Other'];

export const STATUS_OPTIONS = [
  { key: 'submitted', label: 'Submitted' },
  { key: 'assigned', label: 'Assigned' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'resolved', label: 'Resolved' },
];

export function formatDate(value, withTime = true) {
  if (!value) return 'Recent';
  const opts = { day: 'numeric', month: 'short', year: 'numeric' };
  if (withTime) Object.assign(opts, { hour: '2-digit', minute: '2-digit' });
  return new Date(value).toLocaleDateString('en-IN', opts);
}

export function CategoryChip({ category }) {
  return (
    <span className="px-2.5 py-0.5 text-xs font-bold rounded-lg bg-brand-50 text-brand-800 border border-brand-200">
      {category || 'Other'}
    </span>
  );
}
