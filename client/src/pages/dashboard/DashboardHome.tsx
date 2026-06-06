import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import {
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Plus,
  Users,
  FileText,
  FileCheck,
  Receipt,
  Activity,
  Calendar,
  Briefcase
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import toast from 'react-hot-toast';

interface KPI {
  label: string;
  value: number | string;
  change?: string;
  changeType?: 'increase' | 'decrease';
  isCurrency?: boolean;
  url?: string;
}

export const DashboardHome: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/dashboard/stats');
        if (response.data.success) {
          setStats(response.data.stats);
        }
      } catch (err: any) {
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const formatValue = (kpi: KPI) => {
    if (kpi.isCurrency) {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
      }).format(Number(kpi.value));
    }
    return kpi.value;
  };

  const getKpiIcon = (label: string) => {
    const lower = label.toLowerCase();
    if (lower.includes('user')) return <Users className="w-5 h-5 text-brand-600" />;
    if (lower.includes('vendor')) return <Users className="w-5 h-5 text-accent-600" />;
    if (lower.includes('rfq')) return <FileText className="w-5 h-5 text-indigo-600" />;
    if (lower.includes('approval')) return <FileCheck className="w-5 h-5 text-warning-600" />;
    if (lower.includes('invoice')) return <Receipt className="w-5 h-5 text-rose-600" />;
    return <TrendingUp className="w-5 h-5 text-brand-600" />;
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-8 w-48 skeleton mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 skeleton" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 skeleton" />
          <div className="h-96 skeleton" />
        </div>
      </div>
    );
  }

  const kpis: KPI[] = stats?.kpis || [];
  const trendData = stats?.trendData || [];

  return (
    <div className="page-container space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Welcome Back, {user?.name}</h1>
          <p className="text-sm text-surface-500 mt-1">
            Overview dashboard for the role of <span className="font-semibold text-brand-600">{user?.role}</span>
          </p>
        </div>
        <div className="flex gap-2">
          {/* Role-specific Quick Actions */}
          {user?.role === 'Officer' && (
            <>
              <button
                onClick={() => navigate('/rfqs')}
                className="btn btn-primary btn-sm flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Create RFQ</span>
              </button>
              <button
                onClick={() => navigate('/vendors')}
                className="btn btn-secondary btn-sm flex items-center gap-1.5"
              >
                <Users className="w-4 h-4" />
                <span>Add Vendor</span>
              </button>
            </>
          )}
          {user?.role === 'Vendor' && (
            <button
              onClick={() => navigate('/rfqs')}
              className="btn btn-primary btn-sm flex items-center gap-1.5"
            >
              <FileText className="w-4 h-4" />
              <span>Browse RFQs</span>
            </button>
          )}
          {user?.role === 'Manager' && (
            <button
              onClick={() => navigate('/approvals')}
              className="btn btn-primary btn-sm flex items-center gap-1.5"
            >
              <FileCheck className="w-4 h-4" />
              <span>Pending Approvals</span>
            </button>
          )}
          {user?.role === 'Admin' && (
            <button
              onClick={() => navigate('/activity-logs')}
              className="btn btn-primary btn-sm flex items-center gap-1.5"
            >
              <Activity className="w-4 h-4" />
              <span>Audit Logs</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, idx) => (
          <div
            key={idx}
            onClick={() => kpi.url && navigate(kpi.url)}
            className={`card p-6 flex flex-col justify-between ${
              kpi.url ? 'cursor-pointer hover:shadow-card-hover hover:border-surface-300 transition-all duration-200' : ''
            }`}
          >
            <div className="flex items-start justify-between">
              <span className="text-sm font-semibold text-surface-500">{kpi.label}</span>
              <div className="p-2 bg-surface-50 rounded-xl">{getKpiIcon(kpi.label)}</div>
            </div>
            <div className="mt-4">
              <span className="text-2xl font-bold text-surface-900 tracking-tight">
                {formatValue(kpi)}
              </span>
              {kpi.change && (
                <div className="flex items-center gap-1 mt-1 text-xs">
                  {kpi.changeType === 'increase' ? (
                    <TrendingUp className="w-3.5 h-3.5 text-accent-500" />
                  ) : (
                    <TrendingDown className="w-3.5 h-3.5 text-danger-500" />
                  )}
                  <span
                    className={
                      kpi.changeType === 'increase' ? 'text-accent-600 font-medium' : 'text-danger-600 font-medium'
                    }
                  >
                    {kpi.change}
                  </span>
                  <span className="text-surface-400">vs last month</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Main Charts & Feed Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Area Chart */}
        <div className="card p-6 lg:col-span-2">
          <h3 className="text-base font-bold text-surface-900 mb-6 flex items-center gap-2">
            <span>Spend Analytics</span>
            <span className="text-xs font-normal text-surface-400">(INR Trend)</span>
          </h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `₹${val >= 100000 ? `${(val / 100000).toFixed(0)}L` : val}`}
                />
                <Tooltip
                  formatter={(val: any) => [
                    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val),
                    'Spend'
                  ]}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                />
                <Area type="monotone" dataKey="value" stroke="#4f46e5" strokeWidth={2.5} fillOpacity={1} fill="url(#spendGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Dynamic Role-Based Sidebar Section */}
        <div className="card p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-surface-900 mb-6 flex items-center justify-between">
              <span>
                {user?.role === 'Admin' && 'System Activities'}
                {user?.role === 'Manager' && 'Approvals Queue'}
                {user?.role === 'Officer' && 'Recent RFQs'}
                {user?.role === 'Vendor' && 'Recent Quotations'}
              </span>
              <button className="text-xs font-semibold text-brand-600 hover:underline flex items-center gap-0.5">
                <span>View all</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </h3>

            {/* List entries */}
            <div className="space-y-4">
              {/* Admin list */}
              {user?.role === 'Admin' && (stats?.recentActivity || []).length === 0 && (
                <div className="text-center text-sm text-surface-400 py-8">No recent activity</div>
              )}
              {user?.role === 'Admin' && (stats?.recentActivity || []).map((log: any) => (
                <div key={log.id} className="flex gap-3 text-sm">
                  <div className="shrink-0 w-8 h-8 bg-surface-50 text-surface-600 rounded-lg flex items-center justify-center">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-surface-800 truncate">{log.action}</p>
                    <p className="text-xs text-surface-500 mt-0.5">{log.details || 'System event triggered'}</p>
                  </div>
                </div>
              ))}

              {/* Manager list */}
              {user?.role === 'Manager' && (stats?.recentApprovals || []).length === 0 && (
                <div className="text-center text-sm text-surface-400 py-8">No pending approvals</div>
              )}
              {user?.role === 'Manager' && (stats?.recentApprovals || []).map((app: any) => (
                <div key={app.id} className="flex gap-3 text-sm items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-surface-800 truncate">{app.rfq_title}</p>
                    <p className="text-xs text-surface-500 mt-0.5">By {app.requested_by}</p>
                  </div>
                  <span className="badge-warning">Pending</span>
                </div>
              ))}

              {/* Officer list */}
              {user?.role === 'Officer' && (stats?.recentRfqs || []).length === 0 && (
                <div className="text-center text-sm text-surface-400 py-8">No RFQs created yet</div>
              )}
              {user?.role === 'Officer' && (stats?.recentRfqs || []).map((rfq: any) => (
                <div key={rfq.id} className="flex gap-3 text-sm items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-surface-800 truncate">{rfq.title}</p>
                    <p className="text-xs text-surface-500 mt-0.5">{rfq.ref_number}</p>
                  </div>
                  <span className={`badge-${rfq.status === 'Draft' ? 'draft' : 'brand'}`}>{rfq.status}</span>
                </div>
              ))}

              {/* Vendor list */}
              {user?.role === 'Vendor' && (stats?.recentQuotes || []).length === 0 && (
                <div className="text-center text-sm text-surface-400 py-8">No quotations submitted yet</div>
              )}
              {user?.role === 'Vendor' && (stats?.recentQuotes || []).map((q: any) => (
                <div key={q.id} className="flex gap-3 text-sm items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-surface-800 truncate">{q.rfq_title}</p>
                    <p className="text-xs text-surface-500 mt-0.5">
                      {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(q.total_amount)}
                    </p>
                  </div>
                  <span className={`badge-${q.status === 'Submitted' ? 'brand' : 'active'}`}>{q.status}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Info Box */}
          <div className="p-4 bg-brand-50 border border-brand-100 rounded-xl mt-6 flex gap-3">
            <Briefcase className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-brand-800 uppercase tracking-wider">Quick Info</p>
              <p className="text-[11px] text-brand-600 mt-0.5">
                Always ensure you check pending items to keep the procurement workflows moving.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default DashboardHome;
