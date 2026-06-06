import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import {
  ArrowLeft,
  Calendar,
  User,
  CheckCircle,
  XCircle,
  IndianRupee,
  Clock,
  ShieldAlert,
  ShieldCheck,
  Award,
  ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';

export const ApprovalDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isManagerOrAdmin = user?.role === 'Manager' || user?.role === 'Admin';

  const [approval, setApproval] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [remarks, setRemarks] = useState('');

  const fetchApprovalDetails = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/approvals/${id}`);
      if (res.data.success) {
        setApproval(res.data.approval);
      }
    } catch (err) {
      toast.error('Failed to load approval details');
      navigate('/approvals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovalDetails();
  }, [id]);

  const handleDecision = async (status: 'Approved' | 'Rejected') => {
    if (status === 'Rejected' && (!remarks || !remarks.trim())) {
      return toast.error('Remarks are mandatory when rejecting a proposal.');
    }

    setSubmitting(true);
    try {
      const res = await api.put(`/approvals/${id}/review`, { status, remarks });
      if (res.data.success) {
        toast.success(`Approval request updated to ${status}`);
        setRemarks('');
        fetchApprovalDetails();
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.error || 'Failed to update approval request';
      toast.error(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkUnderReview = async () => {
    setSubmitting(true);
    try {
      const res = await api.put(`/approvals/${id}/review`, { status: 'Under Review', remarks: 'Manager opened review session' });
      if (res.data.success) {
        toast.success('Approval request set to Under Review');
        fetchApprovalDetails();
      }
    } catch (err) {
      toast.error('Failed to update status');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (s: string) => {
    switch (s) {
      case 'Pending':
        return <span className="badge-draft px-2.5 py-1 text-xs">Pending</span>;
      case 'Under Review':
        return <span className="badge-brand px-2.5 py-1 text-xs">Under Review</span>;
      case 'Approved':
        return <span className="badge-active bg-emerald-50 text-emerald-700 border-emerald-250 px-2.5 py-1 text-xs">Approved</span>;
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

  const isFinalized = approval.status === 'Approved' || approval.status === 'Rejected';

  return (
    <div className="page-container space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/approvals')}
          className="p-2 border border-surface-200 hover:bg-surface-50 rounded-xl transition-all"
        >
          <ArrowLeft className="w-5 h-5 text-surface-600" />
        </button>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-brand-700 px-2 py-0.5 bg-brand-50 border border-brand-100 rounded">
              Procurement Request
            </span>
            {getStatusBadge(approval.status)}
          </div>
          <h1 className="page-title mt-1.5">{approval.rfq?.title}</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Side-by-side comparison */}
        <div className="lg:col-span-2 space-y-6">
          {/* Comparison table */}
          <div className="card p-6 bg-white border border-surface-200 space-y-4">
            <h3 className="text-sm font-bold text-surface-900 border-b border-surface-100 pb-2.5">
              Requirements vs Bid Comparison
            </h3>

            <div className="overflow-x-auto border border-surface-150 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-50 border-b border-surface-150 font-bold text-surface-500 uppercase">
                  <tr>
                    <th className="py-2.5 px-4">Requirement Details</th>
                    <th className="py-2.5 px-4 text-center">Req Qty</th>
                    <th className="py-2.5 px-4 text-right">Quoted Price (INR)</th>
                    <th className="py-2.5 px-4 text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100 text-sm">
                  {approval.quotation?.lineItems?.map((item: any, idx: number) => {
                    const rfqItem = approval.rfq?.items?.find((ri: any) => ri.name === item.itemName);
                    return (
                      <tr key={item.id || idx} className="hover:bg-surface-50/40">
                        <td className="py-3 px-4">
                          <p className="font-semibold text-surface-850">{item.itemName}</p>
                          {rfqItem?.description && (
                            <p className="text-[10px] text-surface-450 mt-0.5">{rfqItem.description}</p>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center font-semibold text-surface-900">{item.qty}</td>
                        <td className="py-3 px-4 text-right font-semibold text-surface-700">
                          ₹{item.unitPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-surface-850">
                          ₹{item.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Total */}
            <div className="p-4 bg-surface-50 border border-surface-200 rounded-xl flex items-center justify-between">
              <span className="text-xs font-bold text-surface-600 uppercase tracking-wider">Total Proposed Cost</span>
              <span className="text-lg font-black text-brand-900">
                ₹{approval.quotation?.totalAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Audit Timeline */}
          <div className="card p-6 bg-white border border-surface-200 space-y-4">
            <h3 className="text-sm font-bold text-surface-900 border-b border-surface-100 pb-2.5">
              Approval Audit Trail
            </h3>

            <div className="space-y-5">
              {approval.timeline?.map((log: any, idx: number) => (
                <div key={log.id || idx} className="flex gap-3 text-xs">
                  <div className="w-2.5 h-2.5 rounded-full bg-brand-500 mt-1.5 shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <strong className="text-surface-800">{log.status}</strong>
                      <span className="text-[10px] text-surface-400">
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-surface-500 mt-0.5">{log.note}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Vendor profile & Decision card */}
        <div className="space-y-6">
          {/* Vendor Details */}
          <div className="card p-6 bg-white border border-surface-200 space-y-4">
            <h3 className="text-sm font-bold text-surface-900 border-b border-surface-100 pb-2">
              Supplier Scorecard
            </h3>

            <div className="space-y-3.5 text-xs">
              <div>
                <span className="block text-[10px] font-bold text-surface-400 uppercase">Vendor Name</span>
                <span className="font-bold text-surface-800 mt-0.5 block">{approval.vendor?.company_name}</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="block text-[10px] font-bold text-surface-400 uppercase">Category</span>
                  <span className="font-semibold text-surface-700">{approval.vendor?.category}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-surface-400 uppercase">Rating Score</span>
                  <span className="font-bold text-brand-700 flex items-center gap-0.5">
                    <Award className="w-3.5 h-3.5" />
                    <span>{approval.vendor?.rating || 'N/A'} / 5.0</span>
                  </span>
                </div>
              </div>

              <div>
                <span className="block text-[10px] font-bold text-surface-400 uppercase">GSTIN Number</span>
                <span className="font-mono text-surface-650">{approval.vendor?.gst}</span>
              </div>
            </div>
          </div>

          {/* Decision panel */}
          {isManagerOrAdmin && !isFinalized && (
            <div className="card p-6 bg-white border border-surface-200 space-y-4">
              <h3 className="text-sm font-bold text-surface-900 border-b border-surface-100 pb-2">
                Authorization Decisions
              </h3>

              {approval.status === 'Pending' && (
                <button
                  onClick={handleMarkUnderReview}
                  disabled={submitting}
                  className="w-full btn btn-secondary py-2 text-xs font-bold bg-white"
                >
                  Mark as Under Review
                </button>
              )}

              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-[10px] font-bold text-surface-500 uppercase mb-1">
                    Review Remarks / Justification
                  </label>
                  <textarea
                    placeholder="Enter review notes, compliance matching details, or rejection reasons..."
                    rows={3}
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    className="input-field text-xs"
                    disabled={submitting}
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleDecision('Rejected')}
                    disabled={submitting}
                    className="flex-1 btn btn-secondary text-danger-600 border-danger-200 hover:bg-danger-50 text-xs py-2 font-bold flex items-center justify-center gap-1"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Reject</span>
                  </button>

                  <button
                    onClick={() => handleDecision('Approved')}
                    disabled={submitting}
                    className="flex-1 btn btn-primary text-xs py-2 font-bold flex items-center justify-center gap-1"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Approve PO</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Finalized Decision State card */}
          {isFinalized && (
            <div className={`card p-6 border rounded-xl space-y-3 ${approval.status === 'Approved' ? 'bg-emerald-50/50 border-emerald-200' : 'bg-danger-50/50 border-danger-200'}`}>
              <div className="flex items-center gap-2 font-bold text-sm">
                {approval.status === 'Approved' ? (
                  <>
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    <span className="text-emerald-800">Proposal Approved</span>
                  </>
                ) : (
                  <>
                    <ShieldAlert className="w-5 h-5 text-danger-600" />
                    <span className="text-danger-800">Proposal Rejected</span>
                  </>
                )}
              </div>
              <p className="text-[11px] text-surface-600 leading-relaxed">
                Reviewed by: <strong>{approval.decidedByName || 'Management'}</strong>
              </p>
              {approval.remarks && (
                <p className="text-xs text-surface-650 bg-white/60 p-2.5 rounded-lg border border-surface-100 italic">
                  "{approval.remarks}"
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default ApprovalDetail;
