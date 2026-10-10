import React from 'react';
import { Landmark } from 'lucide-react';

/**
 * Split-screen auth layout: brand panel on desktop, compact brand header on mobile.
 */
export default function AuthLayout({ variant = 'citizen', title, subtitle, children, footer }) {
  const isAdmin = variant === 'admin';
  const panel = isAdmin ? 'bg-slate-900' : 'bg-brand-900';

  return (
    <div className="min-h-screen bg-slate-50 lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      {/* Brand panel */}
      <aside className={`${panel} text-white px-6 py-8 lg:px-12 lg:py-14 lg:flex lg:flex-col lg:justify-between`}>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-brand-200">
            <Landmark className="w-6 h-6" />
          </div>
          <div className="leading-tight">
            <div className="text-xl font-extrabold tracking-tight">JanMithra</div>
            <div className="text-xs text-white/60">Kerala Civic Issue Reporting Platform</div>
          </div>
        </div>

        <div className="hidden lg:block max-w-md">
          <h2 className="text-3xl font-extrabold leading-tight tracking-tight">
            {isAdmin ? 'Every complaint, one console.' : 'Report. Track. Resolve.'}
          </h2>
          <p className="mt-4 text-white/70 text-sm leading-relaxed">
            {isAdmin
              ? 'Triage AI-prioritised issues, dispatch field staff and watch your ward on a live map.'
              : 'Report a civic problem in under a minute. Our AI routes it to the right department and you follow it live until it is fixed.'}
          </p>
        </div>

        <div className="hidden lg:block text-xs text-white/40">Local Self-Government · Kerala</div>
      </aside>

      {/* Form */}
      <main className="flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-md">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{title}</h1>
          <p className="text-sm text-slate-500 mt-1 mb-6">{subtitle}</p>
          {children}
          {footer && <div className="mt-6 text-center text-xs text-slate-500">{footer}</div>}
        </div>
      </main>
    </div>
  );
}
