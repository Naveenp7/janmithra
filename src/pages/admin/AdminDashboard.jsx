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
  LayoutDashboard,
  MapPin,
  Search,
  Flame,
  Wrench,
  CheckCircle2,
  Inbox,
  RefreshCw,
  Eye,
  Users,
  Plus,
  X,
} from 'lucide-react';

export default function AdminDashboard() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeComplaint, setActiveComplaint] = useState(null);

  // Field Staff Modal State
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [workers, setWorkers] = useState([]);
  const [newWorkerName, setNewWorkerName] = useState('');
  const [newWorkerDept, setNewWorkerDept] = useState('Road');
  const [newWorkerPhone, setNewWorkerPhone] = useState('');
  const [staffLoading, setStaffLoading] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [urgencyFilter, setUrgencyFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setLoading(true);
    // Realtime subscription for all real complaints
    const unsubscribeComplaints = subscribeComplaints(null, (allComplaints) => {
      setComplaints(allComplaints);
      setLoading(false);
    });

    const unsubscribeWorkers = subscribeWorkers((allWorkers) => {
      setWorkers(allWorkers);
    });

    return () => {
      if (typeof unsubscribeComplaints === 'function') unsubscribeComplaints();
      if (typeof unsubscribeWorkers === 'function') unsubscribeWorkers();
    };
  }, []);

  // Filter complaints
  const filtered = complaints.filter((c) => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    if (categoryFilter !== 'all' && c.category !== categoryFilter) return false;
    if (urgencyFilter !== 'all' && c.urgency !== urgencyFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchDesc = c.description?.toLowerCase().includes(q);
      const matchWard = c.location?.ward?.toLowerCase().includes(q);
      const matchCitizen = c.citizenName?.toLowerCase().includes(q);
      const matchWorker = c.assignedWorker?.toLowerCase().includes(q);
      if (!matchDesc && !matchWard && !matchCitizen && !matchWorker) return false;
    }
    return true;
  });

  // KPI Metrics on real data
  const totalCount = complaints.length;
  const criticalCount = complaints.filter((c) => c.urgency === 'Critical' && c.status !== 'resolved').length;
  const inProgressCount = complaints.filter((c) => c.status === 'in_progress' || c.status === 'assigned').length;
  const resolvedCount = complaints.filter((c) => c.status === 'resolved').length;

  const handleAddWorker = async (e) => {
    e.preventDefault();
    if (!newWorkerName.trim()) return;
    setStaffLoading(true);
    try {
      await addWorkerToFirestore({
        name: newWorkerName.trim(),
        department: newWorkerDept,
        phone: newWorkerPhone.trim(),
      });
      setNewWorkerName('');
      setNewWorkerPhone('');
    } catch (e) {
      console.error('Error adding worker:', e);
    } finally {
      setStaffLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-teal-600 uppercase tracking-wider mb-1">
            <LayoutDashboard className="w-4 h-4" />
            <span>Municipal Authority Console</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Civic Issue Management Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time municipal monitoring, AI urgency triage, and field worker dispatch.
          </p>
        </div>

        {/* Action Buttons: Staff Manager + Map View */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => setShowStaffModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold transition-all shadow-2xs hover:shadow-xs cursor-pointer"
          >
            <Users className="w-4 h-4 text-teal-600" />
            <span>Field Staff ({workers.length})</span>
          </button>

          <Link
            to="/admin/map"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
          >
            <MapPin className="w-4 h-4 text-teal-400" />
            <span>Open GIS Map</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Total */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Complaints</span>
            <Inbox className="w-5 h-5 text-slate-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">{totalCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">Registered in municipal system</div>
        </div>

        {/* Critical */}
        <div className="bg-white rounded-2xl p-5 border border-rose-200 shadow-2xs">
          <div className="flex items-center justify-between text-rose-600 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Critical Pending</span>
            <Flame className="w-5 h-5 text-rose-500 animate-pulse" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-rose-700">{criticalCount}</div>
          <div className="text-[11px] text-rose-500/80 mt-1">Immediate safety hazards</div>
        </div>

        {/* In Progress */}
        <div className="bg-white rounded-2xl p-5 border border-amber-200 shadow-2xs">
          <div className="flex items-center justify-between text-amber-700 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">In Progress</span>
            <Wrench className="w-5 h-5 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-800">{inProgressCount}</div>
          <div className="text-[11px] text-amber-600/80 mt-1">Under active inspection / repair</div>
        </div>

        {/* Resolved */}
        <div className="bg-white rounded-2xl p-5 border border-emerald-200 shadow-2xs">
          <div className="flex items-center justify-between text-emerald-700 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Resolved</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-800">{resolvedCount}</div>
          <div className="text-[11px] text-emerald-600/80 mt-1">Verified and closed</div>
        </div>
      </div>

      {/* Multi-Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs mb-6 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Keyword & Ward Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ward, citizen, issue..."
              className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 text-slate-700 font-medium cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="submitted">Submitted</option>
              <option value="assigned">Assigned</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 text-slate-700 font-medium cursor-pointer"
            >
              <option value="all">All Categories</option>
              <option value="Road">Road</option>
              <option value="Water">Water</option>
              <option value="Electricity">Electricity</option>
              <option value="Waste">Waste</option>
              <option value="Drainage">Drainage</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Urgency Filter */}
          <div>
            <select
              value={urgencyFilter}
              onChange={(e) => setUrgencyFilter(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 text-slate-700 font-medium cursor-pointer"
            >
              <option value="all">All Urgency Levels</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Complaints Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center">
            <RefreshCw className="w-8 h-8 text-teal-600 animate-spin mx-auto mb-3" />
            <p className="text-xs font-semibold text-slate-500">Syncing live complaints database...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-sm max-w-sm mx-auto">
            <Inbox className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <div className="font-bold text-slate-800">No Complaints Logged</div>
            <p className="text-xs text-slate-400 mt-1">
              {complaints.length === 0
                ? 'The database is currently clean with no complaints. Complaints submitted by citizens will appear here instantly.'
                : 'No complaints match the selected filter criteria.'}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600 border-collapse">
                <thead className="bg-slate-50/80 text-slate-700 font-extrabold uppercase tracking-wider text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">Description & Citizen</th>
                    <th className="py-3.5 px-4">Ward / Location</th>
                    <th className="py-3.5 px-4">AI Urgency</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Assigned Crew</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filtered.map((item) => (
                    <tr
                      key={item.complaintId}
                      className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                      onClick={() => setActiveComplaint(item)}
                    >
                      {/* Category */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-block px-2.5 py-1 rounded-md text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200">
                          {item.category}
                        </span>
                      </td>

                      {/* Description & Citizen */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="line-clamp-2 text-slate-900 font-semibold leading-relaxed">
                          {item.description}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          By {item.citizenName || 'Citizen'}
                        </div>
                      </td>

                      {/* Ward */}
                      <td className="py-3.5 px-4 max-w-[160px] truncate">
                        <div className="flex items-center gap-1 text-slate-700 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span className="truncate">{item.location?.ward || 'General'}</span>
                        </div>
                      </td>

                      {/* AI Urgency */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <UrgencyBadge urgency={item.urgency} size="sm" />
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <StatusBadge status={item.status} size="sm" />
                      </td>

                      {/* Assigned Crew */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {item.assignedWorker ? (
                          <span className="text-blue-700 font-semibold text-xs">
                            {item.assignedWorker}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs italic">Unassigned</span>
                        )}
                      </td>

                      {/* Action button */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveComplaint(item);
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Manage</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List View */}
            <div className="md:hidden divide-y divide-slate-100">
              {filtered.map((item) => (
                <div
                  key={item.complaintId}
                  onClick={() => setActiveComplaint(item)}
                  className="p-4 hover:bg-slate-50 transition-colors cursor-pointer space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                        {item.category}
                      </span>
                      <UrgencyBadge urgency={item.urgency} size="sm" />
                    </div>
                    <StatusBadge status={item.status} size="sm" />
                  </div>

                  <p className="text-xs font-semibold text-slate-900 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                    <div className="flex items-center gap-1 truncate max-w-[180px]">
                      <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
                      <span className="truncate">{item.location?.ward || 'Local Ward'}</span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveComplaint(item);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-900 text-white rounded-lg text-xs font-bold shadow-2xs cursor-pointer"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Manage</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Complaint Detail & Assignment Modal */}
      {activeComplaint && (
        <AdminComplaintDetailModal
          complaint={activeComplaint}
          onClose={() => setActiveComplaint(null)}
          onUpdated={() => {}}
        />
      )}

      {/* Manage Field Staff Modal */}
      {showStaffModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative my-8">
            <button
              onClick={() => setShowStaffModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-full cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-teal-50 text-teal-700 rounded-2xl">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Municipal Field Staff</h3>
                <p className="text-xs text-slate-500">
                  Workers available for civic complaint resolution dispatch.
                </p>
              </div>
            </div>

            {/* List of existing staff */}
            <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 mb-5 border border-slate-200 rounded-xl p-2 bg-slate-50/50">
              {workers.map((w) => (
                <div key={w.workerId} className="py-2 px-2 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-800">{w.name}</span>
                    <span className="ml-2 text-slate-400">({w.department})</span>
                  </div>
                  <span className="font-mono text-slate-500">{w.phone}</span>
                </div>
              ))}
            </div>

            {/* Add Staff Form */}
            <form onSubmit={handleAddWorker} className="space-y-3 pt-2 border-t border-slate-100">
              <div className="text-xs font-bold text-slate-800">Add New Field Engineer</div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  required
                  value={newWorkerName}
                  onChange={(e) => setNewWorkerName(e.target.value)}
                  placeholder="Engineer Name"
                  className="text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500"
                />
                <select
                  value={newWorkerDept}
                  onChange={(e) => setNewWorkerDept(e.target.value)}
                  className="text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500"
                >
                  <option value="Road">Road</option>
                  <option value="Water">Water</option>
                  <option value="Electricity">Electricity</option>
                  <option value="Waste">Waste</option>
                  <option value="Drainage">Drainage</option>
                  <option value="General">General</option>
                </select>
              </div>
              <input
                type="tel"
                value={newWorkerPhone}
                onChange={(e) => setNewWorkerPhone(e.target.value)}
                placeholder="Phone Number (e.g. +91 98470 12345)"
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500"
              />
              <button
                type="submit"
                disabled={staffLoading}
                className="w-full py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{staffLoading ? 'Registering...' : 'Add Field Worker'}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
