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
import { BarChart3, PieChart as PieIcon, RefreshCw, TrendingUp, ShieldAlert, CheckCircle2 } from 'lucide-react';

const CATEGORY_COLORS = {
  Road: '#0d9488',
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

  useEffect(() => {
    const unsubscribe = subscribeComplaints(null, (items) => {
      setComplaints(items);
      setLoading(false);
    });

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs font-bold text-teal-600 uppercase tracking-wider mb-1">
          <BarChart3 className="w-4 h-4" />
          <span>LSGD Civic Analytics Engine</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Performance & Issue Analytics
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Real-time metrics on civic distribution, resolution velocity, and department workloads.
        </p>
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <RefreshCw className="w-8 h-8 text-teal-600 animate-spin mx-auto mb-3" />
          <p className="text-xs font-semibold text-slate-500">Aggregating departmental metrics...</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Overall Resolution Rate
              </div>
              <div className="text-3xl font-black text-slate-900 mt-1 flex items-baseline gap-2">
                <span>{resolutionRate}%</span>
                <span className="text-xs font-bold text-emerald-600">
                  ({resolved} of {total} closed)
                </span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Critical Issues Unresolved
              </div>
              <div className="text-3xl font-black text-rose-600 mt-1 flex items-baseline gap-2">
                <span>{criticalPending}</span>
                <span className="text-xs font-bold text-rose-500">requiring immediate action</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Active Complaints In Pipeline
              </div>
              <div className="text-3xl font-black text-teal-700 mt-1 flex items-baseline gap-2">
                <span>{total - resolved}</span>
                <span className="text-xs font-bold text-teal-600">submitted / in progress</span>
              </div>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Category Breakdown (Bar Chart) */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
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

              <div className="h-72 w-full">
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
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
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

              <div className="h-72 w-full flex items-center justify-center">
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
