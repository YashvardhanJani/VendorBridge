import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import { Search, Eye, Filter, ArrowRight, Clock, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export const ApprovalList: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [approvals, setApprovals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter terms
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchApprovals = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('/approvals', { params });
      if (res.data.success) {
        setApprovals(res.data.approvals);
      }
    } catch (err) {
      toast.error('Failed to load approval workflows');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, [statusFilter]);

  const getStatusBadge = (s: string) => {
    switch (s) {
      case 'Pending':
        return <span className="badge-draft px-2.5 py-0.5 text-xs">Pending</span>;
      case 'Under Review':
        return <span className="badge-brand px-2.5 py-0.5 text-xs">Under Review</span>;
      case 'Approved':
        return <span className="badge-active bg-emerald-50 text-emerald-700 border-emerald-250 px-2.5 py-0.5 text-xs">Approved</span>;
      case 'Rejected':
        return <span className="badge-danger px-2.5 py-0.5 text-xs">Rejected</span>;
      default:
        return <span className="badge-draft px-2.5 py-0.5 text-xs">{s}</span>;
    }
  };

  const filteredApprovals = approvals.filter((a: any) => {
    const term = searchTerm.toLowerCase();
    const rfqRef = (a.rfq_ref || '').toLowerCase();
    const rfqTitle = (a.rfq_title || '').toLowerCase();
    const requester = (a.requester_name || '').toLowerCase();
    const vendor = (a.vendor_name || '').toLowerCase();
    return rfqRef.includes(term) || rfqTitle.includes(term) || requester.includes(term) || vendor.includes(term);
  });

  return (
    <div className="page-container space-y-6">
      {/* Title */}
      <div>
        <h1 className="page-title">Approval Workflows</h1>
        <p className="text-sm text-surface-500 mt-1">
          {user?.role === 'Manager'
            ? 'Review and authorize pending procurement requests'
            : 'Track review status of your submitted supplier recommendations'}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
          <input
            type="text"
            placeholder="Search RFQ Ref, project, supplier, or requester..."
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
              <option value="Pending">Pending</option>
              <option value="Under Review">Under Review</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid Table */}
      {loading ? (
        <div className="space-y-3">
          <div className="h-10 skeleton rounded-xl" />
          <div className="h-40 skeleton rounded-xl" />
        </div>
      ) : filteredApprovals.length === 0 ? (
        <div className="text-center py-16 card border border-surface-200 bg-white space-y-3">
          <div className="mx-auto w-12 h-12 rounded-full bg-surface-50 flex items-center justify-center text-surface-400">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-surface-900 text-sm">No approvals found</h3>
            <p className="text-xs text-surface-450 mt-1">
              There are no pending workflows matching your query parameters.
            </p>
          </div>
        </div>
      ) : (
        <div className="card bg-white border border-surface-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-50 border-b border-surface-200 font-bold text-surface-500 uppercase">
                <tr>
                  <th className="py-3.5 px-6">Requirement RFQ</th>
                  <th className="py-3.5 px-6">Selected Vendor</th>
                  <th className="py-3.5 px-6 text-right">Quoted Amt (INR)</th>
                  <th className="py-3.5 px-6">Requester</th>
                  <th className="py-3.5 px-6">Initiated Date</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100 text-sm">
                {filteredApprovals.map((a: any) => (
                  <tr key={a.id} className="hover:bg-surface-50/45 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-mono text-xs font-bold text-brand-650">{a.rfq_ref}</div>
                      <div className="text-[11px] text-surface-500 max-w-[200px] truncate mt-0.5">
                        {a.rfq_title}
                      </div>
                    </td>
                    <td className="py-4 px-6 font-semibold text-surface-850">
                      {a.vendor_name}
                    </td>
                    <td className="py-4 px-6 text-right font-black text-surface-900">
                      ₹{a.quotation_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-4 px-6 text-xs text-surface-600">
                      {a.requester_name}
                    </td>
                    <td className="py-4 px-6 text-xs text-surface-550">
                      {new Date(a.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-6">{getStatusBadge(a.status)}</td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => navigate(`/approvals/${a.id}`)}
                        className="p-1.5 text-brand-600 hover:bg-brand-50 rounded-xl inline-flex items-center gap-1.5 transition-all text-xs font-bold"
                      >
                        <span>Review</span>
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
export default ApprovalList;
