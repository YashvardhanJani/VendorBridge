import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import { VENDOR_CATEGORIES, VENDOR_STATUSES, VENDOR_DOC_TYPES } from '../../utils/constants';
import { ArrowLeft, Save, Plus, Trash2, FilePlus } from 'lucide-react';
import toast from 'react-hot-toast';

interface DocItem {
  name: string;
  url: string;
  type: 'PAN' | 'GST Certificate' | 'Bank Details' | 'Other';
}

export const VendorForm: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [companyName, setCompanyName] = useState('');
  const [gst, setGst] = useState('');
  const [category, setCategory] = useState<any>('IT');
  const [contactEmail, setContactEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [status, setStatus] = useState<any>('Active');
  const [documents, setDocuments] = useState<DocItem[]>([]);

  // Document temp fields
  const [docName, setDocName] = useState('');
  const [docUrl, setDocUrl] = useState('');
  const [docType, setDocType] = useState<any>('PAN');

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditMode);

  useEffect(() => {
    if (isEditMode) {
      const fetchVendor = async () => {
        try {
          const response = await api.get(`/vendors/${id}`);
          if (response.data.success) {
            const v = response.data.vendor;
            setCompanyName(v.company_name);
            setGst(v.gst);
            setCategory(v.category);
            setContactEmail(v.contact_email);
            setPhone(v.phone);
            setAddress(v.address);
            setStatus(v.status);
            setDocuments(v.documents || []);
          }
        } catch (err: any) {
          toast.error('Failed to load vendor profile');
          navigate('/vendors');
        } finally {
          setFetching(false);
        }
      };
      fetchVendor();
    }
  }, [id, isEditMode, navigate]);

  const handleAddDocument = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!docName.trim()) {
      toast.error('Document title is required');
      return;
    }
    if (!docUrl.trim()) {
      toast.error('Document URL is required');
      return;
    }
    try {
      new URL(docUrl); // simple test URL validation
    } catch {
      toast.error('Please enter a valid document URL');
      return;
    }

    setDocuments([...documents, { name: docName, url: docUrl, type: docType }]);
    setDocName('');
    setDocUrl('');
    setDocType('PAN');
    toast.success('Document attached');
  };

  const handleRemoveDocument = (index: number) => {
    setDocuments(documents.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic Validation
    if (!companyName.trim()) return toast.error('Company Name is required');
    if (!gst.trim()) return toast.error('GSTIN is required');
    
    // Indian GSTIN pattern
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (!gstRegex.test(gst)) {
      return toast.error('GST number must match Indian format (e.g. 27AAAAA1111A1Z1)');
    }

    if (!contactEmail.trim()) return toast.error('Contact Email is required');
    if (!phone.trim()) return toast.error('Phone number is required');
    if (phone.length < 10) return toast.error('Phone number must be at least 10 digits');
    if (!address.trim()) return toast.error('Address is required');

    setLoading(true);
    try {
      const payload = {
        companyName,
        gst,
        category,
        contactEmail,
        phone,
        address,
        status,
        documents,
      };

      if (isEditMode) {
        const response = await api.put(`/vendors/${id}`, payload);
        if (response.data.success) {
          toast.success('Vendor profile updated successfully');
          navigate(`/vendors/${id}`);
        }
      } else {
        const response = await api.post('/vendors', payload);
        if (response.data.success) {
          toast.success('Vendor registered successfully');
          navigate('/vendors');
        }
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.error || 'Failed to save vendor details';
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

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
          <h1 className="page-title">{isEditMode ? 'Edit Vendor Profile' : 'Register Vendor'}</h1>
          <p className="text-sm text-surface-500 mt-1">
            {isEditMode
              ? `Modify parameters for ${companyName}`
              : 'Add a new verified vendor account to the ERP directory'}
          </p>
        </div>
      </div>

      {/* Main Grid form */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Core Info */}
        <div className="card p-6 bg-white border border-surface-200 space-y-5 lg:col-span-2">
          <h3 className="text-base font-bold text-surface-900 border-b border-surface-100 pb-3">
            Company Parameters
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-surface-600 uppercase mb-1.5">
                Company Name
              </label>
              <input
                type="text"
                placeholder="Enter company registered name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-surface-600 uppercase mb-1.5">
                GSTIN (Tax ID)
              </label>
              <input
                type="text"
                placeholder="e.g. 22AAAAA1111A1Z1"
                value={gst}
                onChange={(e) => setGst(e.target.value.toUpperCase())}
                className="input-field font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-surface-600 uppercase mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="input-field"
              >
                {VENDOR_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-surface-600 uppercase mb-1.5">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="input-field"
              >
                {VENDOR_STATUSES.map((stat) => (
                  <option key={stat} value={stat}>
                    {stat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-surface-600 uppercase mb-1.5">
                Contact Email
              </label>
              <input
                type="email"
                placeholder="sales@company.com"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-surface-600 uppercase mb-1.5">
                Phone Number
              </label>
              <input
                type="text"
                placeholder="10 digit contact phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                className="input-field"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-surface-600 uppercase mb-1.5">
              Postal Address
            </label>
            <textarea
              placeholder="Full postal corporate office address"
              rows={3}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="input-field"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-surface-100">
            <button
              type="button"
              onClick={() => navigate('/vendors')}
              className="btn btn-secondary py-2.5 px-5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary py-2.5 px-6 flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Saving...' : 'Save Profile'}</span>
            </button>
          </div>
        </div>

        {/* Document Attachments */}
        <div className="card p-6 bg-white border border-surface-200 space-y-6">
          <div>
            <h3 className="text-base font-bold text-surface-900 border-b border-surface-100 pb-3 flex items-center gap-2">
              <FilePlus className="w-5 h-5 text-brand-600" />
              <span>Legal Documents</span>
            </h3>
            <p className="text-xs text-surface-450 mt-1">
              Attach legal proof documents such as GST registration, PAN cards, or canceled bank details.
            </p>
          </div>

          {/* Add doc subform */}
          <div className="p-4 bg-surface-50 rounded-xl space-y-3 border border-surface-150">
            <div>
              <label className="block text-[10px] font-bold text-surface-600 uppercase mb-1">
                Document Title
              </label>
              <input
                type="text"
                placeholder="e.g. GST Certificate Copy"
                value={docName}
                onChange={(e) => setDocName(e.target.value)}
                className="input-field py-1.5 text-xs"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-surface-600 uppercase mb-1">
                Document Type
              </label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className="input-field py-1.5 text-xs"
              >
                {VENDOR_DOC_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-surface-600 uppercase mb-1">
                Document Link/URL
              </label>
              <input
                type="text"
                placeholder="https://drive.google.com/..."
                value={docUrl}
                onChange={(e) => setDocUrl(e.target.value)}
                className="input-field py-1.5 text-xs font-mono"
              />
            </div>

            <button
              onClick={handleAddDocument}
              className="w-full btn btn-secondary py-2 text-xs flex items-center justify-center gap-1 bg-white"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Attach File URL</span>
            </button>
          </div>

          {/* List attached docs */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-surface-700">Attached ({documents.length})</h4>
            {documents.length === 0 ? (
              <div className="text-center text-xs text-surface-400 py-6 border border-dashed border-surface-200 rounded-xl">
                No documents uploaded
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {documents.map((doc, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 bg-white border border-surface-150 rounded-xl flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-surface-900 truncate">{doc.name}</p>
                      <p className="text-[10px] text-brand-600 font-medium">{doc.type}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveDocument(idx)}
                      className="p-1 text-danger-500 hover:bg-danger-50 rounded-lg"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};
export default VendorForm;
