import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import { RFQ_STATUSES } from '../../utils/constants';
import {
  FileText,
  Search,
  Plus,
  Calendar,
  Layers,
  ChevronRight,
  Clock,
  ExternalLink,
  ChevronLeft,
  Filter
} from 'lucide-react';
import toast from 'react-hot-toast';

export const RFQList: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isOfficerOrAdmin = user?.role === 'Officer' || user?.role === 'Admin';

  const [rfqs, setRfqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const fetchRfqs = async () => {
    setLoading(true);
    try {
      const response = await api.get('/rfqs', {
        params: { search, status, page, limit: 8 },
      });
      if (response.data.success) {
        setRfqs(response.data.rfqs);
        setTotalPages(response.data.pagination.pages);
        setTotalItems(response.data.pagination.total);
      }
    } catch (err: any) {
      toast.error('Failed to load RFQs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRfqs();
  }, [page, status]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchRfqs();
  };

  const handleResetFilters = () => {
    setSearch('');
    setStatus('');
    setPage(1);
    setTimeout(fetchRfqs, 0);
  };

  const getStatusBadgeClass = (s: string) => {
    switch (s) {
      case 'Draft':
        return 'badge-draft';
      case 'Published':
      case 'Awaiting Quotes':
        return 'badge-brand';
      case 'Quotes Received':
      case 'Under Review':
        return 'badge-active';
      case 'Approved':
      case 'PO Generated':
        return 'badge-active bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Rejected':
      case 'Closed':
        return 'badge-danger';
      default:
        return 'badge-draft';
    }
  };

  const isExpired = (deadlineStr: string) => {
    return new Date(deadlineStr) < new Date();
  };

  return (
    <div className="page-container space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Requests for Quotations (RFQs)</h1>
          <p className="text-sm text-surface-500 mt-1">
            {user?.role === 'Vendor'
              ? 'View assigned RFQ invitations and submit quotation bids'
              : 'Create, publish, and manage procurement requests for quotes'}
          </p>
        </div>

        {isOfficerOrAdmin && (
          <button
            onClick={() => navigate('/rfqs/new')}
            className="btn btn-primary py-2 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Create RFQ</span>
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="card p-4 bg-white border border-surface-200">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
            <input
              type="text"
              placeholder="Search by title or ref number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-10"
            />
          </div>

          <div className="flex flex-wrap gap-3 w-full md:w-auto items-center">
            {/* Status Filter */}
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="input-field max-w-[180px] py-2.5 text-sm"
            >
              <option value="">All Statuses</option>
              {RFQ_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <button
              type="submit"
              className="btn btn-secondary py-2 px-4 text-sm font-semibold"
            >
              Filter
            </button>

            {(search || status) && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs font-semibold text-brand-600 hover:underline px-2"
              >
                Clear
              </button>
            )}
          </div>
        </form>
      </div>

      {/* RFQ Grid or List Table */}
      <div className="card overflow-hidden bg-white border border-surface-200 shadow-sm">
        {loading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 skeleton rounded-lg" />
            ))}
          </div>
        ) : rfqs.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-16 h-16 bg-surface-50 text-surface-300 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-surface-900 mb-1">No RFQs found</h3>
            <p className="text-sm text-surface-500 max-w-sm mx-auto mb-6">
              No requests for quotation profiles match your current search terms.
            </p>
            {isOfficerOrAdmin && (
              <button
                onClick={() => navigate('/rfqs/new')}
                className="btn btn-primary py-2 px-5"
              >
                Create your first RFQ
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-50 border-b border-surface-150 text-xs font-bold text-surface-500 uppercase tracking-wider">
                  <th className="py-4 px-6">Reference No</th>
                  <th className="py-4 px-6">RFQ Title</th>
                  <th className="py-4 px-6">Bidding Deadline</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100 text-sm">
                {rfqs.map((rfq) => (
                  <tr key={rfq.id} className="hover:bg-surface-50/40 transition-colors">
                    <td className="py-4 px-6 font-mono text-xs font-bold text-brand-700">
                      {rfq.ref_number}
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-semibold text-surface-900">{rfq.title}</div>
                      <div className="text-xs text-surface-500 truncate max-w-xs">{rfq.description}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1.5 text-surface-700">
                        <Calendar className="w-4 h-4 text-surface-400" />
                        <span className={`text-xs font-medium ${isExpired(rfq.deadline) && rfq.status !== 'Closed' ? 'text-danger-600 font-bold' : ''}`}>
                          {new Date(rfq.deadline).toLocaleDateString()}
                        </span>
                        {isExpired(rfq.deadline) && rfq.status !== 'Closed' && (
                          <span className="text-[10px] bg-danger-50 text-danger-600 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                            Lapsed
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={getStatusBadgeClass(rfq.status)}>{rfq.status}</span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => navigate(`/rfqs/${rfq.id}`)}
                          className="p-1.5 text-surface-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold"
                        >
                          <span>Open Workspace</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && totalItems > 0 && (
          <div className="p-4 border-t border-surface-150 bg-surface-50/50 flex items-center justify-between">
            <span className="text-xs text-surface-500 font-medium">
              Showing <span className="text-surface-800 font-semibold">{(page - 1) * 8 + 1}</span> to{' '}
              <span className="text-surface-800 font-semibold">
                {Math.min(page * 8, totalItems)}
              </span>{' '}
              of <span className="text-surface-800 font-semibold">{totalItems}</span> RFQs
            </span>
            <div className="flex gap-1.5">
              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="p-1.5 border border-surface-250 bg-white rounded-lg text-surface-600 hover:bg-surface-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3.5 py-1.5 bg-white border border-surface-250 text-xs font-semibold text-surface-700 rounded-lg">
                {page} / {totalPages}
              </span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
                className="p-1.5 border border-surface-250 bg-white rounded-lg text-surface-600 hover:bg-surface-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default RFQList;
