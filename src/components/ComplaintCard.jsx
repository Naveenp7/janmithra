import React from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from './StatusBadge.jsx';
import UrgencyBadge from './UrgencyBadge.jsx';
import { CategoryChip, formatDate } from './ui.jsx';
import { MapPin, Calendar, ChevronRight, UserCheck, ImageOff } from 'lucide-react';

const PROGRESS = { submitted: 10, assigned: 40, in_progress: 70, resolved: 100 };
const PROGRESS_COLOR = {
  submitted: 'bg-slate-400',
  assigned: 'bg-blue-500',
  in_progress: 'bg-amber-500',
  resolved: 'bg-brand-600',
};

export default function ComplaintCard({ complaint, linkPrefix = '/citizen/complaint' }) {
  const status = complaint.status || 'submitted';

  return (
    <Link
      to={`${linkPrefix}/${complaint.complaintId}`}
      className="card p-4 flex gap-4 hover:border-brand-300 hover:shadow-md transition group"
    >
      {/* Thumbnail */}
      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 flex items-center justify-center">
        {complaint.imageUrl ? (
          <img src={complaint.imageUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <ImageOff className="w-6 h-6 text-slate-300" />
        )}
      </div>

      <div className="min-w-0 flex-1 flex flex-col">
        <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
          <CategoryChip category={complaint.category} />
          <UrgencyBadge urgency={complaint.urgency || 'Medium'} size="sm" />
        </div>

        <p className="text-sm font-semibold text-slate-900 line-clamp-2 leading-snug">{complaint.description}</p>

        <div className="mt-auto pt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
          <span className="flex items-center gap-1 min-w-0">
            <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <span className="truncate max-w-[160px]">
              {complaint.location?.ward || complaint.location?.address || 'Kerala'}
            </span>
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            {formatDate(complaint.createdAt, false)}
          </span>
          {complaint.assignedWorker && (
            <span className="flex items-center gap-1 text-blue-700 font-medium">
              <UserCheck className="w-3.5 h-3.5" />
              <span className="truncate max-w-[140px]">{complaint.assignedWorker}</span>
            </span>
          )}
        </div>

        <div className="mt-3 flex items-center gap-3">
          <StatusBadge status={status} size="sm" />
          <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden" aria-hidden="true">
            <div
              className={`h-full rounded-full transition-all ${PROGRESS_COLOR[status] || PROGRESS_COLOR.submitted}`}
              style={{ width: `${PROGRESS[status] || 10}%` }}
            />
          </div>
          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-brand-600 transition-colors" />
        </div>
      </div>
    </Link>
  );
}
