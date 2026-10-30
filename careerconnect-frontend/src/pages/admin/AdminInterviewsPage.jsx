import { useState, useEffect } from 'react';
import {
  Search,
  Calendar,
  Clock,
  Video,
  MapPin,
  Phone,
  Building2,
  Eye,
  ShieldCheck,
  AlertCircle,
  Briefcase,
  User,
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
  { value: 'ALL', label: 'All Statuses' },
  { value: 'SCHEDULED', label: 'Scheduled' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const MODE_FILTER_OPTIONS = [
  { value: 'ALL', label: 'All Modes' },
  { value: 'ONLINE', label: 'Online Video' },
  { value: 'OFFLINE', label: 'In-Person / On-Site' },
  { value: 'PHONE', label: 'Phone Call' },
];

export const AdminInterviewsPage = () => {
  const [interviews, setInterviews] = useState([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [modeFilter, setModeFilter] = useState('ALL');
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
  const [viewingInterview, setViewingInterview] = useState(null);

  // Load Interviews from Backend
  useEffect(() => {
    let isCancelled = false;

    const fetchInterviews = async () => {
      try {
        setError(null);
        const params = {
          page: currentPage - 1,
          size: 10,
          sort: 'scheduledDateTime,desc',
        };

        if (statusFilter !== 'ALL') params.status = statusFilter;
        if (modeFilter !== 'ALL') params.mode = modeFilter;

        const res = await adminService.getInterviews(params);
        if (isCancelled) return;
        if (res.success && res.data) {
          setInterviews(res.data.content || []);
          setTotalPages(res.data.totalPages || 1);
          setTotalElements(res.data.totalElements || 0);
        } else {
          setError(res.message || 'Failed to load interviews log.');
        }
      } catch (err) {
        if (isCancelled) return;
        setError(err.response?.data?.message || err.message || 'Failed to connect to interviews service.');
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchInterviews();
    return () => {
      isCancelled = true;
    };
  }, [currentPage, statusFilter, modeFilter, refreshKey]);

  // View Details
  const handleOpenDetails = async (intv) => {
    try {
      const res = await adminService.getInterview(intv.id);
      if (res.success && res.data) {
        setViewingInterview(res.data);
      } else {
        setViewingInterview(intv);
      }
    } catch {
      setViewingInterview(intv);
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

  // Frontend search filter
  const filteredInterviews = interviews.filter((item) => {
    const q = searchKeyword.trim().toLowerCase();
    if (!q) return true;
    const candidateEmail = item.candidate?.email?.toLowerCase() || '';
    const jobTitle = item.job?.title?.toLowerCase() || '';
    const companyName = item.job?.company?.name?.toLowerCase() || '';
    return candidateEmail.includes(q) || jobTitle.includes(q) || companyName.includes(q);
  });

  return (
    <DashboardLayout
      role="admin"
      title="Platform Interview Oversight"
      breadcrumb="Admin Center / Interviews"
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

        {/* Read-Only Banner */}
        <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 flex items-start gap-3">
          <ShieldCheck size={18} className="text-slate-500 shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed">
            <span className="font-semibold text-slate-900">Administrative Read-Only Oversight:</span> Interview scheduling, link configuration, rescheduling, and completions are managed by the hiring employer. Administrators review session logs and compliance records.
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

              <div>
                <Select
                  value={modeFilter}
                  onChange={(e) => {
                    setModeFilter(e.target.value);
                    setCurrentPage(1);
                    setIsLoading(true);
                  }}
                  options={MODE_FILTER_OPTIONS}
                />
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-100 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsLoading(true);
                  setRefreshKey((k) => k + 1);
                }}
                disabled={isLoading}
                leftIcon={<RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />}
              >
                Refresh Sessions
              </Button>
            </div>
          </Card.Body>
        </Card>

        {/* Interviews Table */}
        <Card>
          <Card.Body noPadding>
            {isLoading ? (
              <div className="py-16 flex justify-center">
                <LoadingSpinner message="Loading interview oversight logs..." />
              </div>
            ) : filteredInterviews.length === 0 ? (
              <div className="py-12">
                <EmptyState
                  title="No Interviews Logged"
                  description={
                    searchKeyword || statusFilter !== 'ALL' || modeFilter !== 'ALL'
                      ? 'No interview sessions match your current filter parameters.'
                      : 'No candidate interviews have been scheduled on the platform yet.'
                  }
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      <th className="p-4">Candidate Identity</th>
                      <th className="p-4">Target Job & Company</th>
                      <th className="p-4">Interview Mode</th>
                      <th className="p-4">Scheduled Date & Time</th>
                      <th className="p-4">Session Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {filteredInterviews.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/75 transition-colors">
                        {/* Candidate */}
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
                              {item.candidate?.email?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900">
                                {item.candidate?.email}
                              </div>
                              <span className="text-xs text-slate-400 font-mono">
                                Session ID: #{item.id}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Job & Company */}
                        <td className="p-4">
                          <div>
                            <span
                              className="font-semibold text-slate-900 hover:text-indigo-600 cursor-pointer block"
                              onClick={() => handleOpenDetails(item)}
                            >
                              {item.job?.title || 'Target Position'}
                            </span>
                            <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                              <Building2 size={12} className="text-slate-400" />
                              <span>{item.job?.company?.name || 'Company'}</span>
                            </div>
                          </div>
                        </td>

                        {/* Mode */}
                        <td className="p-4">
                          {item.interviewMode === 'ONLINE' && (
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md">
                              <Video size={13} />
                              Online Video
                            </span>
                          )}
                          {item.interviewMode === 'OFFLINE' && (
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
                              <MapPin size={13} />
                              On-Site
                            </span>
                          )}
                          {item.interviewMode === 'PHONE' && (
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md">
                              <Phone size={13} />
                              Phone Call
                            </span>
                          )}
                        </td>

                        {/* Scheduled Date */}
                        <td className="p-4 text-xs text-slate-600">
                          <div className="flex items-center gap-1.5">
                            <Clock size={13} className="text-slate-400 shrink-0" />
                            {formatDate(item.scheduledDateTime)}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="p-4">
                          {item.status === 'SCHEDULED' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                              Scheduled
                            </span>
                          )}
                          {item.status === 'COMPLETED' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Completed
                            </span>
                          )}
                          {item.status === 'CANCELLED' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                              Cancelled
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="p-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Audit Session Details"
                            onClick={() => handleOpenDetails(item)}
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
              <span className="px-4">Total Interview Logs: {totalElements}</span>
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

        {/* Interview Details Modal */}
        <Modal
          isOpen={!!viewingInterview}
          onClose={() => setViewingInterview(null)}
          title="Interview Session Audit Record"
          subtitle="Platform interview log and scheduling parameters"
          size="md"
        >
          {viewingInterview && (
            <div className="space-y-4 pt-2">
              <div className="flex items-start justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div>
                  <h4 className="font-bold text-slate-900 text-base">
                    {viewingInterview.job?.title || 'Target Job Role'}
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                    <span className="font-medium text-slate-700">
                      {viewingInterview.job?.company?.name || 'Company'}
                    </span>
                    <span>•</span>
                    <span>Session ID: #{viewingInterview.id}</span>
                  </div>
                </div>
                <div>
                  <Badge variant={viewingInterview.status === 'COMPLETED' ? 'success' : viewingInterview.status === 'CANCELLED' ? 'error' : 'primary'}>
                    {viewingInterview.status}
                  </Badge>
                </div>
              </div>

              {/* Candidate Info */}
              <div className="p-3 rounded-lg border border-slate-100 bg-white space-y-1 text-xs">
                <span className="text-slate-400 font-semibold flex items-center gap-1">
                  <User size={12} /> Interviewed Candidate
                </span>
                <div className="font-semibold text-slate-900 text-sm">
                  {viewingInterview.candidate?.email}
                </div>
                <div className="text-slate-500">Candidate UID: #{viewingInterview.candidate?.id}</div>
              </div>

              {/* Role Info */}
              <div className="p-3 rounded-lg border border-slate-100 bg-white space-y-1 text-xs">
                <span className="text-slate-400 font-semibold flex items-center gap-1">
                  <Briefcase size={12} /> Role Overview
                </span>
                <div className="font-medium text-slate-800">
                  {viewingInterview.job?.employmentType?.replace('_', ' ')} • {viewingInterview.job?.jobType} • {viewingInterview.job?.location}
                </div>
              </div>

              {/* Session Details */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg border border-slate-100 bg-white">
                  <span className="text-slate-400 block mb-1">Interview Mode</span>
                  <span className="font-bold text-slate-900">{viewingInterview.interviewMode}</span>
                </div>
                <div className="p-3 rounded-lg border border-slate-100 bg-white">
                  <span className="text-slate-400 block mb-1">Scheduled Time</span>
                  <span className="font-semibold text-slate-900">
                    {formatDate(viewingInterview.scheduledDateTime)}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-600 flex items-start gap-2">
                <Calendar size={14} className="shrink-0 mt-0.5 text-slate-400" />
                <span>
                  Meeting coordinates and candidate invitations are handled directly between the hiring employer and the candidate.
                </span>
              </div>

              <div className="flex justify-end pt-2">
                <Button variant="outline" onClick={() => setViewingInterview(null)}>
                  Close Audit
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default AdminInterviewsPage;
