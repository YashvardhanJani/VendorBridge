import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import {
  ArrowLeft,
  Building,
  Mail,
  Phone,
  MapPin,
  Star,
  FileText,
  Calendar,
  Edit2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ExternalLink
} from 'lucide-react';
import toast from 'react-hot-toast';

export const VendorDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isOfficerOrAdmin = user?.role === 'Officer' || user?.role === 'Admin';

  const [vendor, setVendor] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVendor = async () => {
      try {
        const response = await api.get(`/vendors/${id}`);
        if (response.data.success) {
          setVendor(response.data.vendor);
        }
      } catch (err: any) {
        toast.error('Failed to load vendor profile details');
        navigate('/vendors');
      } finally {
        setLoading(false);
      }
    };
    fetchVendor();
  }, [id, navigate]);

  const getStatusBadge = (statusVal: string) => {
    switch (statusVal) {
      case 'Active':
        return (
          <span className="badge-active inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Active</span>
          </span>
        );
      case 'Inactive':
        return (
          <span className="badge-draft inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold">
            <XCircle className="w-3.5 h-3.5" />
            <span>Inactive</span>
          </span>
        );
      case 'Blacklisted':
        return (
          <span className="badge-danger inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Blacklisted</span>
          </span>
        );
      default:
        return <span className="badge-draft px-3 py-1">{statusVal}</span>;
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
      {/* Header / Nav */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/vendors')}
            className="p-2 border border-surface-200 hover:bg-surface-50 rounded-xl transition-all"
          >
            <ArrowLeft className="w-5 h-5 text-surface-600" />
          </button>
          <div>
            <h1 className="page-title">{vendor.company_name}</h1>
            <p className="text-sm text-surface-500 mt-1">
              Registered procurement supplier category:{' '}
              <span className="font-semibold text-brand-600">{vendor.category}</span>
            </p>
          </div>
        </div>

        {isOfficerOrAdmin && (
          <button
            onClick={() => navigate(`/vendors/${vendor.id}/edit`)}
            className="btn btn-primary py-2.5 px-5 flex items-center gap-1.5"
          >
            <Edit2 className="w-4 h-4" />
            <span>Edit Profile</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Core details card */}
        <div className="card p-6 bg-white border border-surface-200 lg:col-span-2 space-y-6">
          <div>
            <h3 className="text-base font-bold text-surface-900 border-b border-surface-100 pb-3">
              Corporate Profile
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              {/* Category */}
              <div className="flex gap-3 text-sm">
                <Building className="w-5 h-5 text-surface-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-surface-400 uppercase tracking-wider">
                    Supplier Category
                  </p>
                  <p className="font-semibold text-surface-800 mt-0.5">{vendor.category}</p>
                </div>
              </div>

              {/* GSTIN */}
              <div className="flex gap-3 text-sm">
                <FileText className="w-5 h-5 text-surface-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-surface-400 uppercase tracking-wider">
                    GSTIN Tax ID
                  </p>
                  <p className="font-mono font-semibold text-surface-800 mt-0.5">{vendor.gst}</p>
                </div>
              </div>

              {/* Email */}
              <div className="flex gap-3 text-sm">
                <Mail className="w-5 h-5 text-surface-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-surface-400 uppercase tracking-wider">
                    Contact Email
                  </p>
                  <a
                    href={`mailto:${vendor.contact_email}`}
                    className="font-semibold text-brand-600 hover:underline mt-0.5 block"
                  >
                    {vendor.contact_email}
                  </a>
                </div>
              </div>

              {/* Phone */}
              <div className="flex gap-3 text-sm">
                <Phone className="w-5 h-5 text-surface-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-surface-400 uppercase tracking-wider">
                    Phone Contact
                  </p>
                  <p className="font-semibold text-surface-800 mt-0.5">{vendor.phone}</p>
                </div>
              </div>

              {/* Address */}
              <div className="flex gap-3 text-sm md:col-span-2">
                <MapPin className="w-5 h-5 text-surface-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-surface-400 uppercase tracking-wider">
                    Registered Address
                  </p>
                  <p className="font-semibold text-surface-700 mt-0.5 whitespace-pre-wrap">
                    {vendor.address}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Verification Audit */}
          <div className="pt-6 border-t border-surface-100 flex flex-wrap items-center justify-between gap-4 text-xs text-surface-400 font-medium">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>Registered on: {new Date(vendor.created_at).toLocaleDateString()}</span>
            </span>
            <span>Last database update: {new Date(vendor.updated_at).toLocaleString()}</span>
          </div>
        </div>

        {/* Side bar stats */}
        <div className="space-y-6">
          {/* Status & Rating */}
          <div className="card p-6 bg-white border border-surface-200 space-y-6">
            <div>
              <h4 className="text-xs font-bold text-surface-400 uppercase tracking-wider mb-2">
                Verification Status
              </h4>
              <div>{getStatusBadge(vendor.status)}</div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-surface-400 uppercase tracking-wider mb-2">
                Supplier Rating
              </h4>
              <div className="flex items-center gap-2">
                <Star className="w-6 h-6 fill-warning-400 text-warning-500" />
                <span className="text-3xl font-extrabold text-surface-900 leading-none">
                  {Number(vendor.rating).toFixed(1)}
                </span>
                <span className="text-xs text-surface-400 mt-1 font-semibold">/ 5.0</span>
              </div>
              <p className="text-[11px] text-surface-450 mt-2">
                Aggregated based on historical delivery timelines, quote compliance, and quality checks.
              </p>
            </div>
          </div>

          {/* Uploaded Documents */}
          <div className="card p-6 bg-white border border-surface-200 space-y-4">
            <h3 className="text-sm font-bold text-surface-900 border-b border-surface-100 pb-2.5">
              Legal Documents ({vendor.documents?.length || 0})
            </h3>

            {(!vendor.documents || vendor.documents.length === 0) ? (
              <div className="text-center py-6 text-xs text-surface-400 border border-dashed border-surface-200 rounded-xl">
                No files uploaded
              </div>
            ) : (
              <div className="space-y-3">
                {vendor.documents.map((doc: any) => (
                  <a
                    key={doc.id}
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 bg-surface-50 hover:bg-brand-50 border border-surface-150 hover:border-brand-200 rounded-xl flex items-center justify-between gap-3 text-xs group transition-all"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-surface-800 truncate group-hover:text-brand-900">
                        {doc.name}
                      </p>
                      <p className="text-[10px] text-surface-500 mt-0.5">{doc.type}</p>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-surface-400 group-hover:text-brand-600 shrink-0" />
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default VendorDetail;
