import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import { Search, Eye, Filter, ArrowRight, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

export const InvoiceList: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('/invoices', { params });
      if (res.data.success) {
        setInvoices(res.data.invoices);
      }
    } catch (err) {
      toast.error('Failed to load invoice settlements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [statusFilter]);

  const getStatusBadge = (s: string) => {
    switch (s) {
      case 'Draft':
        return <span className="badge-draft px-2.5 py-0.5 text-xs">Draft</span>;
      case 'Sent':
        return <span className="badge-brand px-2.5 py-0.5 text-xs">Sent</span>;
      case 'Paid':
        return <span className="badge-active bg-emerald-50 text-emerald-700 border-emerald-250 px-2.5 py-0.5 text-xs">Paid</span>;
      case 'Overdue':
        return <span className="badge-danger px-2.5 py-0.5 text-xs">Overdue</span>;
      default:
        return <span className="badge-draft px-2.5 py-0.5 text-xs">{s}</span>;
    }
  };

  const filteredInvoices = invoices.filter((inv: any) => {
    const term = searchTerm.toLowerCase();
    const invNo = (inv.invoice_number || '').toLowerCase();
    const poRef = (inv.po_ref || '').toLowerCase();
    const vendorName = (inv.vendor_name || '').toLowerCase();
    return invNo.includes(term) || poRef.includes(term) || vendorName.includes(term);
  });

  return (
    <div className="page-container space-y-6">
      {/* Title */}
      <div>
        <h1 className="page-title">Invoice Settlements</h1>
        <p className="text-sm text-surface-500 mt-1">
          {user?.role === 'Vendor'
            ? 'Monitor payment settlement logs and billing invoices'
            : 'Authorize invoice clearances and process vendor settlements'}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
          <input
            type="text"
            placeholder="Search invoice number, PO reference, or supplier..."
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
              <option value="Sent">Sent</option>
              <option value="Paid">Paid</option>
              <option value="Overdue">Overdue</option>
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
      ) : filteredInvoices.length === 0 ? (
        <div className="text-center py-16 card border border-surface-200 bg-white space-y-3">
          <div className="mx-auto w-12 h-12 rounded-full bg-surface-50 flex items-center justify-center text-surface-400">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-surface-900 text-sm">No invoices found</h3>
            <p className="text-xs text-surface-450 mt-1">
              There are no matching billing invoice records.
            </p>
          </div>
        </div>
      ) : (
        <div className="card bg-white border border-surface-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-50 border-b border-surface-200 font-bold text-surface-500 uppercase">
                <tr>
                  <th className="py-3.5 px-6">Invoice Number</th>
                  <th className="py-3.5 px-6">PO Reference</th>
                  <th className="py-3.5 px-6">Billed Vendor</th>
                  <th className="py-3.5 px-6 text-right">Grand Total (INR)</th>
                  <th className="py-3.5 px-6">Due Date</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100 text-sm">
                {filteredInvoices.map((inv: any) => (
                  <tr key={inv.id} className="hover:bg-surface-50/45 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-mono text-xs font-bold text-brand-650">{inv.invoice_number}</div>
                      <div className="text-[10px] text-surface-450 font-mono mt-0.5">{inv.id}</div>
                    </td>
                    <td className="py-4 px-6 font-mono text-xs text-surface-650">
                      {inv.po_ref}
                    </td>
                    <td className="py-4 px-6 font-semibold text-surface-850">
                      {inv.vendor_name}
                    </td>
                    <td className="py-4 px-6 text-right font-black text-surface-900">
                      ₹{inv.grand_total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-4 px-6 text-xs text-surface-550">
                      {inv.due_date ? new Date(inv.due_date).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="py-4 px-6">{getStatusBadge(inv.status)}</td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => navigate(`/invoices/${inv.id}`)}
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
export default InvoiceList;
