import React from 'react';
import { AlertCircle, AlertTriangle, Flame, Info } from 'lucide-react';

const URGENCY_CONFIG = {
  Critical: {
    bg: 'bg-rose-100',
    text: 'text-rose-800',
    border: 'border-rose-300',
    icon: Flame,
    dot: 'bg-rose-600',
    pulse: true,
  },
  High: {
    bg: 'bg-orange-100',
    text: 'text-orange-800',
    border: 'border-orange-300',
    icon: AlertTriangle,
    dot: 'bg-orange-500',
    pulse: false,
  },
  Medium: {
    bg: 'bg-amber-100',
    text: 'text-amber-800',
    border: 'border-amber-300',
    icon: AlertCircle,
    dot: 'bg-amber-500',
    pulse: false,
  },
  Low: {
    bg: 'bg-emerald-100',
    text: 'text-emerald-800',
    border: 'border-emerald-300',
    icon: Info,
    dot: 'bg-emerald-500',
    pulse: false,
  },
};

export default function UrgencyBadge({ urgency = 'Medium', size = 'md' }) {
  const conf = URGENCY_CONFIG[urgency] || URGENCY_CONFIG.Medium;
  const Icon = conf.icon;
  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-xs md:text-sm px-2.5 py-1 font-semibold';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${conf.bg} ${conf.text} ${conf.border} ${sizeClasses}`}
    >
      <span className={`w-2 h-2 rounded-full ${conf.dot} ${conf.pulse ? 'animate-pulse' : ''}`} />
      <Icon className="w-3.5 h-3.5" />
      <span>{urgency} Priority</span>
    </span>
  );
}
