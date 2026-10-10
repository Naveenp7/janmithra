import React, { useState, useEffect } from 'react';
import StatusBadge from '../../components/StatusBadge.jsx';
import UrgencyBadge from '../../components/UrgencyBadge.jsx';
import { Alert, CategoryChip, STATUS_OPTIONS, formatDate } from '../../components/ui.jsx';
import { updateComplaintInFirestore, subscribeWorkers } from '../../services/firebase.js';
import { X, Sparkles, UserCheck, MapPin, Calendar, ExternalLink, Loader2, ShieldCheck } from 'lucide-react';

/**
 * Complaint management panel: right-hand drawer on desktop, bottom sheet on phones.
 */
export default function AdminComplaintDetailModal({ complaint, onClose, onUpdated }) {
  const [workers, setWorkers] = useState([]);
  const [selectedWorker, setSelectedWorker] = useState(complaint?.assignedWorker || '');
  const [selectedStatus, setSelectedStatus] = useState(complaint?.status || 'submitted');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    const unsub = subscribeWorkers(setWorkers);
    return () => unsub?.();
  }, []);

  // Close on Escape
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!complaint) return null;

  const workerValue = (w) => `${w.name} (${w.department})`;
  const dirty =
    selectedStatus !== (complaint.status || 'submitted') || selectedWorker !== (complaint.assignedWorker || '');

  const handleSave = async () => {
    setSaving(true);
    setFeedback(null);
    try {
      const workerChanged = selectedWorker && selectedWorker !== complaint.assignedWorker;
      // Assigning someone to a brand-new complaint moves it to "assigned"; otherwise respect the chosen status
      const status = workerChanged && selectedStatus === 'submitted' ? 'assigned' : selectedStatus;

      await updateComplaintInFirestore(complaint.complaintId, { assignedWorker: selectedWorker, status });
      setSelectedStatus(status);
      setFeedback({ tone: 'success', text: 'Saved. The citizen sees this update instantly.' });
      onUpdated?.();
      setTimeout(onClose, 700);
    } catch (err) {
      console.error('Error saving complaint:', err);
      setFeedback({
        tone: 'error',
        text:
          err?.code === 'permission-denied'
            ? 'Permission denied. Make sure this account has role "admin" in Firestore.'
            : 'Could not save changes. Please try again.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-stretch sm:justify-end" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-slate-950/60 anim-fade" onClick={onClose} />

      <div className="relative bg-white w-full sm:max-w-lg max-h-[92vh] sm:max-h-none sm:h-full overflow-y-auto rounded-t-3xl sm:rounded-none shadow-2xl anim-slide-up sm:anim-drawer-right">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="min-w-0">
            <div className="text-[11px] font-bold uppercase tracking-wider text-brand-700">Manage complaint</div>
            <div className="text-xs font-mono text-slate-400 truncate">{complaint.complaintId}</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-5">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <CategoryChip category={complaint.category} />
              <UrgencyBadge urgency={complaint.urgency} size="sm" />
              <StatusBadge status={complaint.status} size="sm" />
            </div>
            <h2 className="text-lg font-extrabold text-slate-900 leading-snug">{complaint.description}</h2>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-3">
              <span>
                By <strong className="text-slate-700">{complaint.citizenName || 'Citizen'}</strong>
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" /> {formatDate(complaint.createdAt)}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" /> {complaint.location?.ward || 'Ward'}
              </span>
            </div>
            {complaint.citizenEmail && <div className="text-xs text-slate-400 mt-1">{complaint.citizenEmail}</div>}
          </div>

          {complaint.imageUrl && (
            <div className="relative rounded-2xl overflow-hidden bg-slate-100">
              <img src={complaint.imageUrl} alt="Issue" className="w-full h-52 object-cover" />
              <a
                href={complaint.imageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute bottom-2 right-2 px-2.5 py-1 bg-slate-900/80 hover:bg-slate-900 text-white text-[11px] font-semibold rounded-lg flex items-center gap-1"
              >
                <ExternalLink className="w-3 h-3" /> Full size
              </a>
            </div>
          )}

          <div className="p-4 rounded-2xl bg-brand-50/60 border border-brand-200">
            <div className="flex items-center gap-2 text-brand-900 text-xs font-extrabold mb-1.5">
              <Sparkles className="w-4 h-4 text-brand-600" /> AI assessment
            </div>
            <p className="text-sm text-slate-700 leading-relaxed">
              {complaint.aiReasoning || 'Assessed through civic classification intelligence.'}
            </p>
          </div>

          {complaint.location?.address && (
            <div className="text-xs text-slate-500">
              <span className="font-bold text-slate-700">Address: </span>
              {complaint.location.address}
            </div>
          )}

          <div className="space-y-4 p-4 rounded-2xl border border-slate-200">
            <div>
              <label className="label flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-brand-700" /> Assign field staff
              </label>
              <select value={selectedWorker} onChange={(e) => setSelectedWorker(e.target.value)} className="input">
                <option value="">— Unassigned —</option>
                {/* keep a legacy/removed assignee visible so it isn't silently dropped */}
                {complaint.assignedWorker && !workers.some((w) => workerValue(w) === complaint.assignedWorker) && (
                  <option value={complaint.assignedWorker}>{complaint.assignedWorker}</option>
                )}
                {workers.map((w) => (
                  <option key={w.workerId} value={workerValue(w)}>
                    {w.name} — {w.department}
                    {w.phone ? ` (${w.phone})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-brand-700" /> Status
              </label>
              <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} className="input">
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.key} value={o.key}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          {feedback && <Alert tone={feedback.tone}>{feedback.text}</Alert>}
        </div>

        <div className="sticky bottom-0 bg-white border-t border-slate-100 px-5 sm:px-6 py-4 flex items-center justify-end gap-3">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button type="button" onClick={handleSave} disabled={saving || !dirty} className="btn-primary">
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Saving…
              </>
            ) : (
              'Save changes'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
