import React from 'react';
import { Clock, UserCheck, Wrench, CheckCircle2 } from 'lucide-react';

const STATUS_CONFIG = {
  submitted: {
    label: 'Submitted',
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
    dot: 'bg-slate-400',
    icon: Clock,
  },
  assigned: {
    label: 'Assigned',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    dot: 'bg-blue-500',
    icon: UserCheck,
  },
  in_progress: {
    label: 'In Progress',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
    icon: Wrench,
  },
  resolved: {
    label: 'Resolved',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
    icon: CheckCircle2,
  },
};

export default function StatusBadge({ status = 'submitted', showIcon = true, size = 'md' }) {
  const normStatus = (status || 'submitted').toLowerCase().replace(/\s+/g, '_');
  const conf = STATUS_CONFIG[normStatus] || STATUS_CONFIG.submitted;
  const Icon = conf.icon;

  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-xs md:text-sm px-2.5 py-1';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${conf.bg} ${conf.text} ${conf.border} ${sizeClasses}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${conf.dot}`} />
      {showIcon && <Icon className="w-3.5 h-3.5 opacity-80" />}
      <span>{conf.label}</span>
    </span>
  );
}
