import { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Building2,
  CheckCircle2,
  AlertCircle,
  Eye,
  ShieldCheck,
  ShieldAlert,
  ExternalLink,
  MapPin,
  Briefcase,
  Calendar,
} from 'lucide-react';
import { DashboardLayout } from '../../components/layout';
import {
  Card,
  Button,
  Input,
  Select,
  Modal,
  Pagination,
  LoadingSpinner,
  EmptyState,
} from '../../components/ui';
import { adminService } from '../../api';

const VERIFICATION_FILTER_OPTIONS = [
  { value: 'ALL', label: 'All Companies' },
  { value: 'true', label: 'Verified Only' },
  { value: 'false', label: 'Pending / Unverified Only' },
];

export const AdminCompaniesPage = () => {
  const [companies, setCompanies] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [debouncedKeyword, setDebouncedKeyword] = useState('');
  const [verifiedFilter, setVerifiedFilter] = useState('ALL');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  // States
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Modals
  const [viewingCompany, setViewingCompany] = useState(null);
  const [verificationAction, setVerificationAction] = useState(null); // { company, nextVerified: boolean }
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedKeyword(keyword.trim());
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [keyword]);

  // Load Companies from Backend
  useEffect(() => {
    let isCancelled = false;

    const fetchCompanies = async () => {
      try {
        setError(null);
        const params = {
          page: currentPage - 1,
          size: 10,
          sort: 'createdAt,desc',
        };

        if (verifiedFilter !== 'ALL') {
          params.verified = verifiedFilter === 'true';
        }
        if (debouncedKeyword) {
          params.keyword = debouncedKeyword;
        }

        const res = await adminService.getCompanies(params);
        if (isCancelled) return;
        if (res.success && res.data) {
          setCompanies(res.data.content || []);
          setTotalPages(res.data.totalPages || 1);
          setTotalElements(res.data.totalElements || 0);
        } else {
          setError(res.message || 'Failed to load company directory.');
        }
      } catch (err) {
        if (isCancelled) return;
        setError(err.response?.data?.message || err.message || 'Failed to connect to company service.');
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchCompanies();
    return () => {
      isCancelled = true;
    };
  }, [currentPage, verifiedFilter, debouncedKeyword, refreshKey]);

  // Handle Verify / Unverify Action
  const handleConfirmVerification = async () => {
    if (!verificationAction) return;
    const { company, nextVerified } = verificationAction;

    setIsSubmitting(true);
    setError(null);
    try {
      const res = await adminService.updateCompanyVerification(company.id, nextVerified);
      if (res.success) {
        setSuccessMessage(
          `Company "${company.name}" has been successfully marked as ${nextVerified ? 'VERIFIED' : 'UNVERIFIED'}.`
        );
        setVerificationAction(null);
        setIsLoading(true);
        setRefreshKey((k) => k + 1);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to update company verification.');
      setVerificationAction(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  // View Company Details
  const handleOpenDetails = async (company) => {
    try {
      const res = await adminService.getCompany(company.id);
      if (res.success && res.data) {
        setViewingCompany(res.data);
      } else {
        setViewingCompany(company);
      }
    } catch {
      setViewingCompany(company);
    }
  };

  const verificationStats = useMemo(() => {
    const verified = companies.filter((c) => c.verified).length;
    const unverified = companies.filter((c) => !c.verified).length;
    return { verified, unverified };
  }, [companies]);

  const formatDate = (isoString) => {
    if (!isoString) return 'N/A';
    try {
      return new Date(isoString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <DashboardLayout
      role="admin"
      title="Company Verification & Management"
      breadcrumb="Admin Center / Companies"
    >
      <div className="space-y-6">
        {/* Success Alert */}
        {successMessage && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
              <span className="text-sm font-medium">{successMessage}</span>
            </div>
            <button
              onClick={() => setSuccessMessage(null)}
              className="text-emerald-600 hover:text-emerald-800 text-xs font-semibold"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-2">
              <AlertCircle size={18} className="text-rose-600 shrink-0" />
              <span className="text-sm font-medium">{error}</span>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-rose-600 hover:text-rose-800 text-xs font-semibold"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Stats Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="bg-slate-50 border-slate-200">
            <Card.Body className="p-4 text-center">
              <div className="text-xs font-medium text-slate-500">Total Registered Employers</div>
              <div className="text-2xl font-bold text-slate-900 mt-1">{totalElements}</div>
            </Card.Body>
          </Card>
          <Card className="bg-emerald-50/60 border-emerald-200">
            <Card.Body className="p-4 text-center">
              <div className="text-xs font-medium text-emerald-700">Verified Companies (Page)</div>
              <div className="text-2xl font-bold text-emerald-950 mt-1">{verificationStats.verified}</div>
            </Card.Body>
          </Card>
          <Card className="bg-amber-50/60 border-amber-200">
            <Card.Body className="p-4 text-center">
              <div className="text-xs font-medium text-amber-700">Pending Review (Page)</div>
              <div className="text-2xl font-bold text-amber-950 mt-1">{verificationStats.unverified}</div>
            </Card.Body>
          </Card>
        </div>

        {/* Filter Toolbar */}
        <Card>
          <Card.Body className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <Input
                  placeholder="Search companies by legal name..."
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  leftIcon={<Search size={16} />}
                />
              </div>

              <div>
                <Select
                  value={verifiedFilter}
                  onChange={(e) => {
                    setVerifiedFilter(e.target.value);
                    setCurrentPage(1);
                    setIsLoading(true);
                  }}
                  options={VERIFICATION_FILTER_OPTIONS}
                />
              </div>
            </div>
          </Card.Body>
        </Card>

        {/* Companies Table */}
        <Card>
          <Card.Body noPadding>
            {isLoading ? (
              <div className="py-16 flex justify-center">
                <LoadingSpinner message="Loading company directory..." />
              </div>
            ) : companies.length === 0 ? (
              <div className="py-12">
                <EmptyState
                  title="No Companies Found"
                  description={
                    keyword || verifiedFilter !== 'ALL'
                      ? 'No registered companies match your search and filter criteria.'
                      : 'No companies have been registered on the platform yet.'
                  }
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      <th className="p-4">Company Name & Industry</th>
                      <th className="p-4">Location</th>
                      <th className="p-4">Official Website</th>
                      <th className="p-4">Verification Status</th>
                      <th className="p-4">Registered Date</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {companies.map((comp) => (
                      <tr key={comp.id} className="hover:bg-slate-50/75 transition-colors">
                        {/* Name & Industry */}
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-sm">
                              {comp.name?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900 hover:text-indigo-600 cursor-pointer" onClick={() => handleOpenDetails(comp)}>
                                {comp.name}
                              </div>
                              <span className="text-xs text-slate-400">
                                {comp.industry || 'General Industry'}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Location */}
                        <td className="p-4 text-slate-600">
                          <div className="flex items-center gap-1.5 text-xs">
                            <MapPin size={13} className="text-slate-400 shrink-0" />
                            {comp.location || 'Not Specified'}
                          </div>
                        </td>

                        {/* Website */}
                        <td className="p-4 text-xs">
                          {comp.website ? (
                            <a
                              href={comp.website.startsWith('http') ? comp.website : `https://${comp.website}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1 max-w-[180px] truncate"
                            >
                              {comp.website.replace(/^https?:\/\//, '')}
                              <ExternalLink size={12} className="shrink-0" />
                            </a>
                          ) : (
                            <span className="text-slate-400">Not provided</span>
                          )}
                        </td>

                        {/* Verification Status */}
                        <td className="p-4">
                          {comp.verified ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <ShieldCheck size={13} className="text-emerald-600" />
                              Verified
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              <ShieldAlert size={13} className="text-amber-600" />
                              Pending Verification
                            </span>
                          )}
                        </td>

                        {/* Created Date */}
                        <td className="p-4 text-xs text-slate-500">
                          {formatDate(comp.createdAt)}
                        </td>

                        {/* Actions */}
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* View Modal Trigger */}
                            <Button
                              variant="ghost"
                              size="sm"
                              title="View Company Profile"
                              onClick={() => handleOpenDetails(comp)}
                            >
                              <Eye size={15} />
                            </Button>

                            {/* Verify or Unverify Action */}
                            {comp.verified ? (
                              <Button
                                variant="outline"
                                size="sm"
                                title="Revoke verified badge"
                                className="text-amber-700 hover:text-amber-800 border-amber-200 hover:bg-amber-50 text-xs"
                                onClick={() =>
                                  setVerificationAction({ company: comp, nextVerified: false })
                                }
                              >
                                Revoke
                              </Button>
                            ) : (
                              <Button
                                variant="primary"
                                size="sm"
                                title="Approve and grant verified badge"
                                className="text-xs"
                                onClick={() =>
                                  setVerificationAction({ company: comp, nextVerified: true })
                                }
                              >
                                Verify
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card.Body>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-100 flex justify-end">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => {
                  setCurrentPage(page);
                  setIsLoading(true);
                }}
              />
            </div>
          )}
        </Card>

        {/* Company Details Modal */}
        <Modal
          isOpen={!!viewingCompany}
          onClose={() => setViewingCompany(null)}
          title="Company Profile & Audit"
          subtitle="Registered employer information and verification status"
          size="md"
        >
          {viewingCompany && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xl">
                  {viewingCompany.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-base">{viewingCompany.name}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-mono text-slate-500">
                      ID: #{viewingCompany.id}
                    </span>
                    <span className="text-slate-300">•</span>
                    {viewingCompany.verified ? (
                      <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                        <ShieldCheck size={12} /> Verified Employer
                      </span>
                    ) : (
                      <span className="text-xs text-amber-600 font-semibold flex items-center gap-1">
                        <ShieldAlert size={12} /> Verification Pending
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 rounded-lg border border-slate-100 bg-white">
                  <div className="text-xs font-semibold text-slate-400 flex items-center gap-1 mb-1">
                    <Briefcase size={12} /> Industry
                  </div>
                  <div className="font-bold text-slate-900">
                    {viewingCompany.industry || 'Not Specified'}
                  </div>
                </div>

                <div className="p-3 rounded-lg border border-slate-100 bg-white">
                  <div className="text-xs font-semibold text-slate-400 flex items-center gap-1 mb-1">
                    <MapPin size={12} /> Location
                  </div>
                  <div className="font-medium text-slate-900">
                    {viewingCompany.location || 'Not Specified'}
                  </div>
                </div>
              </div>

              {viewingCompany.website && (
                <div className="p-3 rounded-lg border border-slate-100 bg-white">
                  <div className="text-xs font-semibold text-slate-400 flex items-center gap-1 mb-1">
                    <Building2 size={12} /> Official Website
                  </div>
                  <a
                    href={viewingCompany.website.startsWith('http') ? viewingCompany.website : `https://${viewingCompany.website}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1"
                  >
                    {viewingCompany.website}
                    <ExternalLink size={12} />
                  </a>
                </div>
              )}

              {viewingCompany.description && (
                <div className="p-3 rounded-lg border border-slate-100 bg-white">
                  <div className="text-xs font-semibold text-slate-400 mb-1">Company Description</div>
                  <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {viewingCompany.description}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 text-xs text-slate-500 pt-1">
                <div className="flex items-center gap-1">
                  <Calendar size={12} />
                  <span>Created: {formatDate(viewingCompany.createdAt)}</span>
                </div>
                <div className="flex items-center gap-1 justify-end">
                  <span>Updated: {formatDate(viewingCompany.updatedAt)}</span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                <div>
                  {viewingCompany.verified ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-amber-700 border-amber-200 hover:bg-amber-50"
                      onClick={() => {
                        const target = viewingCompany;
                        setViewingCompany(null);
                        setVerificationAction({ company: target, nextVerified: false });
                      }}
                    >
                      Revoke Verification
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        const target = viewingCompany;
                        setViewingCompany(null);
                        setVerificationAction({ company: target, nextVerified: true });
                      }}
                    >
                      Verify Company
                    </Button>
                  )}
                </div>
                <Button variant="outline" onClick={() => setViewingCompany(null)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* Confirmation Modal for Verification Toggle */}
        <Modal
          isOpen={!!verificationAction}
          onClose={() => setVerificationAction(null)}
          title={
            verificationAction?.nextVerified
              ? 'Confirm Company Verification'
              : 'Revoke Company Verification'
          }
          subtitle="Administrative governance action"
          size="sm"
        >
          {verificationAction && (
            <div className="space-y-4 pt-2">
              <p className="text-sm text-slate-600">
                Are you sure you want to{' '}
                <strong className={verificationAction.nextVerified ? 'text-emerald-700' : 'text-amber-700'}>
                  {verificationAction.nextVerified ? 'verify and approve' : 'revoke the verified status for'}
                </strong>{' '}
                <span className="font-semibold text-slate-900">{verificationAction.company.name}</span>?
              </p>

              {verificationAction.nextVerified ? (
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-100 text-xs text-emerald-800">
                  Verifying this company displays a verified trust badge on candidate job listings, signaling authentic employer identity.
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-100 text-xs text-amber-800">
                  Revoking verification removes the trusted badge from candidate searches and job details.
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setVerificationAction(null)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  variant={verificationAction.nextVerified ? 'primary' : 'outline'}
                  className={!verificationAction.nextVerified ? 'text-amber-700 border-amber-300 hover:bg-amber-50' : ''}
                  onClick={handleConfirmVerification}
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? 'Updating...'
                    : verificationAction.nextVerified
                    ? 'Verify Company'
                    : 'Revoke Verification'}
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default AdminCompaniesPage;
