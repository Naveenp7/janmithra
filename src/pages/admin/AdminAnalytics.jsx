import React, { useState, useEffect } from 'react';
import { subscribeComplaints } from '../../services/firebase.js';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { BarChart3, PieChart as PieIcon } from 'lucide-react';
import { PageHeader, StatCard, Spinner, Alert } from '../../components/ui.jsx';
import { CheckCircle2, Flame, Activity } from 'lucide-react';

const CATEGORY_COLORS = {
  Road: '#186a42',
  Water: '#0284c7',
  Electricity: '#f59e0b',
  Waste: '#84cc16',
  Drainage: '#8b5cf6',
  Other: '#64748b',
};

const STATUS_COLORS = {
  submitted: '#94a3b8',
  assigned: '#3b82f6',
  in_progress: '#f59e0b',
  resolved: '#10b981',
};

const STATUS_LABELS = {
  submitted: 'Submitted',
  assigned: 'Assigned',
  in_progress: 'In Progress',
  resolved: 'Resolved',
};

export default function AdminAnalytics() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    const unsubscribe = subscribeComplaints(
      null,
      (items) => {
        setComplaints(items);
        setLoading(false);
      },
      setLoadError
    );

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // Category counts data for Bar Chart
  const categories = ['Road', 'Water', 'Electricity', 'Waste', 'Drainage', 'Other'];
  const categoryData = categories.map((cat) => ({
    name: cat,
    count: complaints.filter((c) => c.category === cat).length,
    fill: CATEGORY_COLORS[cat] || '#64748b',
  }));

  // Status counts data for Donut Chart
  const statuses = ['submitted', 'assigned', 'in_progress', 'resolved'];
  const statusData = statuses.map((st) => ({
    name: STATUS_LABELS[st],
    count: complaints.filter((c) => c.status === st).length,
    color: STATUS_COLORS[st],
  })).filter(d => d.count > 0);

  // Key metrics
  const total = complaints.length;
  const resolved = complaints.filter((c) => c.status === 'resolved').length;
  const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;
  const criticalPending = complaints.filter((c) => c.urgency === 'Critical' && c.status !== 'resolved').length;

  return (
    <div>
      <PageHeader
        eyebrow="Analytics"
        title="Performance & issue analytics"
        subtitle="How issues are distributed and how quickly they are being resolved."
      />
      {loadError && <Alert tone="error" className="mb-5">{loadError}</Alert>}

      {loading ? (
        <Spinner label="Aggregating metrics…" />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <StatCard label="Resolution rate" value={`${resolutionRate}%`} icon={CheckCircle2} tone="green" hint={`${resolved} of ${total} closed`} />
            <StatCard label="Critical unresolved" value={criticalPending} icon={Flame} tone="rose" hint="Need immediate action" />
            <StatCard label="Active pipeline" value={total - resolved} icon={Activity} tone="blue" hint="Submitted / in progress" />
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Category Breakdown (Bar Chart) */}
            <div className="card p-5 sm:p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Complaints by Department Category
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Distribution of incoming issues across civic sectors
                  </p>
                </div>
                <BarChart3 className="w-5 h-5 text-slate-400" />
              </div>

              <div className="h-64 sm:h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(val) => [`${val} complaints`, 'Total']}
                      contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                    />
                    <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Status Distribution (Donut / Pie Chart) */}
            <div className="card p-5 sm:p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Resolution Status Distribution
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Current lifecycle state of all registered issues
                  </p>
                </div>
                <PieIcon className="w-5 h-5 text-slate-400" />
              </div>

              <div className="h-64 sm:h-72 w-full flex items-center justify-center">
                {statusData.length === 0 ? (
                  <div className="text-xs text-slate-400">No status data available</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusData}
                        dataKey="count"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={95}
                        paddingAngle={5}
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`slice-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val) => [`${val} complaints`, 'Count']}
                        contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                      />
                      <Legend
                        verticalAlign="bottom"
                        height={36}
                        wrapperStyle={{ fontSize: '12px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
