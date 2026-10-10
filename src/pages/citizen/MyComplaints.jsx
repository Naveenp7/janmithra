import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { subscribeComplaints } from '../../services/firebase.js';
import ComplaintCard from '../../components/ComplaintCard.jsx';
import {
  PageHeader,
  StatCard,
  Spinner,
  EmptyState,
  Alert,
  CATEGORIES,
  STATUS_OPTIONS,
} from '../../components/ui.jsx';
import { PlusCircle, Search, ListChecks, Clock, Wrench, CheckCircle2, Inbox } from 'lucide-react';

export default function MyComplaints() {
  const { currentUser } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!currentUser) {
      setComplaints([]);
      setLoading(false);
      return undefined;
    }

    setLoading(true);
    setLoadError(null);
    const unsubscribe = subscribeComplaints(
      currentUser.uid,
      (items) => {
        setComplaints(items);
        setLoading(false);
      },
      setLoadError
    );
    return () => unsubscribe?.();
  }, [currentUser?.uid]);

  const filtered = complaints.filter((c) => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    if (categoryFilter !== 'all' && c.category !== categoryFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const hay = [c.description, c.location?.ward, c.location?.address].join(' ').toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const count = (fn) => complaints.filter(fn).length;
  const stats = {
    total: complaints.length,
    pending: count((c) => (c.status || 'submitted') === 'submitted'),
    active: count((c) => c.status === 'assigned' || c.status === 'in_progress'),
    resolved: count((c) => c.status === 'resolved'),
  };

  return (
    <div>
      <PageHeader
        eyebrow="My dashboard"
        title={`Hello, ${currentUser?.name?.split(' ')[0] || 'there'}`}
        subtitle="Follow every issue you have reported, live, until it is resolved."
        actions={
          <Link to="/citizen" className="btn-primary">
            <PlusCircle className="w-4 h-4" /> Report new issue
          </Link>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <StatCard label="Total complaints" value={stats.total} icon={ListChecks} tone="slate" />
        <StatCard label="Awaiting review" value={stats.pending} icon={Clock} tone="amber" />
        <StatCard label="In progress" value={stats.active} icon={Wrench} tone="blue" />
        <StatCard label="Resolved" value={stats.resolved} icon={CheckCircle2} tone="green" />
      </div>

      {/* Filters */}
      <div className="card p-3 sm:p-4 mb-5 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by keyword, ward or address"
              aria-label="Search complaints"
              className="input pl-10"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            aria-label="Filter by category"
            className="input sm:w-48"
          >
            <option value="all">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar -mx-1 px-1">
          {[{ key: 'all', label: 'All' }, ...STATUS_OPTIONS].map((st) => (
            <button
              key={st.key}
              type="button"
              onClick={() => setStatusFilter(st.key)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                statusFilter === st.key
                  ? 'bg-brand-700 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {loadError && <Alert tone="error" className="mb-5">{loadError}</Alert>}

      {loading ? (
        <Spinner label="Loading your complaints…" />
      ) : filtered.length === 0 && !loadError ? (
        <EmptyState
          icon={complaints.length === 0 ? PlusCircle : Inbox}
          title={complaints.length === 0 ? 'No complaints yet' : 'No matches'}
          text={
            complaints.length === 0
              ? "You haven't reported anything yet. Spotted a pothole, leak or broken light? Report it in under a minute."
              : 'No complaints match your search and filters.'
          }
          actionLabel="Report an issue"
          actionTo={complaints.length === 0 ? '/citizen' : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {filtered.map((complaint) => (
            <ComplaintCard key={complaint.complaintId} complaint={complaint} linkPrefix="/citizen/complaint" />
          ))}
        </div>
      )}
    </div>
  );
}
