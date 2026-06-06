import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import {
  ArrowLeft,
  Printer,
  CheckCircle,
  Building,
  Calendar,
  CreditCard,
  FileCheck,
  FileText
} from 'lucide-react';
import toast from 'react-hot-toast';

export const InvoiceDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isOfficerOrAdmin = user?.role === 'Officer' || user?.role === 'Admin';

  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const fetchInvoiceDetails = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/invoices/${id}`);
      if (res.data.success) {
        setInvoice(res.data.invoice);
      }
    } catch (err) {
      toast.error('Failed to load invoice details');
      navigate('/invoices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoiceDetails();
  }, [id]);

  const handleStatusUpdate = async (newStatus: 'Paid') => {
    setUpdating(true);
    try {
      const res = await api.put(`/invoices/${id}/status`, { status: newStatus });
      if (res.data.success) {
        toast.success(`Invoice marked as paid`);
        fetchInvoiceDetails();
      }
    } catch (err) {
      toast.error('Failed to update invoice status');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (s: string) => {
    switch (s) {
      case 'Draft':
        return <span className="badge-draft px-2.5 py-1 text-xs">Draft</span>;
      case 'Sent':
        return <span className="badge-brand px-2.5 py-1 text-xs">Sent</span>;
      case 'Paid':
        return <span className="badge-active bg-emerald-50 text-emerald-700 border-emerald-250 px-2.5 py-1 text-xs">Paid</span>;
      case 'Overdue':
        return <span className="badge-danger px-2.5 py-1 text-xs">Overdue</span>;
      default:
        return <span className="badge-draft px-2.5 py-1 text-xs">{s}</span>;
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
    <div className="page-container space-y-6">
      {/* CSS print overrides */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .printable-inv-doc, .printable-inv-doc * {
            visibility: visible;
          }
          .printable-inv-doc {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .print-hide {
            display: none !important;
          }
        }
      `}</style>

      {/* Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print-hide">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/invoices')}
            className="p-2 border border-surface-200 hover:bg-surface-50 rounded-xl transition-all"
          >
            <ArrowLeft className="w-5 h-5 text-surface-600" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-brand-700 px-2 py-0.5 bg-brand-50 border border-brand-100 rounded">
                Procurement Invoice
              </span>
              {getStatusBadge(invoice.status)}
            </div>
            <h1 className="page-title mt-1.5">{invoice.invoiceNumber}</h1>
          </div>
        </div>

        {/* Action Triggers */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => window.print()}
            className="btn btn-secondary py-2.5 px-4 bg-white flex items-center gap-1.5 text-xs font-bold"
          >
            <Printer className="w-4 h-4" />
            <span>Print Invoice Document</span>
          </button>

          {isOfficerOrAdmin && invoice.status === 'Sent' && (
            <button
              onClick={() => handleStatusUpdate('Paid')}
              disabled={updating}
              className="btn btn-primary py-2.5 px-4 flex items-center gap-1.5 text-xs font-bold"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Record Payment Clearance</span>
            </button>
          )}
        </div>
      </div>

      {/* Printable Invoice Card */}
      <div className="card p-8 bg-white border border-surface-200 shadow-sm printable-inv-doc space-y-8 max-w-4xl mx-auto">
        
        {/* Brand header */}
        <div className="flex justify-between items-start border-b border-surface-150 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-brand-650 flex items-center justify-center font-black text-white text-base">
                VB
              </div>
              <span className="text-lg font-black tracking-wider text-surface-900">VENDORBRIDGE</span>
            </div>
            <p className="text-[10px] text-surface-450 uppercase tracking-widest font-bold">
              Global Procurement Network
            </p>
          </div>

          <div className="text-right space-y-1">
            <h2 className="text-base font-black text-surface-850">TAX INVOICE</h2>
            <p className="text-xs font-mono font-bold text-brand-650">{invoice.invoiceNumber}</p>
            <div className="flex flex-col gap-0.5 text-[9px] text-surface-400 items-end pt-1">
              <span>Date: {new Date(invoice.created_at).toLocaleDateString()}</span>
              {invoice.dueDate && (
                <span className="font-semibold text-danger-650">
                  Due: {new Date(invoice.dueDate).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Addresses & PO link info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
          {/* Billed By (Supplier) */}
          <div className="card p-4 bg-surface-50 border border-surface-150 rounded-xl space-y-2">
            <div className="flex items-center gap-1.5 text-surface-450 uppercase font-bold tracking-wider text-[9px]">
              <Building className="w-3.5 h-3.5" />
              <span>Billed By (Vendor)</span>
            </div>
            <div className="space-y-0.5">
              <h4 className="font-bold text-surface-800">{invoice.vendorName}</h4>
              <p className="text-brand-650 font-bold font-mono text-[9px]">GSTIN: {invoice.vendorGst}</p>
              <p className="text-surface-500">Contact: {invoice.vendorContactEmail}</p>
            </div>
          </div>

          {/* PO References */}
          <div className="card p-4 bg-surface-50 border border-surface-150 rounded-xl space-y-2">
            <div className="flex items-center gap-1.5 text-surface-450 uppercase font-bold tracking-wider text-[9px]">
              <FileText className="w-3.5 h-3.5" />
              <span>Reference Link</span>
            </div>
            <div className="space-y-1">
              <div>
                <span className="block text-[9px] text-surface-400 font-bold uppercase">Purchase Order</span>
                <Link
                  to={`/purchase-orders/${invoice.poId}`}
                  className="font-mono font-bold text-brand-650 hover:underline print-hide"
                >
                  {invoice.poRef}
                </Link>
                <span className="font-mono font-bold text-brand-650 hidden print:inline">{invoice.poRef}</span>
              </div>
              <div>
                <span className="block text-[9px] text-surface-400 font-bold uppercase">Payment Terms</span>
                <span className="font-semibold text-surface-700">{invoice.paymentTerms || 'Net 30'}</span>
              </div>
            </div>
          </div>

          {/* Settlement Account */}
          <div className="card p-4 bg-surface-50 border border-surface-150 rounded-xl space-y-2">
            <div className="flex items-center gap-1.5 text-surface-450 uppercase font-bold tracking-wider text-[9px]">
              <CreditCard className="w-3.5 h-3.5" />
              <span>Settlement Account Details</span>
            </div>
            {invoice.bankDetails ? (
              <div className="space-y-0.5 text-surface-550">
                <p>Bank: <strong className="text-surface-750">{invoice.bankDetails.bankName}</strong></p>
                <p className="font-mono">A/C: {invoice.bankDetails.accountNo}</p>
                <p className="font-mono">IFSC: {invoice.bankDetails.ifsc}</p>
                <p>Branch: {invoice.bankDetails.branch}</p>
              </div>
            ) : (
              <p className="text-surface-450 italic">No bank details recorded.</p>
            )}
          </div>
        </div>

        {/* Invoice items */}
        <div className="border border-surface-150 rounded-xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-50 border-b border-surface-150 font-bold text-surface-500 uppercase">
              <tr>
                <th className="py-3 px-4">Billed Item Name</th>
                <th className="py-3 px-4 text-center">Quantity</th>
                <th className="py-3 px-4 text-right">Unit Rate</th>
                <th className="py-3 px-4 text-center">GST Rate</th>
                <th className="py-3 px-4 text-right">Total amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100 text-sm">
              {invoice.lineItems?.map((item: any, idx: number) => {
                const subtotal = item.unitPrice * item.qty;
                const tax = subtotal * (item.gst / 100);
                return (
                  <tr key={item.id || idx} className="hover:bg-surface-50/20">
                    <td className="py-3 px-4 font-semibold text-surface-850">{item.name}</td>
                    <td className="py-3 px-4 text-center font-semibold text-surface-900">{item.qty}</td>
                    <td className="py-3 px-4 text-right font-semibold text-surface-700">
                      ₹{item.unitPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-center font-semibold text-surface-650">{item.gst}%</td>
                    <td className="py-3 px-4 text-right font-bold text-surface-850">
                      ₹{(subtotal + tax).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 text-xs">
          <div className="text-surface-400 space-y-1.5 leading-relaxed self-end">
            <p className="font-bold uppercase tracking-wider text-[9px]">Declaration:</p>
            <p className="text-[10px]">
              We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.
            </p>
          </div>

          <div className="space-y-2.5">
            <div className="flex justify-between text-xs text-surface-500">
              <span>Subtotal (Before Tax)</span>
              <strong className="text-surface-750">
                ₹{invoice.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </strong>
            </div>

            <div className="grid grid-cols-3 gap-2 text-[10px] text-surface-450 border-t border-b border-surface-100 py-2">
              <div>
                <span className="block">CGST (9%)</span>
                <strong className="text-surface-700">₹{Number(invoice.taxBreakdown?.cgst || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
              </div>
              <div>
                <span className="block">SGST (9%)</span>
                <strong className="text-surface-700">₹{Number(invoice.taxBreakdown?.sgst || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
              </div>
              <div>
                <span className="block">Total Taxes</span>
                <strong className="text-surface-700">₹{Number(invoice.taxBreakdown?.totalTax || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
              </div>
            </div>

            <div className="flex justify-between items-center bg-brand-50/30 border border-brand-100 p-3 rounded-xl">
              <span className="text-xs font-bold text-brand-800 uppercase tracking-wider">Grand Total (INR)</span>
              <span className="text-base font-black text-brand-900">
                ₹{invoice.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
export default InvoiceDetail;
