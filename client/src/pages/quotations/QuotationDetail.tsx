import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import {
  ArrowLeft,
  FileText,
  Calendar,
  User,
  CheckCircle,
  XCircle,
  IndianRupee,
  Clock,
  TrendingUp,
  ShieldCheck,
  FileCheck
} from 'lucide-react';
import toast from 'react-hot-toast';

export const QuotationDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isOfficerOrAdmin = user?.role === 'Officer' || user?.role === 'Admin';
  const isManager = user?.role === 'Manager';

  const [quote, setQuote] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const fetchQuoteDetails = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/quotations/${id}`);
      if (res.data.success) {
        setQuote(res.data.quotation);
      }
    } catch (err) {
      toast.error('Failed to load quotation details');
      navigate('/rfqs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuoteDetails();
  }, [id]);

  const handleStatusUpdate = async (newStatus: 'Selected' | 'Rejected') => {
    setUpdating(true);
    try {
      const res = await api.put(`/quotations/${id}`, { status: newStatus });
      if (res.data.success) {
        toast.success(`Quotation ${newStatus.toLowerCase()} successfully`);
        
        // If selected, we can prompt redirecting to create approval workflow in Phase 8
        if (newStatus === 'Selected') {
          // Redirecting to approvals page or trigger approval request
          toast.success('You can now request approval from management.');
        }
        fetchQuoteDetails();
      }
    } catch (err) {
      toast.error('Failed to update quotation status');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (s: string) => {
    switch (s) {
      case 'Draft':
        return <span className="badge-draft px-2.5 py-1 text-xs">Draft</span>;
      case 'Submitted':
        return <span className="badge-brand px-2.5 py-1 text-xs">Submitted</span>;
      case 'Selected':
        return <span className="badge-active bg-emerald-50 text-emerald-700 border-emerald-250 px-2.5 py-1 text-xs">Selected</span>;
      case 'Rejected':
        return <span className="badge-danger px-2.5 py-1 text-xs">Rejected</span>;
      default:
        return <span className="badge-draft px-2.5 py-1 text-xs">{s}</span>;
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-8 w-48 skeleton" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 skeleton" />
          <div className="h-96 skeleton" />
        </div>
      </div>
    );
  }

  return (
    <div className="page-container space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 border border-surface-200 hover:bg-surface-50 rounded-xl transition-all"
          >
            <ArrowLeft className="w-5 h-5 text-surface-600" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-brand-700 px-2 py-0.5 bg-brand-50 border border-brand-100 rounded">
                Quote Proposal
              </span>
              {getStatusBadge(quote.status)}
            </div>
            <h1 className="page-title mt-1.5">{quote.vendorName} Proposal</h1>
          </div>
        </div>

        {/* Action controls for Officer/Admin */}
        {(isOfficerOrAdmin || isManager) && quote.status === 'Submitted' && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleStatusUpdate('Rejected')}
              disabled={updating}
              className="btn btn-secondary py-2.5 px-4 text-danger-600 border-danger-200 hover:bg-danger-50 flex items-center gap-1.5"
            >
              <XCircle className="w-4 h-4" />
              <span>Reject Bid</span>
            </button>
            <button
              onClick={() => handleStatusUpdate('Selected')}
              disabled={updating}
              className="btn btn-primary py-2.5 px-5 flex items-center gap-1.5"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Select & Approve</span>
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Line items breakdown */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6 bg-white border border-surface-200 space-y-4">
            <h3 className="text-sm font-bold text-surface-900 border-b border-surface-100 pb-2.5">
              Financial Breakdown
            </h3>

            <div className="overflow-x-auto border border-surface-150 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-50 border-b border-surface-150 font-bold text-surface-500 uppercase">
                  <tr>
                    <th className="py-2.5 px-4">Requested Item Name</th>
                    <th className="py-2.5 px-4 text-right">Qty</th>
                    <th className="py-2.5 px-4 text-right">Quoted Price (INR)</th>
                    <th className="py-2.5 px-4 text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100 text-sm">
                  {quote.lineItems?.map((item: any, idx: number) => (
                    <tr key={item.id || idx} className="hover:bg-surface-50/40">
                      <td className="py-3 px-4 font-semibold text-surface-850">{item.itemName}</td>
                      <td className="py-3 px-4 text-right font-semibold text-surface-900">{item.qty}</td>
                      <td className="py-3 px-4 text-right font-semibold text-surface-700">
                        ₹{item.unitPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-surface-850">
                        ₹{item.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Total */}
            <div className="p-4 bg-surface-50 border border-surface-200 rounded-xl flex items-center justify-between">
              <span className="text-xs font-bold text-surface-600 uppercase tracking-wider">Total Quoted Bid</span>
              <span className="text-lg font-black text-brand-900">
                ₹{quote.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Guidelines notes */}
          {quote.notes && (
            <div className="card p-6 bg-white border border-surface-200 space-y-3">
              <h3 className="text-sm font-bold text-surface-900 border-b border-surface-100 pb-2">
                Supplier Comments & Terms
              </h3>
              <p className="text-xs text-surface-650 leading-relaxed whitespace-pre-wrap">
                {quote.notes}
              </p>
            </div>
          )}
        </div>

        {/* Right: RFQ connection & parameters */}
        <div className="space-y-6">
          {/* RFQ Meta Link */}
          <div className="card p-6 bg-white border border-surface-200 space-y-4">
            <h3 className="text-sm font-bold text-surface-900 border-b border-surface-100 pb-2">
              Associated Procurement RFQ
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <span className="block text-[10px] font-bold text-surface-400 uppercase">RFQ ID Reference</span>
                <Link
                  to={`/rfqs/${quote.rfqId}`}
                  className="font-mono font-bold text-brand-650 hover:underline flex items-center gap-1 mt-0.5"
                >
                  <span>{quote.rfqRef}</span>
                </Link>
              </div>

              <div>
                <span className="block text-[10px] font-bold text-surface-400 uppercase">RFQ Subject / Requirement</span>
                <span className="font-semibold text-surface-800">{quote.rfqTitle}</span>
              </div>
            </div>
          </div>

          {/* Fulfillment Parameters */}
          <div className="card p-6 bg-white border border-surface-200 space-y-4">
            <h3 className="text-sm font-bold text-surface-900 border-b border-surface-100 pb-2">
              Supplier Response Parameters
            </h3>

            <div className="grid grid-cols-1 gap-3 text-xs">
              <div className="flex items-center justify-between p-2.5 bg-surface-50 rounded-xl border border-surface-100">
                <div className="flex items-center gap-2 text-surface-600">
                  <Clock className="w-4 h-4 text-surface-400" />
                  <span>Target Fulfillment Timeline</span>
                </div>
                <strong className="text-surface-850 font-bold">{quote.deliveryDays} Days</strong>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-surface-50 rounded-xl border border-surface-100">
                <div className="flex items-center gap-2 text-surface-600">
                  <Calendar className="w-4 h-4 text-surface-400" />
                  <span>Submission Date</span>
                </div>
                <strong className="text-surface-850">
                  {quote.submittedAt ? new Date(quote.submittedAt).toLocaleDateString() : 'N/A'}
                </strong>
              </div>
            </div>
          </div>

          {/* Workflow approval trigger */}
          {quote.status === 'Selected' && isOfficerOrAdmin && (
            <div className="card p-6 bg-emerald-50/50 border border-emerald-200 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <span>Selected for Approval</span>
              </div>
              <p className="text-[11px] text-emerald-700 leading-relaxed">
                This quotation has been shortlisted. You should now initiate the Manager Approval request workflow.
              </p>
              <Link
                to={`/approvals/new?quotationId=${quote.id}`}
                className="w-full btn btn-primary bg-emerald-600 hover:bg-emerald-700 text-xs font-bold py-2 flex items-center justify-center gap-1.5"
              >
                <FileCheck className="w-4.5 h-4.5" />
                <span>Request Manager Approval</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default QuotationDetail;
