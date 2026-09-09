import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { subscribeComplaints } from '../../services/firebase.js';
import StatusBadge from '../../components/StatusBadge.jsx';
import UrgencyBadge from '../../components/UrgencyBadge.jsx';
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
} from 'lucide-react';

const TIMELINE_STEPS = [
  {
    key: 'submitted',
    title: 'Submitted',
    desc: 'Issue filed by citizen and logged into municipal database.',
    icon: Clock,
  },
  {
    key: 'assigned',
    title: 'Assigned',
    desc: 'Allocated to specialized field engineer.',
    icon: UserCheck,
  },
  {
    key: 'in_progress',
    title: 'In Progress',
    desc: 'Field crew active on site performing repairs.',
    icon: Wrench,
  },
  {
    key: 'resolved',
    title: 'Resolved',
    desc: 'Issue verified and resolved according to citizen charter.',
    icon: CheckCircle2,
  },
];

const STATUS_ORDER = ['submitted', 'assigned', 'in_progress', 'resolved'];

export default function ComplaintDetail() {
  const { id } = useParams();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Subscribe to complaints to get real-time status updates without refresh
    const unsubscribe = subscribeComplaints(null, (allComplaints) => {
      const found = allComplaints.find((c) => c.complaintId === id);
      if (found) {
        setComplaint(found);
      }
      setLoading(false);
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm font-semibold text-slate-600">Connecting to live complaint feed...</p>
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Complaint Not Found</h2>
        <p className="text-sm text-slate-500 mb-6">
          The requested complaint identifier (#{id}) could not be located in the municipal registry.
        </p>
        <Link
          to="/citizen/my-complaints"
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Return to My Complaints
        </Link>
      </div>
    );
  }

  const currentStepIndex = STATUS_ORDER.indexOf(complaint.status || 'submitted');

  const formattedDate = complaint.createdAt
    ? new Date(complaint.createdAt).toLocaleDateString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Recent';

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Top Nav Breadcrumb */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <Link
          to="/citizen/my-complaints"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Complaints
        </Link>
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <Radio className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
          <span>Live Synced</span>
        </div>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden mb-8">
        {/* Header Ribbon */}
        <div className="p-6 sm:p-8 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-teal-50/30">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-slate-200 text-slate-800">
                #{complaint.complaintId}
              </span>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-teal-100 text-teal-800 border border-teal-200">
                {complaint.category}
              </span>
              <UrgencyBadge urgency={complaint.urgency} />
            </div>
            <StatusBadge status={complaint.status} size="lg" />
          </div>

          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-snug mb-2">
            {complaint.description}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-3">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-slate-400" />
              Reported on {formattedDate}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-slate-400" />
              {complaint.location?.ward || 'Local Ward'}
            </span>
          </div>
        </div>

        {/* Live 4-Step Visual Status Timeline */}
        <div className="p-6 sm:p-8 bg-slate-50/50 border-b border-slate-100">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-6 flex items-center gap-2">
            <Clock className="w-4 h-4 text-teal-600" />
            Resolution Progress Timeline
          </h3>

          <div className="relative">
            {/* Desktop Horizontal Timeline */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative z-10">
              {TIMELINE_STEPS.map((step, idx) => {
                const Icon = step.icon;
                const isCompleted = idx <= currentStepIndex;
                const isCurrent = idx === currentStepIndex;

                return (
                  <div key={step.key} className="flex md:flex-col items-start gap-3">
                    {/* Circle icon */}
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all shadow-sm ${
                        isCompleted
                          ? isCurrent
                            ? 'bg-teal-600 text-white ring-4 ring-teal-100 shadow-md scale-105'
                            : 'bg-emerald-600 text-white'
                          : 'bg-slate-200 text-slate-400'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-sm font-bold ${
                            isCompleted ? 'text-slate-900' : 'text-slate-400'
                          }`}
                        >
                          {step.title}
                        </span>
                        {isCurrent && (
                          <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-teal-100 text-teal-800 font-bold">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        {step.key === 'assigned' && complaint.assignedWorker
                          ? `Assigned to ${complaint.assignedWorker}`
                          : step.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Details Body: Evidence Image, AI Explainability, Location */}
        <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column: Photo Evidence */}
          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-3">
              Photo Verification
            </h3>
            {complaint.imageUrl ? (
              <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100 group relative">
                <img
                  src={complaint.imageUrl}
                  alt="Civic Issue Verification"
                  className="w-full h-64 object-cover"
                />
                <a
                  href={complaint.imageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute bottom-3 right-3 px-3 py-1.5 bg-slate-950/80 hover:bg-slate-950 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 backdrop-blur-sm transition-colors shadow"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Open Full Image
                </a>
              </div>
            ) : (
              <div className="h-44 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 text-xs p-6 text-center">
                <span>No photographic verification was uploaded with this complaint.</span>
              </div>
            )}
          </div>

          {/* Right Column: AI Reasoning & Municipal Assignment */}
          <div className="space-y-6">
            {/* AI Decision Intelligence Card */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-teal-50 via-slate-50 to-emerald-50 border border-teal-200/80 shadow-2xs">
              <div className="flex items-center gap-2 text-teal-800 text-xs font-extrabold uppercase tracking-wider mb-2">
                <Sparkles className="w-4 h-4 text-teal-600" />
                <span>Automated AI Triage Assessment</span>
              </div>
              <div className="space-y-2 text-xs text-slate-700">
                <div className="flex items-center justify-between pb-2 border-b border-teal-100">
                  <span className="font-semibold text-slate-600">Assigned Category:</span>
                  <span className="font-bold text-slate-900">{complaint.category}</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-teal-100">
                  <span className="font-semibold text-slate-600">Predicted Urgency:</span>
                  <span className="font-bold text-slate-900">{complaint.urgency}</span>
                </div>
                <div className="pt-1">
                  <span className="font-semibold text-slate-600 block mb-1">Reasoning Analysis:</span>
                  <p className="italic text-slate-800 bg-white/70 p-2.5 rounded-lg border border-teal-100">
                    "{complaint.aiReasoning || 'Classified by civic triage intelligence.'}"
                  </p>
                </div>
              </div>
            </div>

            {/* Location & Assigned Field Crew */}
            <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-3 text-xs">
              <h4 className="font-extrabold uppercase tracking-wider text-slate-500 mb-2">
                Municipal Routing Details
              </h4>
              <div className="flex items-start justify-between gap-2">
                <span className="font-semibold text-slate-600">Ward / Division:</span>
                <span className="font-medium text-slate-900 text-right">
                  {complaint.location?.ward || 'General Ward'}
                </span>
              </div>
              {complaint.location?.address && (
                <div className="flex items-start justify-between gap-2">
                  <span className="font-semibold text-slate-600">Landmark / Address:</span>
                  <span className="font-medium text-slate-900 text-right">
                    {complaint.location?.address}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-slate-600">Geo Coordinates:</span>
                <span className="font-mono text-slate-700">
                  {complaint.location?.lat}, {complaint.location?.lng}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                <span className="font-semibold text-slate-600">Assigned Engineer:</span>
                <span className="font-bold text-blue-700">
                  {complaint.assignedWorker || 'Pending Assignment'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
