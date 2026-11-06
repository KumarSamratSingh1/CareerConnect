import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  Users,
  Calendar,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  FileText,
  Phone,
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
import {
  recruiterApplicationService,
  recruiterJobService,
  recruiterInterviewService,
} from '../../api';

const STATUS_FILTER_OPTIONS = [
  { value: 'ALL', label: 'All Application Statuses' },
  { value: 'APPLIED', label: 'Applied' },
  { value: 'UNDER_REVIEW', label: 'Under Review' },
  { value: 'SHORTLISTED', label: 'Shortlisted' },
  { value: 'INTERVIEW_SCHEDULED', label: 'Interview Scheduled' },
  { value: 'SELECTED', label: 'Selected' },
  { value: 'REJECTED', label: 'Rejected' },
];

/**
 * Returns allowed next statuses strictly enforcing backend business rules:
 * APPLIED -> UNDER_REVIEW, REJECTED
 * UNDER_REVIEW -> SHORTLISTED, REJECTED
 * SHORTLISTED -> INTERVIEW_SCHEDULED, SELECTED, REJECTED
 * INTERVIEW_SCHEDULED -> SELECTED, REJECTED
 * SELECTED, REJECTED, WITHDRAWN -> None
 */
const getAllowedStatusTransitions = (currentStatus) => {
  switch (currentStatus) {
    case 'APPLIED':
      return ['UNDER_REVIEW', 'REJECTED'];
    case 'UNDER_REVIEW':
      return ['SHORTLISTED', 'REJECTED'];
    case 'SHORTLISTED':
      return ['INTERVIEW_SCHEDULED', 'SELECTED', 'REJECTED'];
    case 'INTERVIEW_SCHEDULED':
      return ['SELECTED', 'REJECTED'];
    default:
      return [];
  }
};

