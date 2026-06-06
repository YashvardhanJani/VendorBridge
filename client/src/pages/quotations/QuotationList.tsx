import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import { Search, Eye, Filter, IndianRupee, ArrowRight, ShieldCheck, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

export const QuotationList: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [quotes, setQuotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchQuotations = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('/quotations', { params });
      if (res.data.success) {
        setQuotes(res.data.quotations);
      }
    } catch (err) {
      toast.error('Failed to load quotation proposals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotations();
  }, [statusFilter]);

  const getStatusBadge = (s: string) => {
    switch (s) {
      case 'Draft':
        return <span className="badge-draft px-2.5 py-0.5 text-xs">Draft</span>;
      case 'Submitted':
        return <span className="badge-brand px-2.5 py-0.5 text-xs">Submitted</span>;
      case 'Selected':
        return <span className="badge-active bg-emerald-50 text-emerald-700 border-emerald-250 px-2.5 py-0.5 text-xs">Selected</span>;
      case 'Rejected':
        return <span className="badge-danger px-2.5 py-0.5 text-xs">Rejected</span>;
      default:
        return <span className="badge-draft px-2.5 py-0.5 text-xs">{s}</span>;
    }
  };

  // Local filter for search (vendor name or RFQ reference / title)
  const filteredQuotes = quotes.filter((q: any) => {
    const term = searchTerm.toLowerCase();
    const vendorName = (q.vendor_name || '').toLowerCase();
    const rfqRef = (q.rfq_ref || '').toLowerCase();
    const rfqTitle = (q.rfq_title || '').toLowerCase();
    return vendorName.includes(term) || rfqRef.includes(term) || rfqTitle.includes(term);
  });

  return (
    <div className="page-container space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Bid Quotations</h1>
          <p className="text-sm text-surface-500 mt-1">
            {user?.role === 'Vendor'
              ? 'Monitor status and details of your submitted bid proposals'
              : 'Review, select, and filter quotations received from active suppliers'}
          </p>
        </div>
      </div>

      {/* Filters & search */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
          <input
            type="text"
            placeholder="Search vendor name, RFQ Ref, or project requirement..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
        </div>

        <div className="flex gap-2">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field pl-10 w-48"
            >
              <option value="">All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="Submitted">Submitted</option>
              <option value="Selected">Selected</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table grid */}
      {loading ? (
        <div className="space-y-3">
          <div className="h-10 skeleton rounded-xl" />
          <div className="h-40 skeleton rounded-xl" />
        </div>
      ) : filteredQuotes.length === 0 ? (
        <div className="text-center py-16 card border border-surface-200 bg-white space-y-3">
          <div className="mx-auto w-12 h-12 rounded-full bg-surface-50 flex items-center justify-center text-surface-400">
            <Eye className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-surface-900 text-sm">No quotations found</h3>
            <p className="text-xs text-surface-450 mt-1">
              Try adjusting your query filter terms.
            </p>
          </div>
        </div>
      ) : (
        <div className="card bg-white border border-surface-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-50 border-b border-surface-200 font-bold text-surface-500 uppercase">
                <tr>
                  <th className="py-3.5 px-6">Supplier Details</th>
                  <th className="py-3.5 px-6">RFQ Reference</th>
                  <th className="py-3.5 px-6 text-right">Quoted Amt (INR)</th>
                  <th className="py-3.5 px-6 text-center">Fulfillment</th>
                  <th className="py-3.5 px-6">Submitted Date</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100 text-sm">
                {filteredQuotes.map((q: any) => (
                  <tr key={q.id} className="hover:bg-surface-50/45 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-bold text-surface-850">{q.vendor_name || 'N/A'}</div>
                      <div className="text-[10px] text-surface-450 font-mono mt-0.5">{q.vendor_id}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-mono text-xs font-bold text-brand-650">{q.rfq_ref}</div>
                      <div className="text-[11px] text-surface-500 max-w-[200px] truncate mt-0.5">
                        {q.rfq_title}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right font-black text-surface-900">
                      ₹{Number(q.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-4 px-6 text-center text-xs font-semibold text-surface-650">
                      {q.delivery_days} Days
                    </td>
                    <td className="py-4 px-6 text-xs text-surface-550">
                      {q.submitted_at ? new Date(q.submitted_at).toLocaleDateString() : 'Draft'}
                    </td>
                    <td className="py-4 px-6">{getStatusBadge(q.status)}</td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => navigate(`/quotations/${q.id}`)}
                        className="p-1.5 text-brand-600 hover:bg-brand-50 rounded-xl inline-flex items-center gap-1.5 transition-all text-xs font-bold"
                      >
                        <span>Details</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
export default QuotationList;
