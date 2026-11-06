import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Plus,
  Search,
  Edit2,
  XCircle,
  Eye,
  Building2,
  MapPin,
  Calendar,
  Briefcase,
  Clock,
  Tag,
  AlertCircle,
  CheckCircle2,
  Users,
  X,
  ArrowRight,
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
import { recruiterJobService, companyService } from '../../api';

const JOB_TYPE_OPTIONS = [
  { value: 'JOB', label: 'Regular Job' },
  { value: 'INTERNSHIP', label: 'Internship' },
];

const EMPLOYMENT_TYPE_OPTIONS = [
  { value: 'FULL_TIME', label: 'Full-Time' },
  { value: 'PART_TIME', label: 'Part-Time' },
  { value: 'CONTRACT', label: 'Contract' },
  { value: 'INTERNSHIP', label: 'Internship' },
];

const STATUS_FILTER_OPTIONS = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'OPEN', label: 'Open Jobs' },
  { value: 'CLOSED', label: 'Closed Jobs' },
];

export const RecruiterJobsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useToast();
  const [jobs, setJobs] = useState([]);
  const [hasCompany, setHasCompany] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Pagination & Filtering
  const [searchKeyword, setSearchKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  // Modals & Refresh
  const [createModalOpen, setCreateModalOpen] = useState(
    () => searchParams.get('action') === 'create'
  );
  const [editingJob, setEditingJob] = useState(null);
  const [viewingJob, setViewingJob] = useState(null);
  const [closingJob, setClosingJob] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Form State
  const initialFormState = {
    title: '',
    description: '',
    location: '',
    jobType: 'JOB',
    employmentType: 'FULL_TIME',
    minSalary: '',
    maxSalary: '',
    minExperience: '',
    applicationDeadline: '',
    duration: '',
    requiredSkills: [],
  };
  const [formData, setFormData] = useState(initialFormState);
  const [formErrors, setFormErrors] = useState({});
  const [skillInput, setSkillInput] = useState('');

  // Form Management
  const resetForm = () => {
    setFormData(initialFormState);
    setFormErrors({});
    setSkillInput('');
    setEditingJob(null);
  };

  const handleCloseCreateModal = () => {
    setCreateModalOpen(false);
    resetForm();
    if (searchParams.get('action')) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('action');
      setSearchParams(nextParams, { replace: true });
    }
  };

  useEffect(() => {
    let isCancelled = false;

    const fetchJobs = async () => {
      try {
        // Check company existence first
        try {
          await companyService.getMyCompany();
          if (isCancelled) return;
          setHasCompany(true);
        } catch (compErr) {
          if (isCancelled) return;
          if (compErr.response?.status === 404) {
            setHasCompany(false);
            setJobs([]);
            setIsLoading(false);
            return;
          }
        }

        const res = await recruiterJobService.getMyJobs({
          page: currentPage - 1,
          size: 10,
          sort: 'createdAt,desc',
        });

        if (isCancelled) return;
        if (res.success && res.data) {
          setJobs(res.data.content || []);
          setTotalPages(res.data.totalPages || 1);
          setTotalElements(res.data.totalElements || 0);
        }
      } catch (err) {
        if (isCancelled) return;
        setError(err.response?.data?.message || err.message || 'Failed to load jobs.');
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
  }, [currentPage, refreshKey]);

  // Frontend filtering by keyword & status
  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const matchesStatus =
        statusFilter === 'ALL' || (job.status && job.status.toUpperCase() === statusFilter);

      const q = searchKeyword.trim().toLowerCase();
      const matchesKeyword =
        !q ||
        job.title?.toLowerCase().includes(q) ||
        job.location?.toLowerCase().includes(q) ||
        job.description?.toLowerCase().includes(q);

      return matchesStatus && matchesKeyword;
    });
  }, [jobs, statusFilter, searchKeyword]);

  // Metric stats
  const stats = useMemo(() => {
    const total = totalElements || jobs.length;
    const open = jobs.filter((j) => j.status === 'OPEN').length;
    const closed = jobs.filter((j) => j.status === 'CLOSED').length;
    return { total, open, closed };
  }, [jobs, totalElements]);

  const handleOpenCreate = () => {
    resetForm();
    setCreateModalOpen(true);
  };

  const handleOpenEdit = (job) => {
    setEditingJob(job);
    setFormData({
      title: job.title || '',
      description: job.description || '',
      location: job.location || '',
      jobType: job.jobType || 'JOB',
      employmentType: job.employmentType || 'FULL_TIME',
      minSalary: job.minSalary != null ? String(job.minSalary) : '',
      maxSalary: job.maxSalary != null ? String(job.maxSalary) : '',
      minExperience: job.minExperience != null ? String(job.minExperience) : '',
      applicationDeadline: job.applicationDeadline || '',
      duration: job.duration || '',
      requiredSkills: Array.isArray(job.requiredSkills)
        ? job.requiredSkills.map((s) => (typeof s === 'string' ? s : s.name))
        : [],
    });
    setFormErrors({});
    setSkillInput('');
    setCreateModalOpen(true);
  };

  const handleAddSkill = () => {
    const trimmed = skillInput.trim();
    if (!trimmed) return;
    if (formData.requiredSkills.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      setSkillInput('');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      requiredSkills: [...prev.requiredSkills, trimmed],
    }));
    setSkillInput('');
  };

  const handleRemoveSkill = (skillToRemove) => {
    setFormData((prev) => ({
      ...prev,
      requiredSkills: prev.requiredSkills.filter((s) => s !== skillToRemove),
    }));
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.title?.trim()) {
      errors.title = 'Job title must not be blank';
    } else if (formData.title.trim().length > 200) {
      errors.title = 'Job title must not exceed 200 characters';
    }

    if (!formData.description?.trim()) {
      errors.description = 'Job description must not be blank';
    } else if (formData.description.trim().length > 5000) {
      errors.description = 'Job description must not exceed 5000 characters';
    }

    if (!formData.location?.trim()) {
      errors.location = 'Work location must not be blank';
    } else if (formData.location.trim().length > 150) {
      errors.location = 'Location must not exceed 150 characters';
    }

    if (!formData.jobType) {
      errors.jobType = 'Job type is required';
    }

    if (!formData.employmentType) {
      errors.employmentType = 'Employment type is required';
    }

    if (formData.jobType === 'INTERNSHIP') {
      if (!formData.duration?.trim()) {
        errors.duration = 'Duration is required for internships (e.g. 3 months, 6 months)';
      } else if (formData.duration.trim().length > 50) {
        errors.duration = 'Duration must not exceed 50 characters';
      }
    }

    const minSal = formData.minSalary !== '' ? Number(formData.minSalary) : null;
    const maxSal = formData.maxSalary !== '' ? Number(formData.maxSalary) : null;

    if (minSal != null) {
      if (isNaN(minSal) || minSal < 0) errors.minSalary = 'Minimum salary cannot be negative';
    }
    if (maxSal != null) {
      if (isNaN(maxSal) || maxSal < 0) errors.maxSalary = 'Maximum salary cannot be negative';
    }
    if (minSal != null && maxSal != null && minSal > maxSal) {
      errors.maxSalary = 'Maximum salary must be greater than or equal to minimum salary';
    }

    if (formData.minExperience !== '') {
      const exp = Number(formData.minExperience);
      if (isNaN(exp) || exp < 0) errors.minExperience = 'Experience cannot be negative';
    }

    if (formData.applicationDeadline) {
      const selected = new Date(formData.applicationDeadline);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selected < today) {
        errors.applicationDeadline = 'Application deadline cannot be in the past';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        location: formData.location.trim(),
        jobType: formData.jobType,
        employmentType: formData.employmentType,
        minSalary: formData.minSalary !== '' ? Number(formData.minSalary) : null,
        maxSalary: formData.maxSalary !== '' ? Number(formData.maxSalary) : null,
        minExperience: formData.minExperience !== '' ? Number(formData.minExperience) : null,
        applicationDeadline: formData.applicationDeadline || null,
        duration: formData.jobType === 'INTERNSHIP' ? formData.duration.trim() : null,
        requiredSkills: formData.requiredSkills,
      };

      if (editingJob) {
        const res = await recruiterJobService.updateJob(editingJob.id, payload);
        if (res.success) {
          setSuccessMessage(`Job "${payload.title}" updated successfully.`);
          toast.success(`Job "${payload.title}" updated successfully.`);
          handleCloseCreateModal();
          setIsLoading(true);
          setRefreshKey((k) => k + 1);
        }
      } else {
        const res = await recruiterJobService.createJob(payload);
        if (res.success) {
          setSuccessMessage(`Job "${payload.title}" created successfully and published as OPEN.`);
          toast.success(`Job "${payload.title}" published successfully!`);
          handleCloseCreateModal();
          setIsLoading(true);
          setRefreshKey((k) => k + 1);
        }
      }
    } catch (err) {
      const backendMessage = err.response?.data?.message;
      const validationData = err.response?.data?.data;
      if (validationData && typeof validationData === 'object') {
        setFormErrors(validationData);
      } else {
        setError(backendMessage || err.message || 'Failed to save job posting.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Close Job Action
  const handleConfirmClose = async () => {
    if (!closingJob) return;
    setIsSubmitting(true);
    try {
      const res = await recruiterJobService.closeJob(closingJob.id);
      if (res.success) {
        setSuccessMessage(`Job "${closingJob.title}" has been closed.`);
        toast.info(`Job "${closingJob.title}" has been closed.`);
        setClosingJob(null);
        setIsLoading(true);
        setRefreshKey((k) => k + 1);
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Failed to close job.';
      setError(errMsg);
      toast.error(errMsg);
      setClosingJob(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout
      role="recruiter"
      title="Manage Job Postings"
      breadcrumb="Recruiter Hub / Job Postings"
    >
      <div className="space-y-6">
        {/* Success Alert */}
        {successMessage && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={18} className="text-emerald-600 flex-shrink-0" />
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
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2">
            <AlertCircle size={18} className="text-rose-600 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Company Pre-requisite Warning */}
        {!hasCompany && (
          <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <Building2 size={24} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm">Company Registration Required</h4>
                <p className="text-xs text-amber-700 mt-0.5">
                  Before publishing vacancies, your organization profile must be configured in the system.
                </p>
              </div>
            </div>
            <Link to="/recruiter/company">
              <Button size="sm" variant="primary" leftIcon={<ArrowRight size={14} />}>
                Configure Company Profile
              </Button>
            </Link>
          </div>
        )}

        {/* Header Action & Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <Card.Body>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400 font-medium uppercase">Total Postings</p>
                  <h3 className="text-2xl font-bold text-slate-800 mt-1">{stats.total}</h3>
                </div>
                <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600">
                  <Briefcase size={20} />
                </div>
              </div>
            </Card.Body>
          </Card>

          <Card>
            <Card.Body>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400 font-medium uppercase">Active (Open)</p>
                  <h3 className="text-2xl font-bold text-emerald-600 mt-1">{stats.open}</h3>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
                  <CheckCircle2 size={20} />
                </div>
              </div>
            </Card.Body>
          </Card>

          <Card>
            <Card.Body>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400 font-medium uppercase">Closed</p>
                  <h3 className="text-2xl font-bold text-slate-500 mt-1">{stats.closed}</h3>
                </div>
                <div className="p-3 rounded-xl bg-slate-100 text-slate-600">
                  <XCircle size={20} />
                </div>
              </div>
            </Card.Body>
          </Card>
        </div>

        {/* Filter Bar & Create Button */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <div className="w-full sm:w-64">
              <Input
                placeholder="Search title, location..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                leftIcon={<Search size={16} />}
              />
            </div>
            <div className="w-full sm:w-44">
              <Select
                value={statusFilter}
                onChange={(val) => setStatusFilter(val)}
                options={STATUS_FILTER_OPTIONS}
              />
            </div>
          </div>

          <Button
            onClick={handleOpenCreate}
            disabled={!hasCompany}
            leftIcon={<Plus size={16} />}
            className="w-full sm:w-auto flex-shrink-0"
          >
            Post New Job
          </Button>
        </div>

        {/* Jobs Table Card */}
        <Card>
          <Card.Body noPadding>
            {isLoading ? (
              <div className="p-12">
                <LoadingSpinner center text="Loading recruiter vacancies..." />
              </div>
            ) : filteredJobs.length === 0 ? (
              <div className="p-8">
                <EmptyState
                  icon={<Briefcase size={36} />}
                  title={
                    searchKeyword || statusFilter !== 'ALL'
                      ? 'No matching jobs found'
                      : 'No Job Postings Yet'
                  }
                  description={
                    searchKeyword || statusFilter !== 'ALL'
                      ? 'Try clearing your filters or search keywords to view other vacancies.'
                      : hasCompany
                      ? 'Publish your first opening to attract qualified applicants from the talent pool.'
                      : 'Please set up your company profile before publishing vacancies.'
                  }
                  action={
                    hasCompany &&
                    !searchKeyword &&
                    statusFilter === 'ALL' && (
                      <Button onClick={handleOpenCreate} leftIcon={<Plus size={16} />}>
                        Post First Job
                      </Button>
                    )
                  }
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      <th className="p-4">Job Title & Type</th>
                      <th className="p-4">Location</th>
                      <th className="p-4">Salary / Duration</th>
                      <th className="p-4">Deadline</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {filteredJobs.map((job) => (
                      <tr key={job.id} className="hover:bg-slate-50/75 transition-colors">
                        <td className="p-4">
                          <div>
                            <span className="font-semibold text-slate-900 hover:text-indigo-600 cursor-pointer" onClick={() => setViewingJob(job)}>
                              {job.title}
                            </span>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                                {job.jobType}
                              </span>
                              <span className="text-[11px] text-slate-500">
                                {job.employmentType?.replace('_', ' ')}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="p-4 text-slate-600">
                          <span className="flex items-center gap-1">
                            <MapPin size={13} className="text-slate-400" />
                            {job.location}
                          </span>
                        </td>

                        <td className="p-4 text-slate-600 text-xs">
                          {job.jobType === 'INTERNSHIP' ? (
                            <span className="flex items-center gap-1 text-slate-700 font-medium">
                              <Clock size={12} className="text-slate-400" />
                              {job.duration || 'Duration TBD'}
                            </span>
                          ) : job.minSalary || job.maxSalary ? (
                            <span className="text-slate-700 font-medium">
                              ${job.minSalary?.toLocaleString()} - ${job.maxSalary?.toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Unspecified</span>
                          )}
                        </td>

                        <td className="p-4 text-slate-600 text-xs">
                          {job.applicationDeadline ? (
                            <span className="flex items-center gap-1">
                              <Calendar size={12} className="text-slate-400" />
                              {new Date(job.applicationDeadline).toLocaleDateString()}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">No deadline</span>
                          )}
                        </td>

                        <td className="p-4">
                          <Badge status={job.status} hasDot />
                        </td>

                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {/* View Applications */}
                            <Link to={`/recruiter/applications?jobId=${job.id}`}>
                              <Button variant="ghost" size="sm" title="View Applications">
                                <Users size={15} />
                              </Button>
                            </Link>

                            {/* View Details */}
                            <Button
                              variant="ghost"
                              size="sm"
                              title="View Details"
                              onClick={() => setViewingJob(job)}
                            >
                              <Eye size={15} />
                            </Button>

                            {/* Edit */}
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Edit Job"
                              onClick={() => handleOpenEdit(job)}
                            >
                              <Edit2 size={15} />
                            </Button>

                            {/* Close Job */}
                            {job.status === 'OPEN' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                title="Close Job"
                                className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                                onClick={() => setClosingJob(job)}
                              >
                                <XCircle size={15} />
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

          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-100 flex justify-end">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => setCurrentPage(page)}
              />
            </div>
          )}
        </Card>

        {/* Create / Edit Modal */}
        <Modal
          isOpen={createModalOpen}
          onClose={handleCloseCreateModal}
          title={editingJob ? 'Edit Job Posting' : 'Create New Job Posting'}
          subtitle={
            editingJob
              ? 'Update role specifications and requirements'
              : 'Specify candidate requirements and publish to the candidate job portal'
          }
          size="lg"
        >
          <form onSubmit={handleFormSubmit} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-semibold text-slate-700">
                  Job Title <span className="text-rose-500">*</span>
                </label>
                <Input
                  placeholder="e.g. Senior Frontend Engineer"
                  value={formData.title}
                  onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                  error={formErrors.title}
                  required
                  maxLength={200}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  Job Classification <span className="text-rose-500">*</span>
                </label>
                <Select
                  value={formData.jobType}
                  onChange={(val) => setFormData((p) => ({ ...p, jobType: val }))}
                  options={JOB_TYPE_OPTIONS}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  Employment Type <span className="text-rose-500">*</span>
                </label>
                <Select
                  value={formData.employmentType}
                  onChange={(val) => setFormData((p) => ({ ...p, employmentType: val }))}
                  options={EMPLOYMENT_TYPE_OPTIONS}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  Location <span className="text-rose-500">*</span>
                </label>
                <Input
                  placeholder="e.g. Bangalore, India (Hybrid)"
                  value={formData.location}
                  onChange={(e) => setFormData((p) => ({ ...p, location: e.target.value }))}
                  error={formErrors.location}
                  required
                  maxLength={150}
                />
              </div>

              {/* Conditional Duration if INTERNSHIP */}
              {formData.jobType === 'INTERNSHIP' ? (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Internship Duration <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    placeholder="e.g. 3 Months / 6 Months"
                    value={formData.duration}
                    onChange={(e) => setFormData((p) => ({ ...p, duration: e.target.value }))}
                    error={formErrors.duration}
                    required
                    maxLength={50}
                  />
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Min Experience (Years)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="e.g. 3"
                    value={formData.minExperience}
                    onChange={(e) => setFormData((p) => ({ ...p, minExperience: e.target.value }))}
                    error={formErrors.minExperience}
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Minimum Salary ($)</label>
                <Input
                  type="number"
                  min="0"
                  placeholder="e.g. 60000"
                  value={formData.minSalary}
                  onChange={(e) => setFormData((p) => ({ ...p, minSalary: e.target.value }))}
                  error={formErrors.minSalary}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Maximum Salary ($)</label>
                <Input
                  type="number"
                  min="0"
                  placeholder="e.g. 90000"
                  value={formData.maxSalary}
                  onChange={(e) => setFormData((p) => ({ ...p, maxSalary: e.target.value }))}
                  error={formErrors.maxSalary}
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-semibold text-slate-700">Application Deadline</label>
                <Input
                  type="date"
                  value={formData.applicationDeadline}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, applicationDeadline: e.target.value }))
                  }
                  error={formErrors.applicationDeadline}
                />
                <span className="text-[11px] text-slate-400">
                  Open jobs automatically expire at midnight when this deadline passes.
                </span>
              </div>

              {/* Skills Tag Input */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-semibold text-slate-700">Required Skills</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Type skill and click Add (e.g. React, Java, Docker)"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSkill();
                      }
                    }}
                  />
                  <Button type="button" variant="outline" onClick={handleAddSkill}>
                    Add
                  </Button>
                </div>

                <div className="flex flex-wrap gap-1.5 mt-2">
                  {formData.requiredSkills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 text-xs font-medium border border-indigo-100"
                    >
                      <Tag size={11} /> {skill}
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        className="hover:text-indigo-900 ml-1"
                      >
                        <X size={13} />
                      </button>
                    </span>
                  ))}
                  {formData.requiredSkills.length === 0 && (
                    <span className="text-xs text-slate-400 italic">
                      No skills added yet. Candidate matching will use role title & description.
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-semibold text-slate-700">
                  Job Description & Qualifications <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={5}
                  className="w-full rounded-lg border border-slate-200 p-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                  placeholder="Detailed responsibilities, expectations, and benefits..."
                  value={formData.description}
                  onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                  required
                  maxLength={5000}
                />
                {formErrors.description && (
                  <span className="text-xs text-rose-600 block">{formErrors.description}</span>
                )}
                <span className="text-[11px] text-slate-400 block text-right">
                  {formData.description.length} / 5000 characters
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateModalOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Publishing...' : editingJob ? 'Save Changes' : 'Publish Job'}
              </Button>
            </div>
          </form>
        </Modal>

        {/* View Details Modal */}
        <Modal
          isOpen={Boolean(viewingJob)}
          onClose={() => setViewingJob(null)}
          title={viewingJob?.title || 'Job Details'}
          subtitle={`${viewingJob?.company?.name || 'Company'} • ${viewingJob?.location || ''}`}
          size="lg"
        >
          {viewingJob && (
            <div className="space-y-4 pt-2">
              <div className="flex flex-wrap gap-2 items-center">
                <Badge status={viewingJob.status} hasDot />
                <span className="text-xs font-semibold px-2.5 py-1 rounded bg-slate-100 text-slate-700">
                  {viewingJob.jobType}
                </span>
                <span className="text-xs font-semibold px-2.5 py-1 rounded bg-slate-100 text-slate-700">
                  {viewingJob.employmentType?.replace('_', ' ')}
                </span>
                {viewingJob.duration && (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded bg-amber-50 text-amber-700 border border-amber-200">
                    Duration: {viewingJob.duration}
                  </span>
                )}
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block uppercase font-medium">Compensation</span>
                  <span className="font-semibold text-slate-800 text-sm mt-0.5 block">
                    {viewingJob.minSalary || viewingJob.maxSalary
                      ? `$${viewingJob.minSalary?.toLocaleString()} - $${viewingJob.maxSalary?.toLocaleString()}`
                      : 'Not specified'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block uppercase font-medium">Min Experience</span>
                  <span className="font-semibold text-slate-800 text-sm mt-0.5 block">
                    {viewingJob.minExperience != null ? `${viewingJob.minExperience} Years` : 'Open'}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Required Competencies
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {viewingJob.requiredSkills?.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 text-xs font-medium border border-indigo-100"
                    >
                      {typeof skill === 'string' ? skill : skill.name}
                    </span>
                  ))}
                  {(!viewingJob.requiredSkills || viewingJob.requiredSkills.length === 0) && (
                    <span className="text-xs text-slate-400 italic">No specific skills listed.</span>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Job Description
                </h4>
                <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed bg-slate-50/75 p-4 rounded-xl border border-slate-100">
                  {viewingJob.description}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <Link to={`/recruiter/applications?jobId=${viewingJob.id}`}>
                  <Button variant="outline" size="sm" leftIcon={<Users size={15} />}>
                    View Applications for this Job
                  </Button>
                </Link>
                <Button variant="primary" size="sm" onClick={() => setViewingJob(null)}>
                  Close Details
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* Close Job Confirmation Modal */}
        <Modal
          isOpen={Boolean(closingJob)}
          onClose={() => setClosingJob(null)}
          title="Confirm Job Closure"
          subtitle="Are you sure you want to close this job posting?"
          size="sm"
          footer={
            <>
              <Button
                variant="outline"
                onClick={() => setClosingJob(null)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleConfirmClose}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Closing...' : 'Close Posting'}
              </Button>
            </>
          }
        >
          <div className="text-sm text-slate-600 space-y-2">
            <p>
              Closing <strong>&ldquo;{closingJob?.title}&rdquo;</strong> will transition its status from <strong>OPEN</strong> to <strong>CLOSED</strong>.
            </p>
            <p className="text-xs text-slate-500">
              Candidates will no longer be able to discover or submit new applications for this role. Existing applications remain preserved.
            </p>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default RecruiterJobsPage;
