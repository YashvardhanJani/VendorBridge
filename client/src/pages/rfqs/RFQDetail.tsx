import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import {
  ArrowLeft,
  FileText,
  Calendar,
  Users,
  Paperclip,
  Clock,
  Plus,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  FileCheck,
  Send
} from 'lucide-react';
import toast from 'react-hot-toast';

export const RFQDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isOfficerOrAdmin = user?.role === 'Officer' || user?.role === 'Admin';

  const [rfq, setRfq] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Invite vendors section states
  const [activeVendors, setActiveVendors] = useState<any[]>([]);
  const [loadingVendors, setLoadingVendors] = useState(false);
  const [selectedNewVendors, setSelectedNewVendors] = useState<string[]>([]);
  const [inviting, setInviting] = useState(false);

  // Vendor bid check
  const [hasBid, setHasBid] = useState(false);
  const [bidId, setBidId] = useState<string | null>(null);

  const fetchRfqDetails = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/rfqs/${id}`);
      if (response.data.success) {
        setRfq(response.data.rfq);
        
        // If logged in user is a vendor, check if they have submitted a quotation
        if (user?.role === 'Vendor') {
          try {
            const quoteRes = await api.get('/quotations', { params: { rfqId: id } });
            if (quoteRes.data.success && quoteRes.data.quotations.length > 0) {
              setHasBid(true);
              setBidId(quoteRes.data.quotations[0].id);
            }
          } catch (e) {
            // Quotations endpoint might not be ready yet
          }
        }
      }
    } catch (err: any) {
      toast.error('Failed to load RFQ details');
      navigate('/rfqs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRfqDetails();
  }, [id, user]);

  // Load remaining active vendors for invite checklist
  useEffect(() => {
    if (isOfficerOrAdmin && rfq) {
      const fetchAvailableVendors = async () => {
        setLoadingVendors(true);
        try {
          const res = await api.get('/vendors', { params: { export: true, status: 'Active' } });
          if (res.data.success) {
            const currentlyAssigned = rfq.assignedVendors || [];
            const unassigned = res.data.vendors.filter(
              (v: any) => !currentlyAssigned.includes(v.id)
            );
            setActiveVendors(unassigned);
          }
        } catch (err) {
          console.error(err);
        } finally {
          setLoadingVendors(false);
        }
      };
      fetchAvailableVendors();
    }
  }, [rfq, isOfficerOrAdmin]);

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedNewVendors.length === 0) {
      toast.error('Please select at least one vendor');
      return;
    }

    setInviting(true);
    try {
      const res = await api.post(`/rfqs/${id}/invite`, { vendorIds: selectedNewVendors });
      if (res.data.success) {
        toast.success('Suppliers invited successfully!');
        setSelectedNewVendors([]);
        fetchRfqDetails();
      }
    } catch (err) {
      toast.error('Failed to invite suppliers');
    } finally {
      setInviting(false);
    }
  };

  const handleStatusTransition = async (newStatus: string) => {
    try {
      const res = await api.put(`/rfqs/${id}`, { status: newStatus });
      if (res.data.success) {
        toast.success(`RFQ status updated to ${newStatus}`);
        fetchRfqDetails();
      }
    } catch (err) {
      toast.error('Failed to update RFQ status');
    }
  };

  const handleNewVendorToggle = (vendorId: string) => {
    if (selectedNewVendors.includes(vendorId)) {
      setSelectedNewVendors(selectedNewVendors.filter(vid => vid !== vendorId));
    } else {
      setSelectedNewVendors([...selectedNewVendors, vendorId]);
    }
  };

  const isExpired = () => {
    return rfq && new Date(rfq.deadline) < new Date();
  };

  const getStatusBadge = (s: string) => {
    switch (s) {
      case 'Draft':
        return <span className="badge-draft px-2.5 py-1 text-xs">Draft</span>;
      case 'Published':
      case 'Awaiting Quotes':
        return <span className="badge-brand px-2.5 py-1 text-xs">{s}</span>;
      case 'Quotes Received':
      case 'Under Review':
        return <span className="badge-active px-2.5 py-1 text-xs">{s}</span>;
      case 'Approved':
      case 'PO Generated':
        return <span className="badge-active bg-emerald-50 text-emerald-700 border-emerald-250 px-2.5 py-1 text-xs">{s}</span>;
      case 'Closed':
      case 'Rejected':
        return <span className="badge-danger px-2.5 py-1 text-xs">{s}</span>;
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
            onClick={() => navigate('/rfqs')}
            className="p-2 border border-surface-200 hover:bg-surface-50 rounded-xl transition-all"
          >
            <ArrowLeft className="w-5 h-5 text-surface-600" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-brand-700 px-2 py-0.5 bg-brand-50 border border-brand-100 rounded">
                {rfq.ref_number}
              </span>
              {getStatusBadge(rfq.status)}
            </div>
            <h1 className="page-title mt-1.5">{rfq.title}</h1>
          </div>
        </div>

        <div className="flex gap-2">
          {isOfficerOrAdmin && rfq.status === 'Draft' && (
            <button
              onClick={() => handleStatusTransition('Published')}
              className="btn btn-primary py-2.5 px-5 flex items-center gap-1.5"
            >
              <Send className="w-4 h-4" />
              <span>Publish RFQ</span>
            </button>
          )}

          {isOfficerOrAdmin && rfq.status === 'Published' && (
            <button
              onClick={() => handleStatusTransition('Closed')}
              className="btn btn-secondary py-2.5 px-5 text-danger-600 border-danger-200 hover:bg-danger-50"
            >
              Close Bidding
            </button>
          )}

          {isOfficerOrAdmin && (
            <button
              onClick={() => navigate(`/rfqs/${rfq.id}/edit`)}
              className="btn btn-secondary py-2.5 px-4"
            >
              Edit RFQ
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Guidelines & Line Items */}
        <div className="lg:col-span-2 space-y-6">
          {/* Details */}
          <div className="card p-6 bg-white border border-surface-200 space-y-5">
            <div>
              <h3 className="text-sm font-bold text-surface-900 border-b border-surface-100 pb-2.5">
                RFQ Description
              </h3>
              <p className="text-sm text-surface-600 mt-3 whitespace-pre-wrap">
                {rfq.description || 'No detailed instructions provided.'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-surface-100 text-xs">
              <div className="flex items-center gap-2 text-surface-650">
                <Calendar className="w-4 h-4 text-surface-400" />
                <span>
                  Bidding Deadline:{' '}
                  <strong className={`${isExpired() && rfq.status !== 'Closed' ? 'text-danger-600' : 'text-surface-800'}`}>
                    {new Date(rfq.deadline).toLocaleDateString()}
                  </strong>
                </span>
              </div>

              <div className="flex items-center gap-2 text-surface-650">
                <Clock className="w-4 h-4 text-surface-400" />
                <span>Created Date: {new Date(rfq.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Requested Items */}
          <div className="card p-6 bg-white border border-surface-200 space-y-4">
            <h3 className="text-sm font-bold text-surface-900 border-b border-surface-100 pb-2.5">
              Requested Items List ({rfq.items?.length || 0})
            </h3>

            <div className="overflow-x-auto border border-surface-150 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-50 border-b border-surface-150 font-bold text-surface-500 uppercase">
                  <tr>
                    <th className="py-2.5 px-4">Item Details</th>
                    <th className="py-2.5 px-4">Required Qty</th>
                    <th className="py-2.5 px-4">Unit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100">
                  {rfq.items?.map((item: any, idx: number) => (
                    <tr key={item.id || idx} className="hover:bg-surface-50/40">
                      <td className="py-3 px-4">
                        <p className="font-semibold text-surface-850">{item.name}</p>
                        <p className="text-[10px] text-surface-500 mt-0.5">{item.description}</p>
                        {item.spec_notes && (
                          <p className="text-[9px] text-brand-600 bg-brand-50/50 px-1.5 py-0.5 rounded mt-1.5 inline-block">
                            Compliance Specs: {item.spec_notes}
                          </p>
                        )}
                      </td>
                      <td className="py-3 px-4 font-semibold text-surface-900">{item.qty}</td>
                      <td className="py-3 px-4 text-surface-600">{item.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Activity Logs history */}
          {isOfficerOrAdmin && rfq.activityLog && (
            <div className="card p-6 bg-white border border-surface-200 space-y-4">
              <h3 className="text-sm font-bold text-surface-900 border-b border-surface-100 pb-2.5">
                Audit Trail & Activity Log
              </h3>
              <div className="space-y-4">
                {rfq.activityLog.map((log: any, idx: number) => (
                  <div key={log.id || idx} className="flex gap-3 text-xs">
                    <div className="w-2 h-2 rounded-full bg-brand-500 mt-1.5 shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <strong className="text-surface-800">{log.action}</strong>
                        <span className="text-[10px] text-surface-400">
                          {new Date(log.at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-surface-500 mt-0.5">{log.note}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Attachments, Bids & Supplier Invites */}
        <div className="space-y-6">
          {/* Vendor Bid Action */}
          {user?.role === 'Vendor' && (
            <div className="card p-6 bg-white border border-surface-200 space-y-4 text-center">
              <h4 className="text-xs font-bold text-surface-450 uppercase tracking-wider">
                Quotation Submission
              </h4>
              {hasBid ? (
                <div className="space-y-3">
                  <div className="mx-auto w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 border border-emerald-100">
                    <FileCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h5 className="font-bold text-surface-900 text-sm">Quotation Submitted</h5>
                    <p className="text-[11px] text-surface-450 mt-1">
                      You have already submitted a quotation bid for this request.
                    </p>
                  </div>
                  <Link
                    to={`/quotations/${bidId}`}
                    className="w-full btn btn-secondary py-2 text-xs font-semibold flex items-center justify-center gap-1.5 bg-white"
                  >
                    <span>View Submission</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              ) : isExpired() ? (
                <div className="space-y-2">
                  <div className="mx-auto w-10 h-10 bg-danger-50 text-danger-600 rounded-full flex items-center justify-center">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <p className="text-xs text-danger-600 font-bold">Bidding Closed</p>
                  <p className="text-[10px] text-surface-450">
                    The bidding deadline has lapsed for this request. No new proposals can be submitted.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-surface-500">
                    Review specifications and submit your corporate quotation bid proposal before the deadline.
                  </p>
                  <button
                    onClick={() => navigate(`/quotations/new?rfqId=${rfq.id}`)}
                    className="w-full btn btn-primary py-2.5 text-xs font-bold flex items-center justify-center gap-1.5"
                  >
                    <span>Submit Bid Proposal</span>
                    <TrendingUp className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Attachments */}
          <div className="card p-6 bg-white border border-surface-200 space-y-4">
            <h3 className="text-sm font-bold text-surface-900 border-b border-surface-100 pb-2.5 flex items-center gap-2">
              <Paperclip className="w-4.5 h-4.5 text-brand-600" />
              <span>Attachments ({rfq.attachments?.length || 0})</span>
            </h3>

            {(!rfq.attachments || rfq.attachments.length === 0) ? (
              <div className="text-center py-6 text-xs text-surface-450 border border-dashed border-surface-200 rounded-xl">
                No supplementary files
              </div>
            ) : (
              <div className="space-y-2.5">
                {rfq.attachments.map((file: any, idx: number) => (
                  <a
                    key={file.id || idx}
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 bg-surface-50 hover:bg-brand-50 border border-surface-150 hover:border-brand-200 rounded-xl flex items-center justify-between text-xs transition-all group"
                  >
                    <span className="font-semibold text-surface-700 truncate group-hover:text-brand-900">
                      {file.name}
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 text-surface-400 group-hover:text-brand-600 shrink-0" />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Invitee List & Inviter (Officers/Admins) */}
          {isOfficerOrAdmin && (
            <>
              {/* Assigned suppliers info */}
              <div className="card p-6 bg-white border border-surface-200 space-y-3">
                <h3 className="text-sm font-bold text-surface-900 border-b border-surface-100 pb-2 flex items-center gap-2">
                  <Users className="w-4.5 h-4.5 text-brand-600" />
                  <span>Assigned Suppliers ({rfq.assignedVendors?.length || 0})</span>
                </h3>

                {(!rfq.assignedVendors || rfq.assignedVendors.length === 0) ? (
                  <div className="text-xs text-surface-450 py-2">
                    No suppliers invited yet. Use the panel below to invite active vendors.
                  </div>
                ) : (
                  <div className="text-xs text-surface-550 space-y-1">
                    <p className="text-[10px] text-surface-400 font-bold uppercase tracking-wider mb-2">
                      Supplier ID List
                    </p>
                    {rfq.assignedVendors.map((vid: string) => (
                      <div key={vid} className="font-mono text-[10px] p-1 bg-surface-50 border border-surface-100 rounded truncate">
                        {vid}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add more invitees panel */}
              {rfq.status !== 'Closed' && activeVendors.length > 0 && (
                <div className="card p-6 bg-white border border-surface-200 space-y-4">
                  <h3 className="text-sm font-bold text-surface-900 border-b border-surface-100 pb-2">
                    Invite More Vendors
                  </h3>

                  <form onSubmit={handleInviteSubmit} className="space-y-4">
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {activeVendors.map((vendor) => {
                        const isChecked = selectedNewVendors.includes(vendor.id);
                        return (
                          <div
                            key={vendor.id}
                            onClick={() => handleNewVendorToggle(vendor.id)}
                            className="flex items-start gap-2 p-2 rounded-lg hover:bg-surface-50 cursor-pointer text-xs transition-colors border border-surface-100"
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              readOnly
                              className="mt-0.5 shrink-0 text-brand-600 rounded"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-surface-850 truncate">
                                {vendor.company_name}
                              </p>
                              <p className="text-[10px] text-surface-400">
                                {vendor.category}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <button
                      type="submit"
                      disabled={inviting}
                      className="w-full btn btn-primary py-2 text-xs font-bold"
                    >
                      {inviting ? 'Inviting...' : 'Send Invitations'}
                    </button>
                  </form>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
export default RFQDetail;
