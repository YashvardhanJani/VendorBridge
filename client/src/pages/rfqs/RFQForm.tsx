import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import { RFQ_STATUSES } from '../../utils/constants';
import { ArrowLeft, Save, Plus, Trash2, Calendar, Users, Paperclip, CheckSquare, Square, Search } from 'lucide-react';
import toast from 'react-hot-toast';

interface RfqItem {
  name: string;
  description: string;
  qty: number;
  unit: string;
  specNotes: string;
}

interface AttachmentItem {
  name: string;
  url: string;
}

export const RFQForm: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [status, setStatus] = useState<any>('Draft');
  
  const [items, setItems] = useState<RfqItem[]>([]);
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  const [assignedVendors, setAssignedVendors] = useState<string[]>([]);

  // Item form inputs
  const [itemName, setItemName] = useState('');
  const [itemDesc, setItemDesc] = useState('');
  const [itemQty, setItemQty] = useState(1);
  const [itemUnit, setItemUnit] = useState('Pcs');
  const [itemSpecs, setItemSpecs] = useState('');

  // Attachment form inputs
  const [attachName, setAttachName] = useState('');
  const [attachUrl, setAttachUrl] = useState('');

  // Loaded vendors for checklist
  const [vendors, setVendors] = useState<any[]>([]);
  const [vendorSearch, setVendorSearch] = useState('');
  const [loadingVendors, setLoadingVendors] = useState(true);

  const [saving, setSaving] = useState(false);
  const [fetching, setFetching] = useState(isEditMode);

  // Load vendors list
  useEffect(() => {
    const fetchActiveVendors = async () => {
      try {
        const response = await api.get('/vendors', { params: { export: true, status: 'Active' } });
        if (response.data.success) {
          setVendors(response.data.vendors);
        }
      } catch (err) {
        toast.error('Failed to load vendors list');
      } finally {
        setLoadingVendors(false);
      }
    };
    fetchActiveVendors();
  }, []);

  // Load RFQ details if edit mode
  useEffect(() => {
    if (isEditMode) {
      const fetchRfq = async () => {
        try {
          const response = await api.get(`/rfqs/${id}`);
          if (response.data.success) {
            const r = response.data.rfq;
            setTitle(r.title);
            setDescription(r.description);
            // Format deadline date to YYYY-MM-DD
            const d = new Date(r.deadline).toISOString().split('T')[0];
            setDeadline(d);
            setStatus(r.status);
            setItems(r.items || []);
            setAttachments(r.attachments || []);
            setAssignedVendors(r.assignedVendors || []);
          }
        } catch (err) {
          toast.error('Failed to load RFQ data');
          navigate('/rfqs');
        } finally {
          setFetching(false);
        }
      };
      fetchRfq();
    }
  }, [id, isEditMode, navigate]);

  const handleAddItem = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!itemName.trim()) return toast.error('Item name is required');
    if (itemQty <= 0) return toast.error('Quantity must be greater than zero');
    if (!itemUnit.trim()) return toast.error('Unit (e.g. Pcs, Kgs) is required');

    setItems([...items, {
      name: itemName,
      description: itemDesc,
      qty: itemQty,
      unit: itemUnit,
      specNotes: itemSpecs
    }]);

    setItemName('');
    setItemDesc('');
    setItemQty(1);
    setItemUnit('Pcs');
    setItemSpecs('');
    toast.success('Line item added');
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, idx) => idx !== index));
  };

  const handleAddAttachment = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!attachName.trim()) return toast.error('Attachment title is required');
    if (!attachUrl.trim()) return toast.error('Attachment URL is required');
    try {
      new URL(attachUrl);
    } catch {
      return toast.error('Please enter a valid URL');
    }

    setAttachments([...attachments, { name: attachName, url: attachUrl }]);
    setAttachName('');
    setAttachUrl('');
    toast.success('Attachment added');
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments(attachments.filter((_, idx) => idx !== index));
  };

  const handleVendorToggle = (vendorId: string) => {
    if (assignedVendors.includes(vendorId)) {
      setAssignedVendors(assignedVendors.filter(vid => vid !== vendorId));
    } else {
      setAssignedVendors([...assignedVendors, vendorId]);
    }
  };

  const handleSubmit = async (e: React.FormEvent, customStatus?: string) => {
    e.preventDefault();

    if (!title.trim()) return toast.error('RFQ title is required');
    if (!deadline) return toast.error('Bidding deadline is required');
    
    const dDate = new Date(deadline);
    if (dDate <= new Date()) {
      return toast.error('Bidding deadline must be in the future');
    }

    if (items.length === 0) {
      return toast.error('You must add at least one line item to the RFQ');
    }

    setSaving(true);
    try {
      const payload = {
        title,
        description,
        deadline,
        status: customStatus || status,
        items,
        assignedVendors,
        attachments,
      };

      if (isEditMode) {
        const response = await api.put(`/rfqs/${id}`, payload);
        if (response.data.success) {
          toast.success('RFQ updated successfully');
          navigate(`/rfqs/${id}`);
        }
      } else {
        const response = await api.post('/rfqs', payload);
        if (response.data.success) {
          toast.success('RFQ created successfully');
          navigate('/rfqs');
        }
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.error || 'Failed to save RFQ';
      toast.error(errMsg);
    } finally {
      setSaving(false);
    }
  };

  const filteredVendors = vendors.filter(v => 
    v.company_name.toLowerCase().includes(vendorSearch.toLowerCase()) ||
    v.category.toLowerCase().includes(vendorSearch.toLowerCase())
  );

  if (fetching) {
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
          <h1 className="page-title">{isEditMode ? 'Edit RFQ Details' : 'Create Procurement RFQ'}</h1>
          <p className="text-sm text-surface-500 mt-1">
            {isEditMode ? 'Modify title, line items, and attachments' : 'Initiate bidding process by requesting quotation bids'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Core Form & Line Items */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Info */}
          <div className="card p-6 bg-white border border-surface-200 space-y-4">
            <h3 className="text-base font-bold text-surface-900 border-b border-surface-100 pb-3">
              RFQ Specifications
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-surface-600 uppercase mb-1.5">
                  RFQ Title / Requirement Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Office Laptops Procurement - Q3"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="input-field"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-surface-600 uppercase mb-1.5">
                    Bidding Deadline Date
                  </label>
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-surface-600 uppercase mb-1.5">
                    Initial Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="input-field"
                    disabled={isEditMode && status !== 'Draft'} // status handled in workflow actions once published
                  >
                    <option value="Draft">Draft (Internal)</option>
                    <option value="Published">Published (Active)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-surface-600 uppercase mb-1.5">
                  General Guidelines / Description
                </label>
                <textarea
                  placeholder="Provide brief parameters, warranty requirements, and terms of execution..."
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="input-field"
                />
              </div>
            </div>
          </div>

          {/* Line Items Manager */}
          <div className="card p-6 bg-white border border-surface-200 space-y-6">
            <div>
              <h3 className="text-base font-bold text-surface-900 border-b border-surface-100 pb-3">
                Requested Line Items ({items.length})
              </h3>
              <p className="text-xs text-surface-450 mt-1">
                Add precise descriptions and quantities for materials or services required.
              </p>
            </div>

            {/* Subform */}
            <div className="p-4 bg-surface-50 rounded-xl border border-surface-150 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold text-surface-600 uppercase mb-1">
                    Item Title
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Dell XPS 15 Laptop"
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    className="input-field py-1.5 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-surface-600 uppercase mb-1">
                    Unit Type
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Pcs, Kgs, Ltrs"
                    value={itemUnit}
                    onChange={(e) => setItemUnit(e.target.value)}
                    className="input-field py-1.5 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-surface-600 uppercase mb-1">
                    Required Quantity
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={itemQty}
                    onChange={(e) => setItemQty(parseInt(e.target.value) || 1)}
                    className="input-field py-1.5 text-xs"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold text-surface-600 uppercase mb-1">
                    Item Description
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Intel i7, 16GB RAM, 512GB SSD"
                    value={itemDesc}
                    onChange={(e) => setItemDesc(e.target.value)}
                    className="input-field py-1.5 text-xs"
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="block text-[10px] font-bold text-surface-600 uppercase mb-1">
                    Specific Instructions / Compliance Notes
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Must support 3 years next business day warranty"
                    value={itemSpecs}
                    onChange={(e) => setItemSpecs(e.target.value)}
                    className="input-field py-1.5 text-xs"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddItem}
                className="btn btn-secondary py-2 text-xs flex items-center justify-center gap-1 bg-white w-full md:w-auto md:px-5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item Row</span>
              </button>
            </div>

            {/* List */}
            {items.length === 0 ? (
              <div className="text-center py-8 text-xs text-surface-400 border border-dashed border-surface-200 rounded-xl">
                No items added yet. You must add at least 1 item to proceed.
              </div>
            ) : (
              <div className="overflow-x-auto border border-surface-150 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-50 border-b border-surface-150 font-bold text-surface-500 uppercase">
                    <tr>
                      <th className="py-2.5 px-4">Item Details</th>
                      <th className="py-2.5 px-4">Qty</th>
                      <th className="py-2.5 px-4">Unit</th>
                      <th className="py-2.5 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-100">
                    {items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-surface-50/40">
                        <td className="py-3 px-4">
                          <p className="font-semibold text-surface-850">{item.name}</p>
                          <p className="text-[10px] text-surface-450 mt-0.5">{item.description}</p>
                          {item.specNotes && (
                            <p className="text-[9px] text-brand-600 bg-brand-50/50 px-1 py-0.5 rounded mt-1 inline-block">
                              Specs: {item.specNotes}
                            </p>
                          )}
                        </td>
                        <td className="py-3 px-4 font-semibold text-surface-900">{item.qty}</td>
                        <td className="py-3 px-4 text-surface-600">{item.unit}</td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="p-1 text-danger-500 hover:bg-danger-50 rounded-lg"
                          >
                            <Trash2 className="w-4.5 h-4.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Invite Vendors & Attachments Sidebar */}
        <div className="space-y-6">
          {/* Action Trigger Card */}
          <div className="card p-6 bg-white border border-surface-200 space-y-3">
            <h4 className="text-xs font-bold text-surface-450 uppercase tracking-wider">
              RFQ Workflow Controls
            </h4>
            <div className="space-y-2">
              <button
                type="button"
                onClick={(e) => handleSubmit(e, 'Draft')}
                disabled={saving}
                className="w-full btn btn-secondary py-2.5 text-xs font-bold"
              >
                Save as Draft
              </button>
              <button
                type="button"
                onClick={(e) => handleSubmit(e, 'Published')}
                disabled={saving}
                className="w-full btn btn-primary py-2.5 text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Processing...' : 'Publish & Invite'}</span>
              </button>
            </div>
          </div>

          {/* Invitation Panel */}
          <div className="card p-6 bg-white border border-surface-200 space-y-4">
            <h3 className="text-sm font-bold text-surface-900 border-b border-surface-100 pb-2.5 flex items-center gap-2">
              <Users className="w-4.5 h-4.5 text-brand-600" />
              <span>Assign Suppliers</span>
            </h3>

            {/* Checklist filters */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-surface-400" />
              <input
                type="text"
                placeholder="Search vendor category or name..."
                value={vendorSearch}
                onChange={(e) => setVendorSearch(e.target.value)}
                className="input-field pl-8 py-1.5 text-xs"
              />
            </div>

            {loadingVendors ? (
              <div className="space-y-2 py-4">
                <div className="h-6 skeleton rounded" />
                <div className="h-6 skeleton rounded" />
              </div>
            ) : filteredVendors.length === 0 ? (
              <div className="text-center text-xs text-surface-400 py-6">
                No active vendors found
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {filteredVendors.map((vendor) => {
                  const isChecked = assignedVendors.includes(vendor.id);
                  return (
                    <div
                      key={vendor.id}
                      onClick={() => handleVendorToggle(vendor.id)}
                      className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-surface-50 cursor-pointer text-xs transition-colors border border-surface-100"
                    >
                      <div className="shrink-0 mt-0.5 text-brand-600">
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 fill-brand-50" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-surface-850 truncate">
                          {vendor.company_name}
                        </p>
                        <p className="text-[10px] text-surface-450 mt-0.5">
                          Category: {vendor.category}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Attachments Section */}
          <div className="card p-6 bg-white border border-surface-200 space-y-4">
            <h3 className="text-sm font-bold text-surface-900 border-b border-surface-100 pb-2.5 flex items-center gap-2">
              <Paperclip className="w-4.5 h-4.5 text-brand-600" />
              <span>Attachments ({attachments.length})</span>
            </h3>

            {/* Subform */}
            <div className="space-y-2 p-3 bg-surface-50 border border-surface-150 rounded-xl text-xs">
              <div>
                <label className="block text-[10px] font-bold text-surface-500 uppercase mb-0.5">
                  Attachment Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Technical Specs PDF"
                  value={attachName}
                  onChange={(e) => setAttachName(e.target.value)} // wait, it should be setAttachName! Let's double check.
                  className="input-field py-1 text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-surface-500 uppercase mb-0.5">
                  Resource URL
                </label>
                <input
                  type="text"
                  placeholder="https://gdrive.com/specs.pdf"
                  value={attachUrl}
                  onChange={(e) => setAttachUrl(e.target.value)}
                  className="input-field py-1 text-xs font-mono"
                />
              </div>
              <button
                type="button"
                onClick={handleAddAttachment}
                className="w-full btn btn-secondary py-1 text-[11px] bg-white flex items-center justify-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>Attach URL</span>
              </button>
            </div>

            {/* List */}
            {attachments.length > 0 && (
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {attachments.map((file, idx) => (
                  <div
                    key={idx}
                    className="p-2 bg-white border border-surface-150 rounded-lg flex items-center justify-between text-xs gap-3"
                  >
                    <span className="font-semibold text-surface-800 truncate">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveAttachment(idx)}
                      className="text-danger-500 hover:bg-danger-50 p-1 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default RFQForm;
