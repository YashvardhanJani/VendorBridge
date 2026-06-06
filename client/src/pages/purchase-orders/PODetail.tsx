import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import {
  ArrowLeft,
  Printer,
  Truck,
  CheckCircle,
  FileCheck,
  Building,
  Calendar,
  FileText,
  Eye
} from 'lucide-react';
import toast from 'react-hot-toast';



export const PODetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isVendor = user?.role === 'Vendor';
  const isOfficerOrAdmin = user?.role === 'Officer' || user?.role === 'Admin';

  const [po, setPo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [linkedInvoice, setLinkedInvoice] = useState<any>(null);

  const fetchPODetails = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/purchase-orders/${id}`);
      if (res.data.success) {
        setPo(res.data.purchaseOrder);
      }

      // Check for linked invoice
      const invRes = await api.get('/invoices');
      if (invRes.data.success) {
        const matched = invRes.data.invoices.find((i: any) => i.po_id === id);
        setLinkedInvoice(matched || null);
      }
    } catch (err) {
      toast.error('Failed to load purchase order details');
      navigate('/purchase-orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPODetails();
  }, [id]);

  const handleStatusUpdate = async (newStatus: 'Received' | 'Closed') => {
    setUpdating(true);
    try {
      const res = await api.put(`/purchase-orders/${id}/status`, { status: newStatus });
      if (res.data.success) {
        toast.success(`Purchase order marked as ${newStatus.toLowerCase()}`);
        fetchPODetails();
      }
    } catch (err) {
      toast.error('Failed to update purchase order status');
    } finally {
      setUpdating(false);
    }
  };

  const handleGenerateInvoice = async () => {
    setUpdating(true);
    try {
      const res = await api.post('/invoices', { poId: id });
      if (res.data.success) {
        toast.success('Invoice generated successfully!');
        navigate(`/invoices/${res.data.invoice.id}`);
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.error || 'Failed to generate invoice';
      toast.error(errMsg);
    } finally {
      setUpdating(false);
    }
  };

  const calculateSubtotal = () => {
    if (!po?.items) return 0;
    return po.items.reduce((acc: number, item: any) => {
      const subtotal = item.unitPrice * item.qty;
      return acc + subtotal;
    }, 0);
  };

  const getStatusBadge = (s: string) => {
    switch (s) {
      case 'Issued':
        return <span className="badge-brand px-2.5 py-1 text-xs">Issued</span>;
      case 'Received':
        return <span className="badge-active bg-emerald-50 text-emerald-700 border-emerald-250 px-2.5 py-1 text-xs">Received</span>;
      case 'Closed':
        return <span className="badge-draft px-2.5 py-1 text-xs">Closed</span>;
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
      {/* CSS print override styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .printable-po-doc, .printable-po-doc * {
            visibility: visible;
          }
          .printable-po-doc {
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
            onClick={() => navigate('/purchase-orders')}
            className="p-2 border border-surface-200 hover:bg-surface-50 rounded-xl transition-all"
          >
            <ArrowLeft className="w-5 h-5 text-surface-600" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-brand-700 px-2 py-0.5 bg-brand-50 border border-brand-100 rounded">
                Procurement PO
              </span>
              {getStatusBadge(po.status)}
            </div>
            <h1 className="page-title mt-1.5">{po.poNumber}</h1>
          </div>
        </div>

        {/* Action Triggers */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => window.print()}
            className="btn btn-secondary py-2.5 px-4 bg-white flex items-center gap-1.5 text-xs font-bold"
          >
            <Printer className="w-4 h-4" />
            <span>Print PO Document</span>
          </button>

          {isVendor && po.status === 'Issued' && (
            <button
              onClick={() => handleStatusUpdate('Received')}
              disabled={updating}
              className="btn btn-primary py-2.5 px-4 flex items-center gap-1.5 text-xs font-bold"
            >
              <Truck className="w-4 h-4" />
              <span>Mark as Delivered</span>
            </button>
          )}

          {isOfficerOrAdmin && po.status === 'Issued' && (
            <button
              onClick={() => handleStatusUpdate('Received')}
              disabled={updating}
              className="btn btn-primary py-2.5 px-4 flex items-center gap-1.5 text-xs font-bold"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Confirm Goods Receipt (GRN)</span>
            </button>
          )}

          {isOfficerOrAdmin && po.status === 'Received' && (
            <button
              onClick={() => handleStatusUpdate('Closed')}
              disabled={updating}
              className="btn btn-primary py-2.5 px-4 bg-slate-800 hover:bg-slate-900 flex items-center gap-1.5 text-xs font-bold border-none"
            >
              <FileCheck className="w-4 h-4" />
              <span>Close Purchase Order</span>
            </button>
          )}
          {isVendor && (po.status === 'Received' || po.status === 'Closed') && !linkedInvoice && (
            <button
              onClick={handleGenerateInvoice}
              disabled={updating}
              className="btn btn-primary py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 border-none flex items-center gap-1.5 text-xs font-bold"
            >
              <FileText className="w-4 h-4" />
              <span>Generate Invoice</span>
            </button>
          )}

          {linkedInvoice && (
            <button
              onClick={() => navigate(`/invoices/${linkedInvoice.id}`)}
              className="btn btn-secondary py-2.5 px-4 bg-white flex items-center gap-1.5 text-xs font-bold"
            >
              <Eye className="w-4 h-4 text-brand-650" />
              <span>View Linked Invoice</span>
            </button>
          )}
        </div>
      </div>

      {/* Printable PO Document Card */}
      <div className="card p-8 bg-white border border-surface-200 shadow-sm printable-po-doc space-y-8 max-w-4xl mx-auto">
        
        {/* Brand header */}
        <div className="flex justify-between items-start border-b border-surface-150 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center font-black text-white text-base">
                VB
              </div>
              <span className="text-lg font-black tracking-wider text-surface-900">VENDORBRIDGE</span>
            </div>
            <p className="text-[10px] text-surface-450 uppercase tracking-widest font-bold">
              Global Procurement Network
            </p>
          </div>

          <div className="text-right space-y-1">
            <h2 className="text-base font-black text-surface-850">PURCHASE ORDER</h2>
            <p className="text-xs font-mono font-bold text-brand-650">{po.poNumber}</p>
            <div className="flex items-center gap-1 text-[10px] text-surface-400 justify-end pt-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>Date: {new Date(po.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Addresses Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          {/* Vendor Details */}
          <div className="card p-4 bg-surface-50 border border-surface-150 rounded-xl space-y-2.5">
            <div className="flex items-center gap-1.5 text-surface-450 uppercase font-bold tracking-wider text-[10px]">
              <Building className="w-3.5 h-3.5" />
              <span>Supplier Billing Details</span>
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-sm text-surface-850">{po.vendorName}</h4>
              <p className="text-surface-550">{po.vendorAddress}</p>
              <p className="text-surface-550">Phone: {po.vendorPhone}</p>
              <p className="text-brand-650 font-bold font-mono text-[10px] pt-1">GSTIN: {po.vendorGst}</p>
            </div>
          </div>

          {/* Delivery Details */}
          <div className="card p-4 bg-surface-50 border border-surface-150 rounded-xl space-y-2.5">
            <div className="flex items-center gap-1.5 text-surface-450 uppercase font-bold tracking-wider text-[10px]">
              <Truck className="w-3.5 h-3.5" />
              <span>Delivery Ship-To</span>
            </div>
            <div className="space-y-1 text-surface-550">
              <h4 className="font-bold text-sm text-surface-850">VendorBridge Warehousing</h4>
              <p>{po.deliveryAddress || 'Main Warehouse Block, Corporate HQ'}</p>
              <p className="pt-2 text-[10px] text-surface-450 font-semibold italic">
                Terms: {po.terms || 'Net 30 Payment Terms apply.'}
              </p>
            </div>
          </div>
        </div>

        {/* PO Items Table */}
        <div className="border border-surface-150 rounded-xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-50 border-b border-surface-150 font-bold text-surface-500 uppercase">
              <tr>
                <th className="py-3 px-4">Item Name / Specification</th>
                <th className="py-3 px-4 text-center">Qty</th>
                <th className="py-3 px-4 text-right">Unit Price</th>
                <th className="py-3 px-4 text-center">GST%</th>
                <th className="py-3 px-4 text-right">Total (Inc. Tax)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100 text-sm">
              {po.items?.map((item: any, idx: number) => {
                const subtotal = item.unitPrice * item.qty;
                const gstAmt = subtotal * (item.gst / 100);
                return (
                  <tr key={item.id || idx} className="hover:bg-surface-50/20">
                    <td className="py-3 px-4 font-semibold text-surface-850">{item.name}</td>
                    <td className="py-3 px-4 text-center font-semibold text-surface-900">{item.qty}</td>
                    <td className="py-3 px-4 text-right font-semibold text-surface-700">
                      ₹{item.unitPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-center font-semibold text-surface-650">{item.gst}%</td>
                    <td className="py-3 px-4 text-right font-bold text-surface-850">
                      ₹{(subtotal + gstAmt).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Financial Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 text-xs">
          <div className="text-surface-400 space-y-1.5 leading-relaxed self-end">
            <p className="font-bold uppercase tracking-wider text-[9px]">Important Note:</p>
            <p className="text-[10px]">
              This is a system-generated Purchase Order issued under authorization rules. For queries, contact billing@vendorbridge.com.
            </p>
          </div>

          <div className="space-y-2.5">
            <div className="flex justify-between text-xs text-surface-500">
              <span>Subtotal (Before Tax)</span>
              <strong className="text-surface-750">
                ₹{calculateSubtotal().toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </strong>
            </div>

            <div className="grid grid-cols-3 gap-2 text-[10px] text-surface-450 border-t border-b border-surface-100 py-2">
              <div>
                <span className="block">CGST (9% split)</span>
                <strong className="text-surface-700">₹{Number(po.taxBreakdown?.cgst || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
              </div>
              <div>
                <span className="block">SGST (9% split)</span>
                <strong className="text-surface-700">₹{Number(po.taxBreakdown?.sgst || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
              </div>
              <div>
                <span className="block">IGST (18% rate)</span>
                <strong className="text-surface-700">₹{Number(po.taxBreakdown?.igst || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
              </div>
            </div>

            <div className="flex justify-between items-center bg-brand-50/30 border border-brand-100 p-3 rounded-xl">
              <span className="text-xs font-bold text-brand-800 uppercase tracking-wider">Grand Total (INR)</span>
              <span className="text-base font-black text-brand-900">
                ₹{po.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
export default PODetail;
