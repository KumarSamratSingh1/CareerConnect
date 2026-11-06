import { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Building2,
  MapPin,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  XCircle,
  Tag,
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
  useToast,
} from '../../components/ui';
import { adminService } from '../../api';

const STATUS_FILTER_OPTIONS = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'OPEN', label: 'Open Jobs' },
  { value: 'CLOSED', label: 'Closed Jobs' },
];

const JOB_TYPE_FILTER_OPTIONS = [
  { value: 'ALL', label: 'All Job Types' },
  { value: 'JOB', label: 'Regular Job' },
  { value: 'INTERNSHIP', label: 'Internship' },
];

export const AdminJobsPage = () => {
  const toast = useToast();
  const [jobs, setJobs] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [debouncedKeyword, setDebouncedKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [jobTypeFilter, setJobTypeFilter] = useState('ALL');

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
  const [viewingJob, setViewingJob] = useState(null);
  const [closingJob, setClosingJob] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedKeyword(keyword.trim());
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [keyword]);

  // Load Jobs from Backend
  useEffect(() => {
    let isCancelled = false;

    const fetchJobs = async () => {
      try {
        setError(null);
        const params = {
          page: currentPage - 1,
          size: 10,
          sort: 'createdAt,desc',
        };

        if (statusFilter !== 'ALL') params.status = statusFilter;
        if (jobTypeFilter !== 'ALL') params.jobType = jobTypeFilter;
        if (debouncedKeyword) params.keyword = debouncedKeyword;

        const res = await adminService.getJobs(params);
        if (isCancelled) return;
        if (res.success && res.data) {
          setJobs(res.data.content || []);
          setTotalPages(res.data.totalPages || 1);
          setTotalElements(res.data.totalElements || 0);
        } else {
          setError(res.message || 'Failed to load job listings.');
        }
      } catch (err) {
        if (isCancelled) return;
        setError(err.response?.data?.message || err.message || 'Failed to connect to jobs service.');
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchJobs();
    return () => {
      isCancelled = true;
    };
  }, [currentPage, statusFilter, jobTypeFilter, debouncedKeyword, refreshKey]);

  // Handle Force Close Job
  const handleConfirmClose = async () => {
    if (!closingJob) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const res = await adminService.closeJob(closingJob.id);
      if (res.success) {
        const msg = `Job "${closingJob.title}" has been successfully force-closed.`;
        setSuccessMessage(msg);
        toast.info(msg);
        setClosingJob(null);
        setIsLoading(true);
        setRefreshKey((k) => k + 1);
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to close job posting.';
      setError(msg);
      toast.error(msg);
      setClosingJob(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  // View Job Details
  const handleOpenDetails = async (job) => {
    try {
      const res = await adminService.getJob(job.id);
      if (res.success && res.data) {
        setViewingJob(res.data);
      } else {
        setViewingJob(job);
      }
    } catch {
      setViewingJob(job);
    }
  };

  const jobStats = useMemo(() => {
    const openCount = jobs.filter((j) => j.status === 'OPEN').length;
    const closedCount = jobs.filter((j) => j.status === 'CLOSED').length;
    return { openCount, closedCount };
  }, [jobs]);

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

  const formatSalary = (min, max) => {
    if (min == null && max == null) return 'Not Disclosed';
    if (min != null && max != null) return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
    if (min != null) return `From $${min.toLocaleString()}`;
    return `Up to $${max.toLocaleString()}`;
  };

  return (
    <DashboardLayout
      role="admin"
      title="Job Postings Governance"
      breadcrumb="Admin Center / Jobs"
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
              <div className="text-xs font-medium text-slate-500">Total System Job Postings</div>
              <div className="text-2xl font-bold text-slate-900 mt-1">{totalElements}</div>
            </Card.Body>
          </Card>
          <Card className="bg-emerald-50/60 border-emerald-200">
            <Card.Body className="p-4 text-center">
              <div className="text-xs font-medium text-emerald-700">Open Postings (Page)</div>
              <div className="text-2xl font-bold text-emerald-950 mt-1">{jobStats.openCount}</div>
            </Card.Body>
          </Card>
          <Card className="bg-slate-100/60 border-slate-300">
            <Card.Body className="p-4 text-center">
              <div className="text-xs font-medium text-slate-600">Closed Postings (Page)</div>
              <div className="text-2xl font-bold text-slate-800 mt-1">{jobStats.closedCount}</div>
            </Card.Body>
          </Card>
        </div>

        {/* Filter Toolbar */}
        <Card>
          <Card.Body className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <Input
                  placeholder="Search jobs by title or location..."
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
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
                  value={jobTypeFilter}
                  onChange={(e) => {
                    setJobTypeFilter(e.target.value);
                    setCurrentPage(1);
                    setIsLoading(true);
                  }}
                  options={JOB_TYPE_FILTER_OPTIONS}
                />
              </div>
            </div>
          </Card.Body>
        </Card>

        {/* Jobs Table */}
        <Card>
          <Card.Body noPadding>
            {isLoading ? (
              <div className="py-16 flex justify-center">
                <LoadingSpinner message="Loading job governance directory..." />
              </div>
            ) : jobs.length === 0 ? (
              <div className="py-12">
                <EmptyState
                  title="No Jobs Found"
                  description={
                    keyword || statusFilter !== 'ALL' || jobTypeFilter !== 'ALL'
                      ? 'No job listings match your current search and filter criteria.'
                      : 'No jobs have been posted on the platform yet.'
                  }
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      <th className="p-4">Job Role & Company</th>
                      <th className="p-4">Location</th>
                      <th className="p-4">Category & Type</th>
                      <th className="p-4">Deadline</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {jobs.map((job) => (
                      <tr key={job.id} className="hover:bg-slate-50/75 transition-colors">
                        {/* Title & Company */}
                        <td className="p-4">
                          <div>
                            <span
                              className="font-semibold text-slate-900 hover:text-indigo-600 cursor-pointer block"
                              onClick={() => handleOpenDetails(job)}
                            >
                              {job.title}
                            </span>
                            <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                              <Building2 size={12} className="text-slate-400" />
                              <span>{job.company?.name || 'Company'}</span>
                            </div>
                          </div>
                        </td>

                        {/* Location */}
                        <td className="p-4 text-slate-600">
                          <div className="flex items-center gap-1.5 text-xs">
                            <MapPin size={12} className="text-slate-400 shrink-0" />
                            {job.location || 'Remote'}
                          </div>
                        </td>

                        {/* Category & Type */}
                        <td className="p-4">
                          <div className="flex flex-wrap gap-1">
                            <Badge variant={job.jobType === 'INTERNSHIP' ? 'warning' : 'primary'} size="sm">
                              {job.jobType}
                            </Badge>
                            <span className="text-xs text-slate-400 self-center">
                              {job.employmentType?.replace('_', ' ')}
                            </span>
                          </div>
                        </td>

                        {/* Deadline */}
                        <td className="p-4 text-xs text-slate-500">
                          {formatDate(job.applicationDeadline)}
                        </td>

                        {/* Status */}
                        <td className="p-4">
                          {job.status === 'OPEN' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Open
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                              Closed
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* View Modal */}
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Audit Job Posting"
                              onClick={() => handleOpenDetails(job)}
                            >
                              <Eye size={15} />
                            </Button>

                            {/* Force Close Action */}
                            {job.status === 'OPEN' ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                title="Force-close active job posting"
                                className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                                onClick={() => setClosingJob(job)}
                              >
                                <XCircle size={15} />
                              </Button>
                            ) : (
                              <span className="text-xs text-slate-400 px-2">Closed</span>
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

        {/* Job Details Modal */}
        <Modal
          isOpen={!!viewingJob}
          onClose={() => setViewingJob(null)}
          title="Job Posting Governance Audit"
          subtitle="Full job specifications, compensation, and required competencies"
          size="lg"
        >
          {viewingJob && (
            <div className="space-y-4 pt-2">
              <div className="flex items-start justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div>
                  <h4 className="font-bold text-slate-900 text-lg">{viewingJob.title}</h4>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                    <span className="font-semibold text-slate-700">
                      {viewingJob.company?.name || 'Company'}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MapPin size={12} /> {viewingJob.location}
                    </span>
                    <span>•</span>
                    <span>ID: #{viewingJob.id}</span>
                  </div>
                </div>
                <div>
                  <Badge variant={viewingJob.status === 'OPEN' ? 'success' : 'neutral'}>
                    {viewingJob.status}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-lg border border-slate-100 bg-white">
                  <span className="text-slate-400 block mb-1">Job Type</span>
                  <span className="font-bold text-slate-900">{viewingJob.jobType}</span>
                </div>
                <div className="p-3 rounded-lg border border-slate-100 bg-white">
                  <span className="text-slate-400 block mb-1">Employment</span>
                  <span className="font-bold text-slate-900">
                    {viewingJob.employmentType?.replace('_', ' ')}
                  </span>
                </div>
                <div className="p-3 rounded-lg border border-slate-100 bg-white">
                  <span className="text-slate-400 block mb-1">Min Experience</span>
                  <span className="font-bold text-slate-900">
                    {viewingJob.minExperience != null ? `${viewingJob.minExperience} yrs` : 'None'}
                  </span>
                </div>
                <div className="p-3 rounded-lg border border-slate-100 bg-white">
                  <span className="text-slate-400 block mb-1">Duration / Term</span>
                  <span className="font-bold text-slate-900">
                    {viewingJob.duration || 'Full Term'}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-lg border border-slate-100 bg-white text-xs">
                <span className="text-slate-400 block mb-1">Compensation Range</span>
                <span className="font-bold text-slate-900 text-sm">
                  {formatSalary(viewingJob.minSalary, viewingJob.maxSalary)}
                </span>
              </div>

              {/* Skills */}
              {viewingJob.requiredSkills && viewingJob.requiredSkills.length > 0 && (
                <div className="p-3 rounded-lg border border-slate-100 bg-white">
                  <span className="text-xs text-slate-400 block mb-2 flex items-center gap-1">
                    <Tag size={12} /> Required Skills & Technologies
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {viewingJob.requiredSkills.map((s, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100"
                      >
                        {typeof s === 'string' ? s : s.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              {viewingJob.description && (
                <div className="p-3 rounded-lg border border-slate-100 bg-white max-h-56 overflow-y-auto">
                  <span className="text-xs text-slate-400 block mb-1">Job Description</span>
                  <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {viewingJob.description}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 text-xs text-slate-400 pt-1">
                <div className="flex items-center gap-1">
                  <Calendar size={12} />
                  <span>Posted: {formatDate(viewingJob.createdAt)}</span>
                </div>
                <div className="flex items-center gap-1 justify-end">
                  <Clock size={12} />
                  <span>Deadline: {formatDate(viewingJob.applicationDeadline)}</span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                <div>
                  {viewingJob.status === 'OPEN' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-rose-600 border-rose-200 hover:bg-rose-50"
                      onClick={() => {
                        const target = viewingJob;
                        setViewingJob(null);
                        setClosingJob(target);
                      }}
                    >
                      Force Close Job
                    </Button>
                  )}
                </div>
                <Button variant="outline" onClick={() => setViewingJob(null)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* Confirmation Modal for Force Closing Job */}
        <Modal
          isOpen={!!closingJob}
          onClose={() => setClosingJob(null)}
          title="Force-Close Job Posting"
          subtitle="Administrative intervention action"
          size="sm"
        >
          {closingJob && (
            <div className="space-y-4 pt-2">
              <p className="text-sm text-slate-600">
                Are you sure you want to administratively close the posting for{' '}
                <strong className="text-slate-900 font-semibold">{closingJob.title}</strong> by{' '}
                <span className="text-slate-800">{closingJob.company?.name || 'employer'}</span>?
              </p>

              <div className="p-3 rounded-lg bg-rose-50 border border-rose-100 text-xs text-rose-800">
                Once closed, candidates will no longer be able to submit applications. Existing applicant records will remain accessible for audit.
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setClosingJob(null)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  variant="error"
                  onClick={handleConfirmClose}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Closing...' : 'Force Close'}
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default AdminJobsPage;
