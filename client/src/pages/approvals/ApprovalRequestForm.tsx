import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import { ArrowLeft, Send, CheckSquare, ShieldCheck, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

export const ApprovalRequestForm: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const quotationId = searchParams.get('quotationId');

  const [quote, setQuote] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!quotationId) {
      toast.error('No quotation selected for approval request');
      navigate('/quotations');
      return;
    }

    const fetchQuote = async () => {
      try {
        const res = await api.get(`/quotations/${quotationId}`);
        if (res.data.success) {
          setQuote(res.data.quotation);
        }
      } catch (err) {
        toast.error('Failed to load quotation details');
        navigate('/quotations');
      } finally {
        setLoading(false);
      }
    };
    fetchQuote();
  }, [quotationId, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await api.post('/approvals', { quotationId });
      if (res.data.success) {
        toast.success('Approval request initiated successfully!');
        navigate(`/approvals/${res.data.approval.id}`);
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.error || 'Failed to request approval';
      toast.error(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-8 w-48 skeleton" />
        <div className="h-96 skeleton" />
      </div>
    );
  }

  return (
    <div className="page-container space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 border border-surface-200 hover:bg-surface-50 rounded-xl transition-all"
        >
          <ArrowLeft className="w-5 h-5 text-surface-600" />
        </button>
        <div>
          <h1 className="page-title font-black text-surface-900">Request Manager Approval</h1>
          <p className="text-sm text-surface-500 mt-1">
            Initiate formal procurement review for the selected supplier proposal.
          </p>
        </div>
      </div>

      <div className="card p-6 bg-white border border-surface-200 space-y-5">
        <div className="flex items-center gap-2 text-brand-700 font-bold text-sm">
          <ShieldCheck className="w-5 h-5" />
          <span>Confirm Selection Details</span>
        </div>

        <div className="divide-y divide-surface-100 text-xs space-y-3.5">
          <div className="pt-3 flex justify-between">
            <span className="text-surface-450 uppercase font-bold">Selected Supplier</span>
            <span className="font-bold text-surface-850 text-right">{quote.vendorName}</span>
          </div>

          <div className="pt-3 flex justify-between">
            <span className="text-surface-450 uppercase font-bold">Associated RFQ</span>
            <span className="font-bold text-surface-850 text-right">
              {quote.rfqRef} - {quote.rfqTitle}
            </span>
          </div>

          <div className="pt-3 flex justify-between">
            <span className="text-surface-450 uppercase font-bold">Total Quoted Amount</span>
            <span className="font-black text-brand-900 text-sm">
              ₹{quote.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="pt-3 flex justify-between">
            <span className="text-surface-450 uppercase font-bold">Delivery Timeframe</span>
            <span className="font-semibold text-surface-800">{quote.deliveryDays} Business Days</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="pt-4">
          <button
            type="submit"
            disabled={submitting}
            className="w-full btn btn-primary py-2.5 font-bold flex items-center justify-center gap-2"
          >
            <Send className="w-4.5 h-4.5" />
            <span>{submitting ? 'Initiating Workflow...' : 'Submit to Management'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
export default ApprovalRequestForm;
