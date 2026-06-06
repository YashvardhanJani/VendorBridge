import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import { ArrowLeft, Save, FileText, Calendar, IndianRupee, Send, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

interface FormLineItem {
  itemName: string;
  qty: number;
  unitPrice: number;
}

export const QuotationForm: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const rfqId = searchParams.get('rfqId');

  const { user } = useAuthStore();

  const [rfq, setRfq] = useState<any>(null);
  const [loadingRfq, setLoadingRfq] = useState(true);

  const [deliveryDays, setDeliveryDays] = useState<number>(7);
  const [notes, setNotes] = useState('');
  const [lineItems, setLineItems] = useState<FormLineItem[]>([]);
  const [saving, setSaving] = useState(false);

  // Load RFQ details
  useEffect(() => {
    if (!rfqId) {
      toast.error('No RFQ specified for quotation submission');
      navigate('/rfqs');
      return;
    }

    const fetchRfq = async () => {
      try {
        const response = await api.get(`/rfqs/${rfqId}`);
        if (response.data.success) {
          const r = response.data.rfq;
          setRfq(r);
          
          // Auto-populate line items from RFQ items
          const items = (r.items || []).map((item: any) => ({
            itemName: item.name,
            qty: item.qty,
            unitPrice: 0 // vendor must specify
          }));
          setLineItems(items);

          // Check if user is a vendor and has an existing quotation to edit/overwrite
          try {
            const existingQuoteRes = await api.get('/quotations', { params: { rfqId } });
            if (existingQuoteRes.data.success && existingQuoteRes.data.quotations.length > 0) {
              const q = existingQuoteRes.data.quotations[0];
              // Load full details
              const qDetailsRes = await api.get(`/quotations/${q.id}`);
              if (qDetailsRes.data.success) {
                const qd = qDetailsRes.data.quotation;
                setDeliveryDays(qd.deliveryDays);
                setNotes(qd.notes);
                
                // Align existing prices
                const existingItems = qd.lineItems || [];
                const merged = items.map((defaultItem: any) => {
                  const match = existingItems.find((ei: any) => ei.itemName === defaultItem.itemName);
                  return {
                    ...defaultItem,
                    unitPrice: match ? match.unitPrice : 0
                  };
                });
                setLineItems(merged);
              }
            }
          } catch (e) {
            console.error('Error fetching existing quotation', e);
          }
        }
      } catch (err: any) {
        toast.error('Failed to load RFQ specifications');
        navigate('/rfqs');
      } finally {
        setLoadingRfq(false);
      }
    };
    fetchRfq();
  }, [rfqId, navigate]);

  const handlePriceChange = (index: number, val: number) => {
    const updated = [...lineItems];
    updated[index].unitPrice = Math.max(0, val);
    setLineItems(updated);
  };

  const calculateGrandTotal = () => {
    return lineItems.reduce((acc, item) => acc + (item.qty * item.unitPrice), 0);
  };

  const isExpired = () => {
    return rfq && new Date(rfq.deadline) < new Date();
  };

  const handleSubmit = async (e: React.FormEvent, status: 'Draft' | 'Submitted') => {
    e.preventDefault();

    if (isExpired()) {
      return toast.error('Quotation submission blocked: RFQ deadline has passed');
    }

    if (deliveryDays <= 0) {
      return toast.error('Please enter a valid number of delivery days');
    }

    // Verify all prices are entered
    const missingPrice = lineItems.some(item => item.unitPrice <= 0);
    if (missingPrice && status === 'Submitted') {
      if (!window.confirm('Some line items have a quoted price of 0. Are you sure you want to submit?')) {
        return;
      }
    }

    setSaving(true);
    try {
      const payload = {
        rfqId,
        deliveryDays,
        notes,
        status,
        lineItems
      };

      const response = await api.post('/quotations', payload);
      if (response.data.success) {
        toast.success(status === 'Submitted' ? 'Quotation submitted successfully!' : 'Quotation draft saved.');
        navigate(`/rfqs/${rfqId}`);
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.error || 'Failed to submit proposal';
      toast.error(errMsg);
    } finally {
      setSaving(false);
    }
  };

  if (loadingRfq) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-8 w-48 skeleton" />
        <div className="h-96 skeleton" />
      </div>
    );
  }

  return (
    <div className="page-container space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 border border-surface-200 hover:bg-surface-50 rounded-xl transition-all"
        >
          <ArrowLeft className="w-5 h-5 text-surface-600" />
        </button>
        <div>
          <h1 className="page-title">Submit Bid Quotation</h1>
          <p className="text-sm text-surface-500 mt-1">
            Quote unit prices for requirements in RFQ:{' '}
            <span className="font-mono font-bold text-brand-650">{rfq.ref_number}</span> ({rfq.title})
          </p>
        </div>
      </div>

      {isExpired() && (
        <div className="p-4 bg-danger-50 border border-danger-200 rounded-xl flex items-center gap-2 text-danger-700 text-sm font-semibold">
          <Clock className="w-5 h-5 shrink-0" />
          <span>The bidding window has closed for this RFQ. Submission is disabled.</span>
        </div>
      )}

      <form onSubmit={(e) => handleSubmit(e, 'Submitted')} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Line Items Pricing */}
        <div className="card p-6 bg-white border border-surface-200 lg:col-span-2 space-y-6">
          <div>
            <h3 className="text-base font-bold text-surface-900 border-b border-surface-100 pb-3">
              Quotation Line Pricing
            </h3>
            <p className="text-xs text-surface-450 mt-1">
              Provide your competitive unit price for each requested item.
            </p>
          </div>

          <div className="overflow-x-auto border border-surface-150 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-50 border-b border-surface-150 font-bold text-surface-500 uppercase">
                <tr>
                  <th className="py-3 px-4">Item details & specs</th>
                  <th className="py-3 px-4">Qty</th>
                  <th className="py-3 px-4 w-36">Unit Price (INR)</th>
                  <th className="py-3 px-4 text-right">Row Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100 text-sm">
                {lineItems.map((item, idx) => {
                  const rfqMatch = rfq.items?.find((ri: any) => ri.name === item.itemName);
                  return (
                    <tr key={idx} className="hover:bg-surface-50/40">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-surface-850">{item.itemName}</div>
                        {rfqMatch?.description && (
                          <div className="text-[10px] text-surface-450 mt-0.5">{rfqMatch.description}</div>
                        )}
                        {rfqMatch?.spec_notes && (
                          <div className="text-[9px] text-brand-600 bg-brand-50/55 px-1 py-0.5 rounded mt-1 inline-block">
                            Compliance: {rfqMatch.spec_notes}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-surface-900">{item.qty}</td>
                      <td className="py-3.5 px-4">
                        <div className="relative">
                          <IndianRupee className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-surface-400" />
                          <input
                            type="number"
                            min={0}
                            step="any"
                            value={item.unitPrice || ''}
                            onChange={(e) => handlePriceChange(idx, parseFloat(e.target.value) || 0)}
                            placeholder="0.00"
                            disabled={isExpired() || saving}
                            className="input-field py-1.5 pl-7 text-xs font-semibold"
                            required
                          />
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-surface-850">
                        ₹{(item.qty * item.unitPrice).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Grand summary */}
          <div className="p-4 bg-brand-50/30 border border-brand-100/60 rounded-xl flex items-center justify-between">
            <span className="text-xs font-bold text-brand-800 uppercase tracking-wider">Estimated Quotation Subtotal</span>
            <span className="text-lg font-black text-brand-900">
              ₹{calculateGrandTotal().toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Sidebar inputs */}
        <div className="space-y-6">
          {/* Delivery & Cover details */}
          <div className="card p-6 bg-white border border-surface-200 space-y-4">
            <h3 className="text-sm font-bold text-surface-900 border-b border-surface-100 pb-2.5">
              Fulfillment Parameters
            </h3>

            <div>
              <label className="block text-xs font-bold text-surface-600 uppercase mb-1.5">
                Expected Delivery (Days)
              </label>
              <input
                type="number"
                min={1}
                value={deliveryDays}
                onChange={(e) => setDeliveryDays(parseInt(e.target.value) || 1)}
                className="input-field font-semibold"
                disabled={isExpired() || saving}
                required
              />
              <p className="text-[10px] text-surface-400 mt-1">
                Enter target delivery timeframe in business calendar days.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-surface-600 uppercase mb-1.5">
                Additional Comments / Cover Note
              </label>
              <textarea
                placeholder="Include shipping terms, special warranties, or generic comments..."
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="input-field text-xs"
                disabled={isExpired() || saving}
              />
            </div>
          </div>

          {/* Submission panel */}
          <div className="card p-6 bg-white border border-surface-200 space-y-3">
            <h4 className="text-xs font-bold text-surface-450 uppercase tracking-wider">
              Bid Submission Controls
            </h4>
            <div className="space-y-2">
              <button
                type="button"
                onClick={(e) => handleSubmit(e, 'Draft')}
                disabled={isExpired() || saving}
                className="w-full btn btn-secondary py-2.5 text-xs font-bold bg-white"
              >
                Save Draft Proposal
              </button>
              <button
                type="submit"
                disabled={isExpired() || saving}
                className="w-full btn btn-primary py-2.5 text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <Send className="w-4 h-4" />
                <span>{saving ? 'Submitting...' : 'Submit Final Bid'}</span>
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
export default QuotationForm;
