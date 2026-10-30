import { useState, useEffect } from 'react';
import {
  Search,
  Building2,
  Calendar,
  Eye,
  Clock,
  User,
  ShieldCheck,
  AlertCircle,
  Briefcase,
  RefreshCw,
} from 'lucide-react';
import { DashboardLayout } from '../../components/layout';
import {
  Card,
  Badge,
  Button,
  Input,
  Select,
  Modal,
  Pagination,
  LoadingSpinner,
  EmptyState,
} from '../../components/ui';
import { adminService } from '../../api';

const STATUS_FILTER_OPTIONS = [
  { value: 'ALL', label: 'All Application Statuses' },
  { value: 'APPLIED', label: 'Applied' },
  { value: 'UNDER_REVIEW', label: 'Under Review' },
  { value: 'SHORTLISTED', label: 'Shortlisted' },
  { value: 'INTERVIEW_SCHEDULED', label: 'Interview Scheduled' },
  { value: 'SELECTED', label: 'Selected' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'WITHDRAWN', label: 'Withdrawn' },
];

export const AdminApplicationsPage = () => {
  const [applications, setApplications] = useState([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchKeyword, setSearchKeyword] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  // States
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Modals
  const [viewingApp, setViewingApp] = useState(null);

  // Load Applications from Backend
  useEffect(() => {
    let isCancelled = false;

    const fetchApplications = async () => {
      try {
        setError(null);
        const params = {
          page: currentPage - 1,
          size: 10,
          sort: 'appliedAt,desc',
        };

        if (statusFilter !== 'ALL') {
          params.status = statusFilter;
        }

        const res = await adminService.getApplications(params);
        if (isCancelled) return;
        if (res.success && res.data) {
          setApplications(res.data.content || []);
          setTotalPages(res.data.totalPages || 1);
          setTotalElements(res.data.totalElements || 0);
        } else {
          setError(res.message || 'Failed to load applications log.');
        }
      } catch (err) {
        if (isCancelled) return;
        setError(err.response?.data?.message || err.message || 'Failed to connect to applications service.');
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchApplications();
    return () => {
      isCancelled = true;
    };
  }, [currentPage, statusFilter, refreshKey]);

  // View Application Details
  const handleOpenDetails = async (app) => {
    try {
      const res = await adminService.getApplication(app.id);
      if (res.success && res.data) {
        setViewingApp(res.data);
      } else {
        setViewingApp(app);
      }
    } catch {
      setViewingApp(app);
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return 'N/A';
    try {
      return new Date(isoString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  // Frontend search filtering by candidate email or job title
  const filteredApplications = applications.filter((app) => {
    const q = searchKeyword.trim().toLowerCase();
    if (!q) return true;
    const candidateEmail = app.candidate?.email?.toLowerCase() || '';
    const jobTitle = app.job?.title?.toLowerCase() || '';
    const companyName = app.job?.company?.name?.toLowerCase() || '';
    return candidateEmail.includes(q) || jobTitle.includes(q) || companyName.includes(q);
  });

  return (
    <DashboardLayout
      role="admin"
      title="Platform Applications Audit"
      breadcrumb="Admin Center / Applications"
    >
      <div className="space-y-6">
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

        {/* Info Banner: Read-Only Interface */}
        <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 flex items-start gap-3">
          <ShieldCheck size={18} className="text-slate-500 shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed">
            <span className="font-semibold text-slate-900">Administrative Read-Only Audit Interface:</span> Candidate application statuses are governed strictly by recruiting employers. Administrators oversee submissions, audit status histories, and inspect candidate-job connections.
          </div>
        </div>

        {/* Filter Toolbar */}
        <Card>
          <Card.Body className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <Input
                  placeholder="Search by candidate email, job role, or company..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  leftIcon={<Search size={16} />}
                />
              </div>

              <div>
                <Select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                    setIsLoading(true);
                  }}
                  options={STATUS_FILTER_OPTIONS}
                />
              </div>

              <div className="flex items-center justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsLoading(true);
                    setRefreshKey((k) => k + 1);
                  }}
                  disabled={isLoading}
                  leftIcon={<RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />}
                  className="w-full md:w-auto"
                >
                  Refresh Logs
                </Button>
              </div>
            </div>
          </Card.Body>
        </Card>

        {/* Applications Table */}
        <Card>
          <Card.Body noPadding>
            {isLoading ? (
              <div className="py-16 flex justify-center">
                <LoadingSpinner message="Loading application audit logs..." />
              </div>
            ) : filteredApplications.length === 0 ? (
              <div className="py-12">
                <EmptyState
                  title="No Applications Logged"
                  description={
                    searchKeyword || statusFilter !== 'ALL'
                      ? 'No candidate submissions match your current filter criteria.'
                      : 'No candidate applications have been recorded on the platform yet.'
                  }
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      <th className="p-4">Applicant (Candidate)</th>
                      <th className="p-4">Applied Job & Company</th>
                      <th className="p-4">Submission Timestamp</th>
                      <th className="p-4">Current Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {filteredApplications.map((app) => (
                      <tr key={app.id} className="hover:bg-slate-50/75 transition-colors">
                        {/* Candidate */}
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
                              {app.candidate?.email?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900">
                                {app.candidate?.email}
                              </div>
                              <span className="text-xs text-slate-400 font-mono">
                                App ID: #{app.id}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Job & Company */}
                        <td className="p-4">
                          <div>
                            <span
                              className="font-semibold text-slate-900 hover:text-indigo-600 cursor-pointer block"
                              onClick={() => handleOpenDetails(app)}
                            >
                              {app.job?.title || 'Job Posting'}
                            </span>
                            <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                              <Building2 size={12} className="text-slate-400" />
                              <span>{app.job?.company?.name || 'Company'}</span>
                            </div>
                          </div>
                        </td>

                        {/* Applied Date */}
                        <td className="p-4 text-xs text-slate-500">
                          {formatDate(app.appliedAt)}
                        </td>

                        {/* Status */}
                        <td className="p-4">
                          <Badge status={app.status} hasDot />
                        </td>

                        {/* Actions */}
                        <td className="p-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Audit Application & Timeline"
                            onClick={() => handleOpenDetails(app)}
                          >
                            <Eye size={15} />
                          </Button>
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
            <div className="p-4 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500">
              <span className="px-4">Total Submissions: {totalElements}</span>
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

        {/* Application Details Modal */}
        <Modal
          isOpen={!!viewingApp}
          onClose={() => setViewingApp(null)}
          title="Application Audit Record"
          subtitle="Candidate submission metadata and status progression history"
          size="md"
        >
          {viewingApp && (
            <div className="space-y-4 pt-2">
              <div className="flex items-start justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div>
                  <h4 className="font-bold text-slate-900 text-base">
                    {viewingApp.job?.title || 'Applied Job'}
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                    <span className="font-medium text-slate-700">
                      {viewingApp.job?.company?.name || 'Company'}
                    </span>
                    <span>•</span>
                    <span>App ID: #{viewingApp.id}</span>
                  </div>
                </div>
                <div>
                  <Badge status={viewingApp.status} hasDot />
                </div>
              </div>

              {/* Candidate Info */}
              <div className="p-3 rounded-lg border border-slate-100 bg-white space-y-1 text-xs">
                <span className="text-slate-400 font-semibold flex items-center gap-1">
                  <User size={12} /> Candidate Identity
                </span>
                <div className="font-semibold text-slate-900 text-sm">
                  {viewingApp.candidate?.email}
                </div>
                <div className="text-slate-500">Candidate UID: #{viewingApp.candidate?.id}</div>
              </div>

              {/* Job Info */}
              <div className="p-3 rounded-lg border border-slate-100 bg-white space-y-1 text-xs">
                <span className="text-slate-400 font-semibold flex items-center gap-1">
                  <Briefcase size={12} /> Target Role Overview
                </span>
                <div className="font-medium text-slate-800">
                  {viewingApp.job?.employmentType?.replace('_', ' ')} • {viewingApp.job?.jobType} • {viewingApp.job?.location}
                </div>
              </div>

              {/* Submission Date */}
              <div className="p-3 rounded-lg border border-slate-100 bg-white flex items-center justify-between text-xs">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Calendar size={13} className="text-slate-400" />
                  Initial Application Submitted
                </span>
                <span className="font-semibold text-slate-800">{formatDate(viewingApp.appliedAt)}</span>
              </div>

              {/* Status History Timeline */}
              <div className="p-3 rounded-lg border border-slate-100 bg-white">
                <span className="text-xs font-semibold text-slate-500 block mb-3 flex items-center gap-1">
                  <Clock size={12} /> Status Progression History
                </span>
                {viewingApp.statusHistory && viewingApp.statusHistory.length > 0 ? (
                  <div className="space-y-3 relative before:absolute before:inset-0 before:left-2 before:w-0.5 before:bg-slate-200">
                    {viewingApp.statusHistory.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3 relative">
                        <div className="w-4 h-4 rounded-full bg-indigo-600 border-2 border-white shadow-sm shrink-0 z-10" />
                        <div className="flex items-center justify-between w-full text-xs">
                          <span className="font-semibold text-slate-800">
                            {item.status?.replace('_', ' ')}
                          </span>
                          <span className="text-slate-400 font-mono">
                            {formatDate(item.changedAt)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 italic">No transition history logged.</div>
                )}
              </div>

              <div className="flex justify-end pt-2">
                <Button variant="outline" onClick={() => setViewingApp(null)}>
                  Close Audit Record
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default AdminApplicationsPage;
