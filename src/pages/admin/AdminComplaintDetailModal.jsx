import React, { useState, useEffect } from 'react';
import StatusBadge from '../../components/StatusBadge.jsx';
import UrgencyBadge from '../../components/UrgencyBadge.jsx';
import {
  updateComplaintStatusInFirestore,
  assignWorkerInFirestore,
  subscribeWorkers,
} from '../../services/firebase.js';
import {
  X,
  Sparkles,
  UserCheck,
  CheckCircle2,
  MapPin,
  Calendar,
  ExternalLink,
  Loader2,
  ShieldCheck,
} from 'lucide-react';

export default function AdminComplaintDetailModal({ complaint, onClose, onUpdated }) {
  if (!complaint) return null;

  const [workers, setWorkers] = useState([]);
  const [selectedWorker, setSelectedWorker] = useState(complaint.assignedWorker || '');
  const [selectedStatus, setSelectedStatus] = useState(complaint.status || 'submitted');
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    const unsub = subscribeWorkers((items) => {
      setWorkers(items);
    });
    return () => unsub();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSuccessMsg('');

    try {
      // If worker changed
      if (selectedWorker !== complaint.assignedWorker && selectedWorker) {
        await assignWorkerInFirestore(complaint.complaintId, selectedWorker);
      }

      // If status changed
      if (selectedStatus !== complaint.status) {
        await updateComplaintStatusInFirestore(complaint.complaintId, selectedStatus);
      }

      setSuccessMsg('Complaint status & assignment updated successfully in Firestore!');
      if (onUpdated) onUpdated();

      setTimeout(() => {
        onClose();
      }, 800);
    } catch (err) {
      console.error('Error saving complaint:', err);
    } finally {
      setSaving(false);
    }
  };

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
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex flex-wrap items-center gap-2.5 mb-3 pr-10">
          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-slate-100 text-slate-800">
            #{complaint.complaintId}
          </span>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
            {complaint.category}
          </span>
          <UrgencyBadge urgency={complaint.urgency} size="sm" />
          <StatusBadge status={complaint.status} size="sm" />
        </div>

        <h2 className="text-xl font-extrabold text-slate-900 leading-snug mb-2">
          {complaint.description}
        </h2>

        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mb-6 pb-4 border-b border-slate-100">
          <span>Citizen: <strong>{complaint.citizenName || 'Citizen'}</strong></span>
          {complaint.citizenEmail && (
            <>
              <span>•</span>
              <span>{complaint.citizenEmail}</span>
            </>
          )}
          <span>•</span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400" /> {formattedDate}
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-slate-400" /> {complaint.location?.ward || 'Ward'}
          </span>
        </div>

        {/* Success Alert */}
        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            {successMsg}
          </div>
        )}

        {/* Body Content */}
        <div className="space-y-5 text-sm">
          {/* Photo Preview if uploaded */}
          {complaint.imageUrl && (
            <div>
              <label className="block text-xs font-extrabold uppercase text-slate-500 mb-2">
                Photographic Verification
              </label>
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 max-h-56 bg-slate-100">
                <img
                  src={complaint.imageUrl}
                  alt="Issue verification"
                  className="w-full h-48 object-cover"
                />
                <a
                  href={complaint.imageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute bottom-2 right-2 px-2.5 py-1 bg-slate-900/80 hover:bg-slate-900 text-white text-[11px] font-semibold rounded-lg flex items-center gap-1 backdrop-blur-sm"
                >
                  <ExternalLink className="w-3 h-3" /> View Full Image
                </a>
              </div>
            </div>
          )}

          {/* AI Reasoning Box */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-2 text-teal-800 text-xs font-bold uppercase tracking-wider mb-1.5">
              <Sparkles className="w-4 h-4 text-teal-600" />
              <span>NVIDIA NIM AI Assessment</span>
            </div>
            <p className="text-xs text-slate-700 italic">
              "{complaint.aiReasoning || 'Assessed through civic classification intelligence.'}"
            </p>
          </div>

          {/* Assignment & Status Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-teal-50/40 border border-teal-100">
            {/* Worker Assignment Dropdown */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-teal-700" />
                Assign Field Staff
              </label>
              <select
                value={selectedWorker}
                onChange={(e) => setSelectedWorker(e.target.value)}
                className="w-full text-xs font-medium px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-slate-800 shadow-xs cursor-pointer"
              >
                <option value="">-- Select Field Worker --</option>
                {workers.map((w) => (
                  <option key={w.workerId} value={`${w.name} (${w.department})`}>
                    {w.name} — {w.department} ({w.phone || 'Staff'})
                  </option>
                ))}
              </select>
            </div>

            {/* Status Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-teal-700" />
                Update Resolution Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-slate-800 shadow-xs cursor-pointer"
              >
                <option value="submitted">Submitted</option>
                <option value="assigned">Assigned</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors shadow-sm flex items-center gap-2 disabled:opacity-60 cursor-pointer"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Saving...
              </>
            ) : (
              'Save & Broadcast Update'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
