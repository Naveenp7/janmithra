import React from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from './StatusBadge.jsx';
import UrgencyBadge from './UrgencyBadge.jsx';
import { MapPin, Calendar, ArrowRight, UserCheck, Image as ImageIcon } from 'lucide-react';

export default function ComplaintCard({ complaint, linkPrefix = '/citizen/complaint' }) {
  const formattedDate = complaint.createdAt
    ? new Date(complaint.createdAt).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Recent';

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between group">
      {/* Top Banner with Image or Category Header */}
      <div className="p-5 pb-3">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 text-xs font-bold rounded-lg bg-teal-50 text-teal-800 border border-teal-200">
              {complaint.category || 'Other'}
            </span>
            <UrgencyBadge urgency={complaint.urgency || 'Medium'} size="sm" />
          </div>
          <StatusBadge status={complaint.status || 'submitted'} size="sm" />
        </div>

        {/* Image Preview (if present) */}
        {complaint.imageUrl && (
          <div className="relative h-36 w-full rounded-xl overflow-hidden mb-3.5 bg-slate-100 border border-slate-100">
            <img
              src={complaint.imageUrl}
              alt="Civic Issue Verification"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          </div>
        )}

        {/* Complaint Description */}
        <p className="text-sm font-medium text-slate-800 line-clamp-2 leading-relaxed">
          {complaint.description}
        </p>

        {/* AI Reasoning snippet */}
        {complaint.aiReasoning && (
          <div className="mt-2.5 p-2 bg-slate-50 border border-slate-200/70 rounded-lg text-xs text-slate-600 flex items-start gap-1.5">
            <span className="font-semibold text-teal-700 text-[11px] flex-shrink-0">AI Note:</span>
            <span className="line-clamp-1 italic text-[11px]">{complaint.aiReasoning}</span>
          </div>
        )}
      </div>

      {/* Footer Info: Location, Date, Assigned Worker */}
      <div className="p-5 pt-3 border-t border-slate-100 bg-slate-50/50 flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
          <div className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <span className="truncate max-w-[200px]">
              {complaint.location?.ward || complaint.location?.address || 'Kerala'}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>{formattedDate}</span>
          </div>
        </div>

        {complaint.assignedWorker && (
          <div className="flex items-center gap-1.5 text-xs text-blue-800 bg-blue-50/80 px-2.5 py-1 rounded-md border border-blue-100 font-medium">
            <UserCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>Assigned: {complaint.assignedWorker}</span>
          </div>
        )}

        <div className="pt-2 flex justify-end">
          <Link
            to={`${linkPrefix}/${complaint.complaintId}`}
            className="inline-flex items-center gap-1 text-xs font-bold text-teal-700 hover:text-teal-800 group-hover:translate-x-0.5 transition-transform"
          >
            Track Status Timeline
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
