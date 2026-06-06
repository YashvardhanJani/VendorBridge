import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import { Search, Eye, Filter, ArrowRight, Download, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

export const POList: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [pos, setPos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter terms
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchPurchaseOrders = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('/purchase-orders', { params });
      if (res.data.success) {
        setPos(res.data.purchaseOrders);
      }
    } catch (err) {
      toast.error('Failed to load purchase orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchaseOrders();
  }, [statusFilter]);

  const getStatusBadge = (s: string) => {
    switch (s) {
      case 'Issued':
        return <span className="badge-brand px-2.5 py-0.5 text-xs">Issued</span>;
      case 'Received':
        return <span className="badge-active bg-emerald-50 text-emerald-700 border-emerald-250 px-2.5 py-0.5 text-xs">Received</span>;
      case 'Closed':
        return <span className="badge-draft px-2.5 py-0.5 text-xs">Closed</span>;
      default:
        return <span className="badge-draft px-2.5 py-0.5 text-xs">{s}</span>;
    }
  };

  const filteredPOs = pos.filter((po: any) => {
    const term = searchTerm.toLowerCase();
    const poNumber = (po.po_number || '').toLowerCase();
    const rfqRef = (po.rfq_ref || '').toLowerCase();
    const rfqTitle = (po.rfq_title || '').toLowerCase();
    const vendorName = (po.vendor_name || '').toLowerCase();
    return poNumber.includes(term) || rfqRef.includes(term) || rfqTitle.includes(term) || vendorName.includes(term);
  });

  const handleExportCSV = () => {
    if (filteredPOs.length === 0) return toast.error('No records available for export');

    const headers = ['PO Number', 'RFQ Ref', 'Vendor Name', 'Grand Total (INR)', 'Status', 'Date Issued'];
    const rows = filteredPOs.map(po => [
      po.po_number,
      po.rfq_ref,
      po.vendor_name,
      po.grand_total,
      po.status,
      new Date(po.created_at).toLocaleDateString()
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.map(val => `"${val}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `PurchaseOrders_Export_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Purchase Orders exported as CSV');
  };

  return (
    <div className="page-container space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Purchase Orders</h1>
          <p className="text-sm text-surface-500 mt-1">
            {user?.role === 'Vendor'
              ? 'View and manage purchase orders issued to your organization'
              : 'Track active, received, and closed corporate purchase orders'}
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="btn btn-secondary py-2 px-4 text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto bg-white"
        >
          <Download className="w-4 h-4" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
          <input
            type="text"
            placeholder="Search PO number, supplier, or RFQ reference..."
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
              <option value="Issued">Issued</option>
              <option value="Received">Received</option>
              <option value="Closed">Closed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid List */}
      {loading ? (
        <div className="space-y-3">
          <div className="h-10 skeleton rounded-xl" />
          <div className="h-40 skeleton rounded-xl" />
        </div>
      ) : filteredPOs.length === 0 ? (
        <div className="text-center py-16 card border border-surface-200 bg-white space-y-3">
          <div className="mx-auto w-12 h-12 rounded-full bg-surface-50 flex items-center justify-center text-surface-400">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-surface-900 text-sm">No purchase orders found</h3>
            <p className="text-xs text-surface-450 mt-1">
              There are no matching purchase order records.
            </p>
          </div>
        </div>
      ) : (
        <div className="card bg-white border border-surface-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-50 border-b border-surface-200 font-bold text-surface-500 uppercase">
                <tr>
                  <th className="py-3.5 px-6">PO Number</th>
                  <th className="py-3.5 px-6">Associated RFQ</th>
                  <th className="py-3.5 px-6">Issued Vendor</th>
                  <th className="py-3.5 px-6 text-right">Grand Total (INR)</th>
                  <th className="py-3.5 px-6">Date Issued</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100 text-sm">
                {filteredPOs.map((po: any) => (
                  <tr key={po.id} className="hover:bg-surface-50/45 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-mono text-xs font-bold text-brand-650">{po.po_number}</div>
                      <div className="text-[10px] text-surface-450 font-mono mt-0.5">{po.id}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-mono text-xs text-surface-650">{po.rfq_ref}</div>
                      <div className="text-[11px] text-surface-500 max-w-[200px] truncate mt-0.5">
                        {po.rfq_title}
                      </div>
                    </td>
                    <td className="py-4 px-6 font-semibold text-surface-850">
                      {po.vendor_name}
                    </td>
                    <td className="py-4 px-6 text-right font-black text-surface-900">
                      ₹{po.grand_total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-4 px-6 text-xs text-surface-550">
                      {new Date(po.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-6">{getStatusBadge(po.status)}</td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => navigate(`/purchase-orders/${po.id}`)}
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
export default POList;
