import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import { VENDOR_CATEGORIES, VENDOR_STATUSES } from '../../utils/constants';
import {
  Search,
  Download,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Star,
  Users
} from 'lucide-react';
import toast from 'react-hot-toast';

export const VendorList: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isOfficerOrAdmin = user?.role === 'Officer' || user?.role === 'Admin';

  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const response = await api.get('/vendors', {
        params: { search, category, status, page, limit: 8 },
      });
      if (response.data.success) {
        setVendors(response.data.vendors);
        setTotalPages(response.data.pagination.pages);
        setTotalItems(response.data.pagination.total);
      }
    } catch (err: any) {
      toast.error('Failed to load vendors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, [page, category, status]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchVendors();
  };

  const handleResetFilters = () => {
    setSearch('');
    setCategory('');
    setStatus('');
    setPage(1);
    // Fetch directly because state updates might be batched
    setTimeout(fetchVendors, 0);
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const response = await api.patch(`/vendors/${id}/status`, { status: newStatus });
      if (response.data.success) {
        toast.success(`Vendor status changed to ${newStatus}`);
        fetchVendors();
      }
    } catch (err) {
      toast.error('Failed to change status');
    }
    setActiveMenuId(null);
  };

  const handleDeleteVendor = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete vendor "${name}"?`)) return;
    try {
      const response = await api.delete(`/vendors/${id}`);
      if (response.data.success) {
        toast.success('Vendor deleted successfully');
        fetchVendors();
      }
    } catch (err) {
      toast.error('Failed to delete vendor');
    }
  };

  const handleExportCSV = async () => {
    try {
      const response = await api.get('/vendors', {
        params: { search, category, status, export: true },
      });
      if (response.data.success) {
        const list = response.data.vendors;
        if (list.length === 0) {
          toast.error('No vendors found to export');
          return;
        }

        const headers = ['Company Name', 'GST', 'Category', 'Contact Email', 'Phone', 'Address', 'Status', 'Rating'];
        const csvRows = [
          headers.join(','),
          ...list.map((v: any) =>
            [
              `"${v.company_name}"`,
              `"${v.gst}"`,
              `"${v.category}"`,
              `"${v.contact_email}"`,
              `"${v.phone}"`,
              `"${v.address.replace(/\n/g, ' ')}"`,
              `"${v.status}"`,
              v.rating,
            ].join(',')
          ),
        ];

        const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `vendorbridge_vendors_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Vendors list exported successfully');
      }
    } catch (err) {
      toast.error('Export failed');
    }
  };

  const getStatusBadge = (statusVal: string) => {
    switch (statusVal) {
      case 'Active':
        return (
          <span className="badge-active inline-flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            <span>Active</span>
          </span>
        );
      case 'Inactive':
        return (
          <span className="badge-draft inline-flex items-center gap-1">
            <XCircle className="w-3 h-3" />
            <span>Inactive</span>
          </span>
        );
      case 'Blacklisted':
        return (
          <span className="badge-danger inline-flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            <span>Blacklisted</span>
          </span>
        );
      default:
        return <span className="badge-draft">{statusVal}</span>;
    }
  };

  return (
    <div className="page-container space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Vendor Directory</h1>
          <p className="text-sm text-surface-500 mt-1">
            Browse, manage, and register official procurement vendor partners
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportCSV}
            className="btn btn-secondary py-2 flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          {isOfficerOrAdmin && (
            <button
              onClick={() => navigate('/vendors/new')}
              className="btn btn-primary py-2 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Register Vendor</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card p-4 bg-white border border-surface-200">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
            <input
              type="text"
              placeholder="Search by company name or GSTIN..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-10"
            />
          </div>

          <div className="flex flex-wrap gap-3 w-full md:w-auto items-center">
            {/* Category Filter */}
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="input-field max-w-[160px] py-2.5 text-sm"
            >
              <option value="">All Categories</option>
              {VENDOR_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="input-field max-w-[140px] py-2.5 text-sm"
            >
              <option value="">All Statuses</option>
              {VENDOR_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <button
              type="submit"
              className="btn btn-secondary py-2 px-4 text-sm font-semibold"
            >
              Search
            </button>

            {(search || category || status) && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs font-semibold text-brand-600 hover:underline px-2"
              >
                Clear Filters
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Vendors Table Card */}
      <div className="card overflow-hidden bg-white border border-surface-200 shadow-sm">
        {loading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 skeleton rounded-lg" />
            ))}
          </div>
        ) : vendors.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-16 h-16 bg-surface-50 text-surface-300 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-surface-900 mb-1">No vendors found</h3>
            <p className="text-sm text-surface-500 max-w-sm mx-auto mb-6">
              No registered vendor profiles match your current search query or filter tags.
            </p>
            {isOfficerOrAdmin && (
              <button
                onClick={() => navigate('/vendors/new')}
                className="btn btn-primary py-2 px-5"
              >
                Register a new vendor
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-50 border-b border-surface-150 text-xs font-bold text-surface-500 uppercase tracking-wider">
                  <th className="py-4 px-6">Company Name</th>
                  <th className="py-4 px-6">Category</th>
                  <th className="py-4 px-6">GSTIN</th>
                  <th className="py-4 px-6">Rating</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100 text-sm">
                {vendors.map((vendor) => (
                  <tr key={vendor.id} className="hover:bg-surface-50/40 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-semibold text-surface-900">{vendor.company_name}</div>
                      <div className="text-xs text-surface-500">{vendor.contact_email}</div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-50 text-brand-700">
                        {vendor.category}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-mono text-xs text-surface-600">
                      {vendor.gst}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1 text-warning-500">
                        <Star className="w-4 h-4 fill-warning-400" />
                        <span className="font-semibold text-surface-800 text-xs">
                          {Number(vendor.rating).toFixed(1)}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      {getStatusBadge(vendor.status)}
                    </td>
                    <td className="py-4 px-6 text-right relative">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => navigate(`/vendors/${vendor.id}`)}
                          className="p-1.5 text-surface-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                          title="View Profile"
                        >
                          <ExternalLink className="w-4.5 h-4.5" />
                        </button>

                        {isOfficerOrAdmin && (
                          <>
                            <button
                              onClick={() => navigate(`/vendors/${vendor.id}/edit`)}
                              className="p-1.5 text-surface-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="Edit Vendor"
                            >
                              <Edit2 className="w-4.5 h-4.5" />
                            </button>

                            {/* Dropdown for status toggle */}
                            <div className="relative">
                              <button
                                onClick={() => setActiveMenuId(activeMenuId === vendor.id ? null : vendor.id)}
                                className="p-1.5 text-surface-500 hover:text-surface-900 hover:bg-surface-100 rounded-lg transition-colors"
                              >
                                <MoreVertical className="w-4.5 h-4.5" />
                              </button>

                              {activeMenuId === vendor.id && (
                                <div className="absolute right-0 mt-1 w-36 bg-white border border-surface-200 rounded-xl shadow-lg z-50 py-1">
                                  <div className="px-3 py-1.5 text-xs text-surface-400 font-bold border-b border-surface-100">
                                    Set Status
                                  </div>
                                  <button
                                    onClick={() => handleStatusChange(vendor.id, 'Active')}
                                    className="w-full text-left px-3 py-2 text-xs hover:bg-surface-50 text-surface-700 font-medium"
                                  >
                                    Active
                                  </button>
                                  <button
                                    onClick={() => handleStatusChange(vendor.id, 'Inactive')}
                                    className="w-full text-left px-3 py-2 text-xs hover:bg-surface-50 text-surface-700 font-medium"
                                  >
                                    Inactive
                                  </button>
                                  <button
                                    onClick={() => handleStatusChange(vendor.id, 'Blacklisted')}
                                    className="w-full text-left px-3 py-2 text-xs hover:bg-surface-50 text-danger-600 font-semibold"
                                  >
                                    Blacklist
                                  </button>
                                  {user?.role === 'Admin' && (
                                    <button
                                      onClick={() => {
                                        setActiveMenuId(null);
                                        handleDeleteVendor(vendor.id, vendor.company_name);
                                      }}
                                      className="w-full text-left px-3 py-2 text-xs hover:bg-danger-50 text-danger-600 font-semibold border-t border-surface-100 flex items-center gap-1"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                      <span>Delete</span>
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Table Pagination Footer */}
        {!loading && totalItems > 0 && (
          <div className="p-4 border-t border-surface-150 bg-surface-50/50 flex items-center justify-between">
            <span className="text-xs text-surface-500 font-medium">
              Showing <span className="text-surface-800 font-semibold">{(page - 1) * 8 + 1}</span> to{' '}
              <span className="text-surface-800 font-semibold">
                {Math.min(page * 8, totalItems)}
              </span>{' '}
              of <span className="text-surface-800 font-semibold">{totalItems}</span> vendors
            </span>
            <div className="flex gap-1.5">
              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="p-1.5 border border-surface-250 bg-white rounded-lg text-surface-600 hover:bg-surface-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3.5 py-1.5 bg-white border border-surface-250 text-xs font-semibold text-surface-700 rounded-lg">
                {page} / {totalPages}
              </span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
                className="p-1.5 border border-surface-250 bg-white rounded-lg text-surface-600 hover:bg-surface-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default VendorList;
