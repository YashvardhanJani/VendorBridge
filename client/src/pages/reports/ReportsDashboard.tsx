import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import {
  TrendingUp,
  Download,
  DollarSign,
  Clock,
  Briefcase,
  Layers,
  ChevronDown,
  PieChart as PieIcon,
  BarChart as BarIcon,
  Percent,
  Calendar
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import toast from 'react-hot-toast';

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];

export const ReportsDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchReportsData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reports/data');
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load statistical report metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportsData();
  }, []);

  const handleExportCSV = () => {
    if (!data) return toast.error('No report data available for export');

    // Spend Trend CSV
    const headers = ['Month Name', 'Spend (INR)'];
    const rows = data.spendTrend.map((t: any) => [t.name, t.value]);

    const csvContent = [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `SpendReports_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Spend statistics exported successfully');
  };

  if (loading || !data) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-8 w-48 skeleton" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="h-24 skeleton rounded-xl" />
          <div className="h-24 skeleton rounded-xl" />
          <div className="h-24 skeleton rounded-xl" />
          <div className="h-24 skeleton rounded-xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-80 skeleton rounded-xl" />
          <div className="h-80 skeleton rounded-xl" />
        </div>
      </div>
    );
  }

  const { kpis, spendTrend, vendorPerformance, categorySpend } = data;

  return (
    <div className="page-container space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title font-black text-2xl tracking-tight text-surface-900">Procurement Reports & Analytics</h1>
          <p className="text-sm text-surface-500 mt-1">
            Real-time aggregate overview of platform spend trends, savings, category distributions, and vendor rankings.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="btn btn-secondary py-2.5 px-4 text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto bg-white border border-surface-200"
        >
          <Download className="w-4 h-4" />
          <span>Export Spend CSV</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="card p-5 bg-white border border-surface-200 relative overflow-hidden shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center text-brand-700 shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-[11px] text-surface-450 uppercase tracking-wider font-bold">Total Platform Spend</span>
            <span className="text-xl font-black text-surface-900 mt-1 block">
              ₹{(kpis.grandSpend || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="card p-5 bg-white border border-surface-200 relative overflow-hidden shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700 shrink-0">
            <Percent className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-[11px] text-surface-450 uppercase tracking-wider font-bold">Cumulative Savings</span>
            <span className="text-xl font-black text-emerald-700 mt-1 block">
              ₹{(kpis.totalSavings || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </span>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="card p-5 bg-white border border-surface-200 relative overflow-hidden shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-violet-50 flex items-center justify-center text-violet-700 shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-[11px] text-surface-450 uppercase tracking-wider font-bold">Avg Delivery Days</span>
            <span className="text-xl font-black text-surface-900 mt-1 block">
              {kpis.avgDeliveryDays} Days
            </span>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="card p-5 bg-white border border-surface-200 relative overflow-hidden shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-orange-700 shrink-0">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-[11px] text-surface-450 uppercase tracking-wider font-bold">Total Orders Settled</span>
            <span className="text-xl font-black text-surface-900 mt-1 block">
              {kpis.totalPOs} Purchase Orders
            </span>
          </div>
        </div>
      </div>

      {/* Chart Rows */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Spend Trend Chart */}
        <div className="card p-6 bg-white border border-surface-200 lg:col-span-2 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-brand-600" />
              <h3 className="font-bold text-surface-900 text-sm">Monthly Spend Analysis</h3>
            </div>
            <span className="text-[10px] text-surface-400 font-semibold uppercase flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>FY 2026</span>
            </span>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={spendTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  formatter={(value: any) => [`₹${Number(value).toLocaleString()}`, 'Spend']}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0' }}
                />
                <Area type="monotone" dataKey="value" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorSpend)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Spend Distribution */}
        <div className="card p-6 bg-white border border-surface-200 space-y-4 shadow-sm">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-brand-600" />
            <h3 className="font-bold text-surface-900 text-sm">Spend by Vendor Category</h3>
          </div>
          <div className="h-72 flex flex-col justify-center">
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categorySpend}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categorySpend.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => `₹${Number(value).toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            {/* Custom Legends */}
            <div className="grid grid-cols-2 gap-2 text-[10px] text-surface-550 pt-2 border-t border-surface-100">
              {categorySpend.map((entry: any, index: number) => (
                <div key={entry.name} className="flex items-center gap-1.5 truncate">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="truncate">{entry.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Supplier Performance analysis */}
      <div className="card p-6 bg-white border border-surface-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-brand-600" />
          <h3 className="font-bold text-surface-900 text-sm">Active Supplier Performance Rankings</h3>
        </div>

        {vendorPerformance.length === 0 ? (
          <p className="text-xs text-surface-450 italic py-4">No active vendor rankings logs available.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-50 border-b border-surface-200 font-bold text-surface-500 uppercase">
                <tr>
                  <th className="py-3 px-4">Vendor Company Name</th>
                  <th className="py-3 px-4 text-center">Quality Rating</th>
                  <th className="py-3 px-4 text-center">Contracts Awarded</th>
                  <th className="py-3 px-4 text-right">Rating Level</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100 text-sm">
                {vendorPerformance.map((vendor: any, index: number) => (
                  <tr key={index} className="hover:bg-surface-50/20">
                    <td className="py-3.5 px-4 font-semibold text-surface-850">{vendor.name}</td>
                    <td className="py-3.5 px-4 text-center font-bold text-surface-900">{vendor.rating} / 5.0</td>
                    <td className="py-3.5 px-4 text-center font-semibold text-surface-700">{vendor.ordersCount} POs</td>
                    <td className="py-3.5 px-4 text-right">
                      {vendor.rating >= 4.5 ? (
                        <span className="bg-emerald-50 border border-emerald-250 text-emerald-700 text-[10px] px-2.5 py-0.5 rounded-full font-bold">Tier 1 Elite</span>
                      ) : vendor.rating >= 3.8 ? (
                        <span className="bg-blue-50 border border-blue-200 text-blue-700 text-[10px] px-2.5 py-0.5 rounded-full font-bold">Tier 2 Approved</span>
                      ) : (
                        <span className="bg-surface-50 border border-surface-200 text-surface-700 text-[10px] px-2.5 py-0.5 rounded-full font-bold">Standard</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
export default ReportsDashboard;
