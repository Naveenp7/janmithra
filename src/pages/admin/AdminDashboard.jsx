import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  subscribeComplaints,
  subscribeWorkers,
  addWorkerToFirestore,
} from '../../services/firebase.js';
import StatusBadge from '../../components/StatusBadge.jsx';
import UrgencyBadge from '../../components/UrgencyBadge.jsx';
import AdminComplaintDetailModal from './AdminComplaintDetailModal.jsx';
import {
  PageHeader,
  StatCard,
  Spinner,
  EmptyState,
  Alert,
  CategoryChip,
  CATEGORIES,
  STATUS_OPTIONS,
} from '../../components/ui.jsx';
import { MapPin, Search, Flame, Wrench, CheckCircle2, Inbox, Users, Plus, X, ChevronRight } from 'lucide-react';

const DEPARTMENTS = [...CATEGORIES.filter((c) => c !== 'Other'), 'General'];

export default function AdminDashboard() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [activeComplaint, setActiveComplaint] = useState(null);

  // Field staff panel
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [workers, setWorkers] = useState([]);
  const [newWorkerName, setNewWorkerName] = useState('');
  const [newWorkerDept, setNewWorkerDept] = useState('Road');
  const [newWorkerPhone, setNewWorkerPhone] = useState('');
  const [staffLoading, setStaffLoading] = useState(false);
  const [staffError, setStaffError] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [urgencyFilter, setUrgencyFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setLoading(true);
    const unsubC = subscribeComplaints(
      null,
      (all) => {
        setComplaints(all);
        setLoading(false);
      },
      setLoadError
    );
    const unsubW = subscribeWorkers(setWorkers);
    return () => {
      unsubC?.();
      unsubW?.();
    };
  }, []);

  const filtered = complaints.filter((c) => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    if (categoryFilter !== 'all' && c.category !== categoryFilter) return false;
    if (urgencyFilter !== 'all' && c.urgency !== urgencyFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const hay = [c.description, c.location?.ward, c.citizenName, c.assignedWorker].join(' ').toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const totalCount = complaints.length;
  const criticalCount = complaints.filter((c) => c.urgency === 'Critical' && c.status !== 'resolved').length;
  const inProgressCount = complaints.filter((c) => c.status === 'in_progress' || c.status === 'assigned').length;
  const resolvedCount = complaints.filter((c) => c.status === 'resolved').length;

  const handleAddWorker = async (e) => {
    e.preventDefault();
    if (!newWorkerName.trim()) return;
    setStaffLoading(true);
    setStaffError(null);
    try {
      await addWorkerToFirestore({
        name: newWorkerName.trim(),
        department: newWorkerDept,
        phone: newWorkerPhone.trim(),
      });
      setNewWorkerName('');
      setNewWorkerPhone('');
    } catch (err) {
      console.error('Error adding worker:', err);
      setStaffError('Could not add this worker. Please try again.');
    } finally {
      setStaffLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Authority console"
        title="Complaints overview"
        subtitle="Live view of every reported issue, AI-prioritised, with dispatch controls."
        actions={
          <>
            <button type="button" onClick={() => setShowStaffModal(true)} className="btn-secondary">
              <Users className="w-4 h-4 text-brand-700" /> Field staff ({workers.length})
            </button>
            <Link to="/admin/map" className="btn-dark">
              <MapPin className="w-4 h-4 text-brand-300" /> Map view
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <StatCard label="Total complaints" value={totalCount} icon={Inbox} tone="slate" />
        <StatCard label="Critical pending" value={criticalCount} icon={Flame} tone="rose" />
        <StatCard label="In progress" value={inProgressCount} icon={Wrench} tone="amber" />
        <StatCard label="Resolved" value={resolvedCount} icon={CheckCircle2} tone="green" />
      </div>

      {/* Filters */}
      <div className="card p-3 sm:p-4 mb-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ward, citizen, issue…"
              aria-label="Search complaints"
              className="input pl-10"
            />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Status" className="input">
            <option value="all">All statuses</option>
            {STATUS_OPTIONS.map((o) => (
              <option key={o.key} value={o.key}>{o.label}</option>
            ))}
          </select>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} aria-label="Category" className="input">
            <option value="all">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select value={urgencyFilter} onChange={(e) => setUrgencyFilter(e.target.value)} aria-label="Urgency" className="input">
            <option value="all">All urgency levels</option>
            {['Critical', 'High', 'Medium', 'Low'].map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        </div>
      </div>

      {loadError && <Alert tone="error" className="mb-5">{loadError}</Alert>}

      {loading ? (
        <Spinner label="Syncing complaints…" />
      ) : filtered.length === 0 && !loadError ? (
        <EmptyState
          icon={Inbox}
          title={complaints.length === 0 ? 'No complaints yet' : 'No matches'}
          text={
            complaints.length === 0
              ? 'Complaints submitted by citizens will appear here instantly.'
              : 'No complaints match the selected filters.'
          }
        />
      ) : filtered.length > 0 ? (
        <div className="card overflow-hidden">
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Issue</th>
                  <th className="py-3 px-4">Ward</th>
                  <th className="py-3 px-4">Urgency</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Assigned</th>
                  <th className="py-3 px-4" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((item) => (
                  <tr
                    key={item.complaintId}
                    onClick={() => setActiveComplaint(item)}
                    className="hover:bg-brand-50/40 transition-colors cursor-pointer"
                  >
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="flex items-start gap-2.5">
                        <CategoryChip category={item.category} />
                        <div className="min-w-0">
                          <div className="line-clamp-2 font-semibold text-slate-900">{item.description}</div>
                          <div className="text-xs text-slate-400 mt-0.5">By {item.citizenName || 'Citizen'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 max-w-[160px]">
                      <span className="flex items-center gap-1 truncate">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span className="truncate">{item.location?.ward || 'General'}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <UrgencyBadge urgency={item.urgency} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StatusBadge status={item.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-xs whitespace-nowrap">
                      {item.assignedWorker ? (
                        <span className="font-semibold text-blue-700">{item.assignedWorker}</span>
                      ) : (
                        <span className="italic text-slate-400">Unassigned</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <ChevronRight className="w-4 h-4 text-slate-300 inline" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-slate-100">
            {filtered.map((item) => (
              <button
                key={item.complaintId}
                type="button"
                onClick={() => setActiveComplaint(item)}
                className="w-full text-left p-4 active:bg-slate-50 space-y-2.5 cursor-pointer"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <CategoryChip category={item.category} />
                    <UrgencyBadge urgency={item.urgency} size="sm" />
                  </div>
                  <StatusBadge status={item.status} size="sm" />
                </div>
                <p className="text-sm font-semibold text-slate-900 line-clamp-2">{item.description}</p>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1 truncate">
                    <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
                    <span className="truncate">{item.location?.ward || 'Local ward'}</span>
                  </span>
                  <span className={item.assignedWorker ? 'text-blue-700 font-semibold' : 'italic text-slate-400'}>
                    {item.assignedWorker || 'Unassigned'}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {activeComplaint && (
        <AdminComplaintDetailModal complaint={activeComplaint} onClose={() => setActiveComplaint(null)} />
      )}

      {/* Field staff */}
      {showStaffModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-slate-950/60 anim-fade" onClick={() => setShowStaffModal(false)} />
          <div className="relative bg-white w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl anim-slide-up">
            <button
              type="button"
              onClick={() => setShowStaffModal(false)}
              aria-label="Close"
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5 pr-10">
              <div className="p-3 bg-brand-50 text-brand-700 rounded-2xl">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">Field staff</h3>
                <p className="text-xs text-slate-500">Engineers available for dispatch.</p>
              </div>
            </div>

            <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 mb-5 border border-slate-200 rounded-xl">
              {workers.map((w) => (
                <div key={w.workerId} className="py-2.5 px-3 flex items-center justify-between gap-3 text-sm">
                  <div className="min-w-0">
                    <div className="font-bold text-slate-800 truncate">{w.name}</div>
                    <div className="text-xs text-slate-400">{w.department}</div>
                  </div>
                  <span className="font-mono text-xs text-slate-500 flex-shrink-0">{w.phone}</span>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddWorker} className="space-y-3 pt-4 border-t border-slate-100">
              <div className="text-sm font-bold text-slate-800">Add field engineer</div>
              {staffError && <Alert tone="error">{staffError}</Alert>}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input type="text" required value={newWorkerName} onChange={(e) => setNewWorkerName(e.target.value)} placeholder="Engineer name" aria-label="Engineer name" className="input" />
                <select value={newWorkerDept} onChange={(e) => setNewWorkerDept(e.target.value)} aria-label="Department" className="input">
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <input type="tel" value={newWorkerPhone} onChange={(e) => setNewWorkerPhone(e.target.value)} placeholder="Phone (e.g. +91 98470 12345)" aria-label="Phone number" className="input" />
              <button type="submit" disabled={staffLoading} className="btn-primary w-full">
                <Plus className="w-4 h-4" />
                {staffLoading ? 'Adding…' : 'Add field worker'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
