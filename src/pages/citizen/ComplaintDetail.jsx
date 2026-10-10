import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { subscribeComplaint } from '../../services/firebase.js';
import StatusBadge from '../../components/StatusBadge.jsx';
import UrgencyBadge from '../../components/UrgencyBadge.jsx';
import { Spinner, EmptyState, Alert, CategoryChip, formatDate } from '../../components/ui.jsx';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Sparkles,
  CheckCircle2,
  Clock,
  UserCheck,
  Wrench,
  Radio,
  ExternalLink,
  ShieldAlert,
  Check,
} from 'lucide-react';

const TIMELINE_STEPS = [
  { key: 'submitted', title: 'Submitted', desc: 'Your report is logged with the municipality.', icon: Clock },
  { key: 'assigned', title: 'Assigned', desc: 'Allocated to a field engineer.', icon: UserCheck },
  { key: 'in_progress', title: 'In progress', desc: 'The crew is working on site.', icon: Wrench },
  { key: 'resolved', title: 'Resolved', desc: 'The issue has been fixed.', icon: CheckCircle2 },
];

const STATUS_ORDER = TIMELINE_STEPS.map((s) => s.key);

function InfoRow({ label, children }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-slate-100 last:border-0 text-sm">
      <span className="text-slate-500 flex-shrink-0">{label}</span>
      <span className="font-semibold text-slate-900 text-right break-words min-w-0">{children}</span>
    </div>
  );
}

export default function ComplaintDetail() {
  const { id } = useParams();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setLoadError(null);
    // Live subscription to just this one document
    const unsubscribe = subscribeComplaint(
      id,
      (found) => {
        setComplaint(found);
        setLoading(false);
      },
      setLoadError
    );
    return () => unsubscribe?.();
  }, [id]);

  if (loading) return <Spinner label="Loading complaint…" />;

  if (!complaint) {
    return (
      <div className="pt-6">
        {loadError && <Alert tone="error" className="mb-5 max-w-lg mx-auto">{loadError}</Alert>}
        <EmptyState
          icon={ShieldAlert}
          title="Complaint not found"
          text={`We couldn't find complaint #${id}. It may have been removed, or it belongs to another account.`}
          actionLabel="Back to my complaints"
          actionTo="/citizen/my-complaints"
        />
      </div>
    );
  }

  const status = complaint.status || 'submitted';
  const currentStep = Math.max(0, STATUS_ORDER.indexOf(status));

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between gap-4 mb-5">
        <Link
          to="/citizen/my-complaints"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> My complaints
        </Link>
        <span className="flex items-center gap-1.5 text-xs font-semibold text-brand-700">
          <Radio className="w-3.5 h-3.5 animate-pulse" /> Live updates
        </span>
      </div>

      {/* Summary */}
      <div className="card p-5 sm:p-6 mb-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex flex-wrap items-center gap-2">
            <CategoryChip category={complaint.category} />
            <UrgencyBadge urgency={complaint.urgency} size="sm" />
          </div>
          <StatusBadge status={status} />
        </div>

        <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 leading-snug">{complaint.description}</h1>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-slate-500 mt-3">
          <span className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-slate-400" /> Reported {formatDate(complaint.createdAt)}
          </span>
          <span className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-slate-400" /> {complaint.location?.ward || 'Local ward'}
          </span>
          <span className="font-mono text-slate-400">ID {complaint.complaintId}</span>
        </div>
      </div>

      {/* Timeline */}
      <div className="card p-5 sm:p-6 mb-5">
        <h2 className="text-sm font-extrabold text-slate-900 mb-5">Progress</h2>
        <ol className="grid grid-cols-1 sm:grid-cols-4 gap-5 sm:gap-3">
          {TIMELINE_STEPS.map((step, idx) => {
            const done = idx < currentStep || (idx === currentStep && status === 'resolved');
            const current = idx === currentStep && !done;
            const Icon = step.icon;
            return (
              <li key={step.key} className="relative flex sm:flex-col gap-3 sm:gap-2.5">
                {/* connector */}
                {idx < TIMELINE_STEPS.length - 1 && (
                  <>
                    <span
                      aria-hidden="true"
                      className={`hidden sm:block absolute top-5 left-12 right-[-0.75rem] h-0.5 ${
                        idx < currentStep ? 'bg-brand-500' : 'bg-slate-200'
                      }`}
                    />
                    <span
                      aria-hidden="true"
                      className={`sm:hidden absolute left-5 top-11 -bottom-5 w-0.5 -translate-x-1/2 ${
                        idx < currentStep ? 'bg-brand-500' : 'bg-slate-200'
                      }`}
                    />
                  </>
                )}
                <div
                  className={`relative w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    done
                      ? 'bg-brand-600 text-white'
                      : current
                      ? 'bg-brand-100 text-brand-700 ring-4 ring-brand-50 border border-brand-300'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {done ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                </div>
                <div className="min-w-0">
                  <div className={`text-sm font-bold ${done || current ? 'text-slate-900' : 'text-slate-400'}`}>
                    {step.title}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    {step.key === 'assigned' && complaint.assignedWorker
                      ? `Assigned to ${complaint.assignedWorker}`
                      : step.desc}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Photo */}
        <div className="card p-5 sm:p-6">
          <h2 className="text-sm font-extrabold text-slate-900 mb-3">Photo</h2>
          {complaint.imageUrl ? (
            <div className="relative rounded-xl overflow-hidden bg-slate-100">
              <img src={complaint.imageUrl} alt="Reported issue" className="w-full h-60 object-cover" />
              <a
                href={complaint.imageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute bottom-3 right-3 px-3 py-1.5 bg-slate-950/80 hover:bg-slate-950 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Open full size
              </a>
            </div>
          ) : (
            <div className="h-40 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-400 text-sm text-center px-6">
              No photo was attached to this report.
            </div>
          )}
        </div>

        <div className="space-y-5">
          {/* AI assessment */}
          <div className="card p-5 sm:p-6 bg-brand-50/60 border-brand-200">
            <h2 className="text-sm font-extrabold text-brand-900 mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-600" /> AI assessment
            </h2>
            <p className="text-sm text-slate-700 leading-relaxed">
              {complaint.aiReasoning || 'Classified by the civic triage assistant.'}
            </p>
          </div>

          {/* Routing */}
          <div className="card p-5 sm:p-6">
            <h2 className="text-sm font-extrabold text-slate-900 mb-1">Routing details</h2>
            <InfoRow label="Ward">{complaint.location?.ward || 'General ward'}</InfoRow>
            {complaint.location?.address && <InfoRow label="Address">{complaint.location.address}</InfoRow>}
            <InfoRow label="Assigned to">
              <span className={complaint.assignedWorker ? 'text-blue-700' : 'text-slate-400'}>
                {complaint.assignedWorker || 'Pending assignment'}
              </span>
            </InfoRow>
          </div>
        </div>
      </div>
    </div>
  );
}