export const RecruiterApplicationsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useToast();
  const selectedJobId = searchParams.get('jobId') || 'ALL';

  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modals
  const [reviewApplication, setReviewApplication] = useState(null);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [scheduleModalApp, setScheduleModalApp] = useState(null);

  // Schedule Interview Form State
  const [scheduleForm, setScheduleForm] = useState({
    scheduledDateTime: '',
    interviewMode: 'ONLINE',
    meetingLink: '',
    location: '',
    notes: '',
  });
  const [scheduleErrors, setScheduleErrors] = useState({});
  const [isScheduling, setIsScheduling] = useState(false);

  // Load recruiter's jobs for the job filter dropdown
  useEffect(() => {
    let isCancelled = false;

    const fetchJobs = async () => {
      try {
        const res = await recruiterJobService.getMyJobs({ page: 0, size: 50 });
        if (isCancelled) return;
        if (res.success && res.data) {
          setJobs(res.data.content || []);
        }
      } catch (err) {
        console.error('Failed to load jobs list for filter', err);
      }
    };

    fetchJobs();
    return () => {
      isCancelled = true;
    };
  }, []);

  // Load applications
  useEffect(() => {
    let isCancelled = false;

    const fetchApplications = async () => {
      try {
        if (selectedJobId && selectedJobId !== 'ALL') {
          // Fetch applications for specific job
          const res = await recruiterApplicationService.getJobApplications(selectedJobId, {
            page: currentPage - 1,
            size: 15,
            sort: 'appliedAt,desc',
          });

          if (isCancelled) return;
          if (res.success && res.data) {
            setApplications(res.data.content || []);
            setTotalPages(res.data.totalPages || 1);
          }
        } else {
          // When 'ALL' jobs is selected, fetch applications for all recruiter's jobs
          let myJobs = jobs;
          if (myJobs.length === 0) {
            const jobRes = await recruiterJobService.getMyJobs({ page: 0, size: 50 });
            if (isCancelled) return;
            myJobs = jobRes.data?.content || [];
            setJobs(myJobs);
          }

          if (myJobs.length === 0) {
            if (isCancelled) return;
            setApplications([]);
            return;
          }

          const appPromises = myJobs.slice(0, 10).map((j) =>
            recruiterApplicationService
              .getJobApplications(j.id, { page: 0, size: 20 })
              .catch(() => ({ success: false, data: { content: [] } }))
          );
          const results = await Promise.all(appPromises);
          if (isCancelled) return;
          const allApps = results.flatMap((r) => r.data?.content || []);
          setApplications(allApps);
          setTotalPages(1);
        }
      } catch (err) {
        if (isCancelled) return;
        setError(err.response?.data?.message || err.message || 'Failed to load applications.');
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
  }, [selectedJobId, currentPage, refreshKey, jobs]);

  const handleJobFilterChange = (val) => {
    setIsLoading(true);
    setCurrentPage(1);
    const nextParams = new URLSearchParams(searchParams);
    if (val === 'ALL') {
      nextParams.delete('jobId');
    } else {
      nextParams.set('jobId', val);
    }
    setSearchParams(nextParams, { replace: true });
  };

  // Frontend filtering by applicant name / email / keyword & status
  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      const matchesStatus =
        statusFilter === 'ALL' || (app.status && app.status.toUpperCase() === statusFilter);

      const q = searchKeyword.trim().toLowerCase();
      const candidateName = app.candidate?.fullName?.toLowerCase() || '';
      const jobTitle = app.job?.title?.toLowerCase() || '';
      const matchesKeyword =
        !q || candidateName.includes(q) || jobTitle.includes(q);

      return matchesStatus && matchesKeyword;
    });
  }, [applications, statusFilter, searchKeyword]);

  // Open candidate details
  const handleOpenReview = async (app) => {
    try {
      // Fetch fresh details with candidate info and statusHistory
      const res = await recruiterApplicationService.getApplication(app.id);
      if (res.success && res.data) {
        setReviewApplication(res.data);
      } else {
        setReviewApplication(app);
      }
    } catch {
      setReviewApplication(app);
    }
  };

  // Update Status Action
  const handleUpdateStatus = async (newStatus) => {
    if (!reviewApplication) return;
    setStatusUpdating(true);
    setError(null);
    try {
      const res = await recruiterApplicationService.updateApplicationStatus(
        reviewApplication.id,
        newStatus
      );
      if (res.success && res.data) {
        setReviewApplication(res.data);
        const msg = `Candidate application status advanced to "${newStatus.replace('_', ' ')}".`;
        setSuccessMessage(msg);
        toast.success(msg);
        setIsLoading(true);
        setRefreshKey((k) => k + 1);
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Failed to update application status.';
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setStatusUpdating(false);
    }
  };

  // Open Schedule Interview
  const handleOpenScheduleModal = (app) => {
    setScheduleModalApp(app);
    setScheduleForm({
      scheduledDateTime: '',
      interviewMode: 'ONLINE',
      meetingLink: '',
      location: '',
      notes: '',
    });
    setScheduleErrors({});
  };

  const validateScheduleForm = () => {
    const errors = {};
    if (!scheduleForm.scheduledDateTime) {
      errors.scheduledDateTime = 'Interview date and time is required';
    } else {
      const selected = new Date(scheduleForm.scheduledDateTime);
      if (selected <= new Date()) {
        errors.scheduledDateTime = 'Interview time must be set in the future';
      }
    }

    if (!scheduleForm.interviewMode) {
      errors.interviewMode = 'Interview mode is required';
    }

    if (scheduleForm.interviewMode === 'ONLINE') {
      if (!scheduleForm.meetingLink?.trim()) {
        errors.meetingLink = 'Meeting link is required for online video interviews';
      } else if (scheduleForm.meetingLink.trim().length > 500) {
        errors.meetingLink = 'Meeting link cannot exceed 500 characters';
      }
    }

    if (scheduleForm.interviewMode === 'OFFLINE') {
      if (!scheduleForm.location?.trim()) {
        errors.location = 'Physical location is required for in-person interviews';
      } else if (scheduleForm.location.trim().length > 255) {
        errors.location = 'Location cannot exceed 255 characters';
      }
    }

    if (scheduleForm.notes && scheduleForm.notes.length > 2000) {
      errors.notes = 'Notes cannot exceed 2000 characters';
    }

    setScheduleErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    if (!validateScheduleForm() || !scheduleModalApp) return;

    setIsScheduling(true);
    setError(null);
    try {
      const payload = {
        scheduledDateTime: scheduleForm.scheduledDateTime,
        interviewMode: scheduleForm.interviewMode,
        meetingLink:
          scheduleForm.interviewMode === 'ONLINE' ? scheduleForm.meetingLink.trim() : null,
        location:
          scheduleForm.interviewMode === 'OFFLINE' ? scheduleForm.location.trim() : null,
        notes: scheduleForm.notes?.trim() || null,
      };

      const res = await recruiterInterviewService.scheduleInterview(
        scheduleModalApp.id,
        payload
      );

      if (res.success) {
        const msg = `Interview scheduled successfully for ${scheduleModalApp.candidate?.fullName || 'candidate'}.`;
        setSuccessMessage(msg);
        toast.success(msg);
        setScheduleModalApp(null);
        if (reviewApplication?.id === scheduleModalApp.id) {
          // Re-fetch application to get updated status (INTERVIEW_SCHEDULED)
          const updated = await recruiterApplicationService.getApplication(scheduleModalApp.id);
          if (updated.success) setReviewApplication(updated.data);
        }
        setIsLoading(true);
        setRefreshKey((k) => k + 1);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || 'Failed to schedule interview session.'
      );
    } finally {
      setIsScheduling(false);
    }
  };

  return (
    <DashboardLayout
      role="recruiter"
      title="Candidate Applications"
      breadcrumb="Recruiter Hub / Applications"
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

        {/* Filters Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <Input
              placeholder="Search candidate name or role..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              leftIcon={<Search size={16} />}
            />
          </div>

          <div>
            <Select
              value={selectedJobId}
              onChange={handleJobFilterChange}
              options={[
                { value: 'ALL', label: 'All Jobs Postings' },
                ...jobs.map((j) => ({
                  value: String(j.id),
                  label: `${j.title} (${j.status})`,
                })),
              ]}
            />
          </div>

          <div>
            <Select
              value={statusFilter}
              onChange={(val) => setStatusFilter(val)}
              options={STATUS_FILTER_OPTIONS}
            />
          </div>
        </div>

        {/* Applications Table Card */}
        <Card>
          <Card.Body noPadding>
            {isLoading ? (
              <div className="p-12">
                <LoadingSpinner center text="Loading candidate applications..." />
              </div>
            ) : filteredApplications.length === 0 ? (
              <div className="p-8">
                <EmptyState
                  icon={<Users size={36} />}
                  title={
                    searchKeyword || statusFilter !== 'ALL'
                      ? 'No matching applicants'
                      : 'No Applications Received Yet'
                  }
                  description={
                    searchKeyword || statusFilter !== 'ALL'
                      ? 'Try adjusting your status or search keyword filters.'
                      : 'As candidates discover your active job postings, their profiles and resumes will appear here.'
                  }
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      <th className="p-4">Candidate</th>
                      <th className="p-4">Applied Role</th>
                      <th className="p-4">Applied Date</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {filteredApplications.map((app) => {
                      const candidateName =
                        app.candidate?.fullName || 'Registered Candidate';

                      return (
                        <tr key={app.id} className="hover:bg-slate-50/75 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                                {candidateName.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <span
                                  className="font-semibold text-slate-900 hover:text-indigo-600 cursor-pointer block"
                                  onClick={() => handleOpenReview(app)}
                                >
                                  {candidateName}
                                </span>
                                {app.candidate?.phone && (
                                  <span className="text-xs text-slate-400 block">
                                    {app.candidate.phone}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="p-4">
                            <span className="font-medium text-slate-800 block">
                              {app.job?.title || 'Job Opening'}
                            </span>
                            <span className="text-xs text-slate-400">
                              {app.job?.location}
                            </span>
                          </td>

                          <td className="p-4 text-slate-500 text-xs">
                            {app.appliedAt
                              ? new Date(app.appliedAt).toLocaleDateString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })
                              : 'Recent'}
                          </td>

                          <td className="p-4">
                            <Badge status={app.status} hasDot />
                          </td>

                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {/* Schedule interview button for shortlisted candidates */}
                              {(app.status === 'SHORTLISTED' ||
                                app.status === 'INTERVIEW_SCHEDULED') && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  title="Schedule Interview Session"
                                  className="text-indigo-600 hover:bg-indigo-50"
                                  onClick={() => handleOpenScheduleModal(app)}
                                >
                                  <Calendar size={15} />
                                </Button>
                              )}

                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenReview(app)}
                              >
                                Review Candidate
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
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
                onPageChange={(p) => setCurrentPage(p)}
              />
            </div>
          )}
        </Card>

        {/* Candidate Application Detail Review Modal */}
        <Modal
          isOpen={Boolean(reviewApplication)}
          onClose={() => setReviewApplication(null)}
          title={
            reviewApplication?.candidate?.fullName || 'Candidate Application'
          }
          subtitle={`Applying for: ${reviewApplication?.job?.title || 'Role'} • Applied on ${
            reviewApplication?.appliedAt
              ? new Date(reviewApplication.appliedAt).toLocaleDateString()
              : ''
          }`}
          size="lg"
        >
          {reviewApplication && (
            <div className="space-y-6 pt-2">
              {/* Status & Next Transition Bar */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-semibold uppercase">
                    Current Status:
                  </span>
                  <Badge status={reviewApplication.status} hasDot />
                </div>

                {/* Available Status Actions */}
                <div className="flex flex-wrap items-center gap-2">
                  {getAllowedStatusTransitions(reviewApplication.status).map((st) => (
                    <Button
                      key={st}
                      size="sm"
                      variant={
                        st === 'REJECTED'
                          ? 'outline'
                          : st === 'SELECTED'
                          ? 'primary'
                          : 'outline'
                      }
                      disabled={statusUpdating}
                      onClick={() => handleUpdateStatus(st)}
                    >
                      Move to {st.replace('_', ' ')}
                    </Button>
                  ))}

                  {(reviewApplication.status === 'SHORTLISTED' ||
                    reviewApplication.status === 'INTERVIEW_SCHEDULED') && (
                    <Button
                      size="sm"
                      variant="primary"
                      leftIcon={<Calendar size={14} />}
                      onClick={() => handleOpenScheduleModal(reviewApplication)}
                    >
                      Schedule Interview
                    </Button>
                  )}

                  {getAllowedStatusTransitions(reviewApplication.status).length === 0 && (
                    <span className="text-xs text-slate-400 italic">
                      This application has reached a terminal status ({reviewApplication.status}).
                    </span>
                  )}
                </div>
              </div>

              {/* Contact & Resume Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg border border-slate-100 bg-white flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Phone size={14} className="text-slate-400" /> Phone Number:
                  </span>
                  <span className="font-semibold text-slate-800">
                    {reviewApplication.candidate?.phone || 'Not provided'}
                  </span>
                </div>

                <div className="p-3 rounded-lg border border-slate-100 bg-white flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <FileText size={14} className="text-slate-400" /> Resume / CV:
                  </span>
                  {reviewApplication.candidate?.resumeUrl ? (
                    <a
                      href={reviewApplication.candidate.resumeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 hover:underline"
                    >
                      View Document <ExternalLink size={12} />
                    </a>
                  ) : (
                    <span className="text-slate-400 italic">No document link</span>
                  )}
                </div>
              </div>

              {/* Cover Letter */}
              <div>
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Applicant Cover Letter / Note
                </h4>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                  {reviewApplication.coverLetter || (
                    <span className="text-slate-400 italic">
                      No customized cover letter was submitted with this application.
                    </span>
                  )}
                </div>
              </div>

              {/* Candidate Skills */}
              <div>
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Demonstrated Competencies & Skills
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {reviewApplication.candidate?.skills?.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 text-xs font-medium border border-indigo-100"
                    >
                      {skill.name}
                    </span>
                  ))}
                  {(!reviewApplication.candidate?.skills ||
                    reviewApplication.candidate.skills.length === 0) && (
                    <span className="text-xs text-slate-400 italic">
                      No skills highlighted in profile.
                    </span>
                  )}
                </div>
              </div>

              {/* Candidate Work Experience */}
              {reviewApplication.candidate?.experiences?.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Professional Experience
                  </h4>
                  <div className="space-y-2">
                    {reviewApplication.candidate.experiences.map((exp) => (
                      <div
                        key={exp.id}
                        className="p-3 rounded-lg border border-slate-100 bg-slate-50 text-xs"
                      >
                        <div className="flex items-center justify-between font-semibold text-slate-800">
                          <span>{exp.jobTitle}</span>
                          <span className="text-slate-500 font-normal">
                            {exp.companyName}
                          </span>
                        </div>
                        {exp.description && (
                          <p className="text-slate-600 mt-1 text-[11px] leading-relaxed">
                            {exp.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Candidate Education */}
              {reviewApplication.candidate?.educations?.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Education
                  </h4>
                  <div className="space-y-2">
                    {reviewApplication.candidate.educations.map((edu) => (
                      <div
                        key={edu.id}
                        className="p-3 rounded-lg border border-slate-100 bg-slate-50 text-xs flex justify-between items-center"
                      >
                        <div>
                          <span className="font-semibold text-slate-800 block">
                            {edu.degree} {edu.fieldOfStudy ? `in ${edu.fieldOfStudy}` : ''}
                          </span>
                          <span className="text-slate-500">{edu.institution}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Status History Timeline */}
              {reviewApplication.statusHistory?.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Application Lifecycle Timeline
                  </h4>
                  <div className="space-y-2">
                    {reviewApplication.statusHistory.map((hist, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-slate-50 border border-slate-100"
                      >
                        <Badge status={hist.status} hasDot />
                        <span className="text-slate-400 text-[11px]">
                          {new Date(hist.changedAt).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setReviewApplication(null)}
                >
                  Close Review
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* Schedule Interview Modal */}
        <Modal
          isOpen={Boolean(scheduleModalApp)}
          onClose={() => setScheduleModalApp(null)}
          title={`Schedule Interview: ${
            scheduleModalApp?.candidate?.fullName || 'Candidate'
          }`}
          subtitle={`Role: ${scheduleModalApp?.job?.title || 'Job Opening'}`}
          size="md"
        >
          <form onSubmit={handleScheduleSubmit} className="space-y-4 pt-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">
                Scheduled Date & Time <span className="text-rose-500">*</span>
              </label>
              <Input
                type="datetime-local"
                value={scheduleForm.scheduledDateTime}
                onChange={(e) =>
                  setScheduleForm((p) => ({ ...p, scheduledDateTime: e.target.value }))
                }
                error={scheduleErrors.scheduledDateTime}
                required
              />
              <span className="text-[11px] text-slate-400">
                Must be scheduled for a future time slot.
              </span>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">
                Interview Delivery Mode <span className="text-rose-500">*</span>
              </label>
              <Select
                value={scheduleForm.interviewMode}
                onChange={(val) =>
                  setScheduleForm((p) => ({ ...p, interviewMode: val }))
                }
                options={[
                  { value: 'ONLINE', label: 'Online Video Conference' },
                  { value: 'OFFLINE', label: 'In-Person / On-Site' },
                  { value: 'PHONE', label: 'Telephone Screening' },
                ]}
              />
            </div>

            {scheduleForm.interviewMode === 'ONLINE' && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  Video Conference Meeting Link <span className="text-rose-500">*</span>
                </label>
                <Input
                  placeholder="e.g. https://meet.google.com/xyz or Zoom URL"
                  value={scheduleForm.meetingLink}
                  onChange={(e) =>
                    setScheduleForm((p) => ({ ...p, meetingLink: e.target.value }))
                  }
                  error={scheduleErrors.meetingLink}
                  required
                  maxLength={500}
                />
              </div>
            )}

            {scheduleForm.interviewMode === 'OFFLINE' && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  Office / Room Location <span className="text-rose-500">*</span>
                </label>
                <Input
                  placeholder="e.g. Building 4, Floor 2, Conference Room B"
                  value={scheduleForm.location}
                  onChange={(e) =>
                    setScheduleForm((p) => ({ ...p, location: e.target.value }))
                  }
                  error={scheduleErrors.location}
                  required
                  maxLength={255}
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">
                Interviewer Notes & Preparation Instructions
              </label>
              <textarea
                rows={3}
                className="w-full rounded-lg border border-slate-200 p-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                placeholder="Topics to assess, coding round requirements, or interviewer instructions..."
                value={scheduleForm.notes}
                onChange={(e) =>
                  setScheduleForm((p) => ({ ...p, notes: e.target.value }))
                }
                maxLength={2000}
              />
              {scheduleErrors.notes && (
                <span className="text-xs text-rose-600 block">
                  {scheduleErrors.notes}
                </span>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setScheduleModalApp(null)}
                disabled={isScheduling}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isScheduling}>
                {isScheduling ? 'Scheduling...' : 'Confirm Schedule'}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default RecruiterApplicationsPage;
