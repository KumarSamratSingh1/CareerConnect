import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Video,
  MapPin,
  Phone,
  Plus,
  Edit2,
  CheckCircle,
  XCircle,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Building,
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
import {
  recruiterInterviewService,
  recruiterJobService,
  recruiterApplicationService,
} from '../../api';

const MODE_OPTIONS = [
  { value: 'ALL', label: 'All Modes' },
  { value: 'ONLINE', label: 'Online Video' },
  { value: 'OFFLINE', label: 'In-Person / On-Site' },
  { value: 'PHONE', label: 'Phone Call' },
];

export const RecruiterInterviewsPage = () => {
  const [interviews, setInterviews] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState('ALL');
  const [selectedMode, setSelectedMode] = useState('ALL');
  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' | 'all' | 'past'

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modals
  const [rescheduleInterview, setRescheduleInterview] = useState(null);
  const [confirmStatusAction, setConfirmStatusAction] = useState(null); // { interview, nextStatus: 'COMPLETED' | 'CANCELLED' }
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reschedule Form State
  const [rescheduleForm, setRescheduleForm] = useState({
    scheduledDateTime: '',
    interviewMode: 'ONLINE',
    meetingLink: '',
    location: '',
    notes: '',
  });
  const [rescheduleErrors, setRescheduleErrors] = useState({});

  // Schedule New Interview Modal (select shortlisted application)
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [shortlistedApps, setShortlistedApps] = useState([]);
  const [selectedAppId, setSelectedAppId] = useState('');
  const [newScheduleForm, setNewScheduleForm] = useState({
    scheduledDateTime: '',
    interviewMode: 'ONLINE',
    meetingLink: '',
    location: '',
    notes: '',
  });
  const [newScheduleErrors, setNewScheduleErrors] = useState({});

  // Fetch jobs for filter
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
        console.error('Failed to load recruiter jobs', err);
      }
    };
    fetchJobs();
    return () => {
      isCancelled = true;
    };
  }, []);

  // Fetch interviews
  useEffect(() => {
    let isCancelled = false;
    const fetchInterviews = async () => {
      try {
        const params = {
          page: currentPage - 1,
          size: 15,
          sort: 'scheduledDateTime,asc',
        };

        if (selectedMode !== 'ALL') params.mode = selectedMode;
        if (selectedJobId !== 'ALL') params.jobId = selectedJobId;

        const res = await recruiterInterviewService.getInterviews(params);
        if (isCancelled) return;
        if (res.success && res.data) {
          setInterviews(res.data.content || []);
          setTotalPages(res.data.totalPages || 1);
        }
      } catch (err) {
        if (isCancelled) return;
        setError(err.response?.data?.message || err.message || 'Failed to load interviews.');
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
  }, [currentPage, selectedMode, selectedJobId, refreshKey]);

  // Tab Filtering (Upcoming vs Past)
  const displayedInterviews = useMemo(() => {
    const now = new Date();
    return interviews.filter((item) => {
      if (activeTab === 'upcoming') {
        if (item.status === 'COMPLETED' || item.status === 'CANCELLED') return false;
        if (!item.scheduledDateTime) return true;
        return new Date(item.scheduledDateTime) >= now;
      }
      if (activeTab === 'past') {
        if (item.status === 'COMPLETED' || item.status === 'CANCELLED') return true;
        if (!item.scheduledDateTime) return false;
        return new Date(item.scheduledDateTime) < now;
      }
      return true; // 'all'
    });
  }, [interviews, activeTab]);

  // Reschedule Management
  const handleOpenReschedule = (interview) => {
    setRescheduleInterview(interview);
    // Format to YYYY-MM-DDTHH:mm for datetime-local input
    let formattedDate = '';
    if (interview.scheduledDateTime) {
      const d = new Date(interview.scheduledDateTime);
      formattedDate = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
    }

    setRescheduleForm({
      scheduledDateTime: formattedDate,
      interviewMode: interview.interviewMode || 'ONLINE',
      meetingLink: interview.meetingLink || '',
      location: interview.location || '',
      notes: interview.notes || '',
    });
    setRescheduleErrors({});
  };

  const validateReschedule = () => {
    const errors = {};
    if (!rescheduleForm.scheduledDateTime) {
      errors.scheduledDateTime = 'Interview time is required';
    } else {
      const selected = new Date(rescheduleForm.scheduledDateTime);
      if (selected <= new Date()) {
        errors.scheduledDateTime = 'Interview date and time must be set in the future';
      }
    }

    if (rescheduleForm.interviewMode === 'ONLINE') {
      if (!rescheduleForm.meetingLink?.trim()) {
        errors.meetingLink = 'Video meeting link is required for online interviews';
      } else if (rescheduleForm.meetingLink.trim().length > 500) {
        errors.meetingLink = 'Meeting link cannot exceed 500 characters';
      }
    }

    if (rescheduleForm.interviewMode === 'OFFLINE') {
      if (!rescheduleForm.location?.trim()) {
        errors.location = 'Location is required for offline interviews';
      } else if (rescheduleForm.location.trim().length > 255) {
        errors.location = 'Location cannot exceed 255 characters';
      }
    }

    if (rescheduleForm.notes && rescheduleForm.notes.length > 2000) {
      errors.notes = 'Notes cannot exceed 2000 characters';
    }

    setRescheduleErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();
    if (!validateReschedule() || !rescheduleInterview) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const payload = {
        scheduledDateTime: rescheduleForm.scheduledDateTime,
        interviewMode: rescheduleForm.interviewMode,
        meetingLink:
          rescheduleForm.interviewMode === 'ONLINE' ? rescheduleForm.meetingLink.trim() : null,
        location:
          rescheduleForm.interviewMode === 'OFFLINE' ? rescheduleForm.location.trim() : null,
        notes: rescheduleForm.notes?.trim() || null,
      };

      const res = await recruiterInterviewService.updateInterview(
        rescheduleInterview.id,
        payload
      );
      if (res.success) {
        setSuccessMessage('Interview session rescheduled successfully.');
        setRescheduleInterview(null);
        setIsLoading(true);
        setRefreshKey((k) => k + 1);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to reschedule interview.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Status Change (Complete or Cancel)
  const handleConfirmStatusChange = async () => {
    if (!confirmStatusAction) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const { interview, nextStatus } = confirmStatusAction;
      const res = await recruiterInterviewService.updateInterviewStatus(
        interview.id,
        nextStatus
      );
      if (res.success) {
        setSuccessMessage(`Interview status updated to ${nextStatus}.`);
        setConfirmStatusAction(null);
        setIsLoading(true);
        setRefreshKey((k) => k + 1);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to update interview status.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Schedule New Interview Modal
  const handleOpenNewSchedule = async () => {
    setScheduleModalOpen(true);
    setSelectedAppId('');
    setNewScheduleForm({
      scheduledDateTime: '',
      interviewMode: 'ONLINE',
      meetingLink: '',
      location: '',
      notes: '',
    });
    setNewScheduleErrors({});

    // Fetch candidate applications across jobs that are eligible (SHORTLISTED or INTERVIEW_SCHEDULED)
    try {
      if (jobs.length > 0) {
        const promises = jobs.slice(0, 10).map((j) =>
          recruiterApplicationService
            .getJobApplications(j.id, { page: 0, size: 20 })
            .catch(() => ({ success: false, data: { content: [] } }))
        );
        const results = await Promise.all(promises);
        const allApps = results.flatMap((r) => r.data?.content || []);
        const eligible = allApps.filter(
          (a) => a.status === 'SHORTLISTED' || a.status === 'INTERVIEW_SCHEDULED'
        );
        setShortlistedApps(eligible);
        if (eligible.length > 0) {
          setSelectedAppId(String(eligible[0].id));
        }
      }
    } catch (err) {
      console.error('Failed to load eligible applications', err);
    }
  };

  const validateNewSchedule = () => {
    const errors = {};
    if (!selectedAppId) {
      errors.applicationId = 'Please select a candidate application';
    }

    if (!newScheduleForm.scheduledDateTime) {
      errors.scheduledDateTime = 'Interview time is required';
    } else {
      const selected = new Date(newScheduleForm.scheduledDateTime);
      if (selected <= new Date()) {
        errors.scheduledDateTime = 'Interview date and time must be set in the future';
      }
    }

    if (newScheduleForm.interviewMode === 'ONLINE') {
      if (!newScheduleForm.meetingLink?.trim()) {
        errors.meetingLink = 'Video meeting link is required for online interviews';
      } else if (newScheduleForm.meetingLink.trim().length > 500) {
        errors.meetingLink = 'Meeting link cannot exceed 500 characters';
      }
    }

    if (newScheduleForm.interviewMode === 'OFFLINE') {
      if (!newScheduleForm.location?.trim()) {
        errors.location = 'Location is required for offline interviews';
      } else if (newScheduleForm.location.trim().length > 255) {
        errors.location = 'Location cannot exceed 255 characters';
      }
    }

    if (newScheduleForm.notes && newScheduleForm.notes.length > 2000) {
      errors.notes = 'Notes cannot exceed 2000 characters';
    }

    setNewScheduleErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNewScheduleSubmit = async (e) => {
    e.preventDefault();
    if (!validateNewSchedule()) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const payload = {
        scheduledDateTime: newScheduleForm.scheduledDateTime,
        interviewMode: newScheduleForm.interviewMode,
        meetingLink:
          newScheduleForm.interviewMode === 'ONLINE'
            ? newScheduleForm.meetingLink.trim()
            : null,
        location:
          newScheduleForm.interviewMode === 'OFFLINE'
            ? newScheduleForm.location.trim()
            : null,
        notes: newScheduleForm.notes?.trim() || null,
      };

      const res = await recruiterInterviewService.scheduleInterview(
        Number(selectedAppId),
        payload
      );

      if (res.success) {
        setSuccessMessage('Interview scheduled successfully.');
        setScheduleModalOpen(false);
        setIsLoading(true);
        setRefreshKey((k) => k + 1);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || 'Failed to schedule interview session.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout
      role="recruiter"
      title="Interview Management"
      breadcrumb="Recruiter Hub / Interviews"
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

        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Candidate Interview Rounds</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Coordinate online conferences, phone screenings, and on-site technical rounds.
            </p>
          </div>

          <Button onClick={handleOpenNewSchedule} leftIcon={<Plus size={16} />}>
            Schedule New Interview
          </Button>
        </div>

        {/* Filters & Tabs */}
        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
          {/* Tabs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl w-fit text-xs font-semibold">
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'upcoming'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Upcoming Sessions
            </button>
            <button
              onClick={() => setActiveTab('past')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'past'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Past / Completed
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'all'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Interviews
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <div className="w-full sm:w-44">
              <Select
                value={selectedMode}
                onChange={(val) => {
                  setSelectedMode(val);
                  setCurrentPage(1);
                }}
                options={MODE_OPTIONS}
              />
            </div>

            <div className="w-full sm:w-44">
              <Select
                value={selectedJobId}
                onChange={(val) => {
                  setSelectedJobId(val);
                  setCurrentPage(1);
                }}
                options={[
                  { value: 'ALL', label: 'All Job Roles' },
                  ...jobs.map((j) => ({ value: String(j.id), label: j.title })),
                ]}
              />
            </div>
          </div>
        </div>

        {/* Interviews List */}
        {isLoading ? (
          <div className="p-12">
            <LoadingSpinner center text="Loading scheduled interview rounds..." />
          </div>
        ) : displayedInterviews.length === 0 ? (
          <Card>
            <Card.Body>
              <EmptyState
                icon={<Calendar size={36} />}
                title={
                  activeTab === 'upcoming'
                    ? 'No upcoming interviews scheduled'
                    : 'No interview sessions found'
                }
                description={
                  activeTab === 'upcoming'
                    ? 'When you shortlist candidate applications, you can schedule technical interviews with automated meeting details.'
                    : 'Try changing your filter settings to view other interview records.'
                }
                action={
                  <Button onClick={handleOpenNewSchedule} leftIcon={<Plus size={16} />}>
                    Schedule Interview
                  </Button>
                }
              />
            </Card.Body>
          </Card>
        ) : (
          <div className="space-y-4">
            {displayedInterviews.map((item) => {
              const scheduledDate = item.scheduledDateTime
                ? new Date(item.scheduledDateTime)
                : null;
              const formattedDate = scheduledDate
                ? scheduledDate.toLocaleDateString(undefined, {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })
                : 'TBD';
              const formattedTime = scheduledDate
                ? scheduledDate.toLocaleTimeString(undefined, {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : '';

              const isScheduled = item.status === 'SCHEDULED';

              return (
                <Card key={item.id} className="hover:border-slate-300 transition-all">
                  <Card.Body>
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                      {/* Left Details */}
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge status={item.status} hasDot />
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                            {item.interviewMode === 'ONLINE' && <Video size={12} />}
                            {item.interviewMode === 'OFFLINE' && <MapPin size={12} />}
                            {item.interviewMode === 'PHONE' && <Phone size={12} />}
                            {item.interviewMode}
                          </span>
                          <span className="text-xs text-slate-400">
                            ID: #{item.id}
                          </span>
                        </div>

                        <div>
                          <h3 className="text-base font-bold text-slate-900">
                            {item.job?.title || 'Job Interview Round'}
                          </h3>
                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <Building size={12} />
                            {item.job?.company?.name || 'Company'} • {item.job?.location}
                          </p>
                        </div>

                        {/* Date & Mode info */}
                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-1">
                          <span className="flex items-center gap-1.5 font-semibold text-slate-900 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">
                            <Calendar size={13} className="text-indigo-600" /> {formattedDate} at {formattedTime}
                          </span>

                          {item.interviewMode === 'ONLINE' && item.meetingLink && (
                            <a
                              href={item.meetingLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-600 font-semibold flex items-center gap-1 hover:underline"
                            >
                              <Video size={13} /> Open Meeting Link <ExternalLink size={12} />
                            </a>
                          )}

                          {item.interviewMode === 'OFFLINE' && item.location && (
                            <span className="flex items-center gap-1 text-slate-700">
                              <MapPin size={13} className="text-rose-500" /> Location: {item.location}
                            </span>
                          )}
                        </div>

                        {item.notes && (
                          <div className="pt-2">
                            <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 max-w-xl">
                              <span className="font-semibold text-slate-700">Notes:</span> {item.notes}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Right Actions (only active when SCHEDULED) */}
                      {isScheduled && (
                        <div className="flex flex-wrap items-center gap-2 pt-2 lg:pt-0 w-full lg:w-auto justify-end border-t lg:border-t-0 border-slate-100">
                          <Button
                            variant="outline"
                            size="sm"
                            leftIcon={<Edit2 size={14} />}
                            onClick={() => handleOpenReschedule(item)}
                          >
                            Reschedule
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            className="text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200"
                            leftIcon={<CheckCircle size={14} />}
                            onClick={() =>
                              setConfirmStatusAction({
                                interview: item,
                                nextStatus: 'COMPLETED',
                              })
                            }
                          >
                            Mark Complete
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-rose-600 hover:bg-rose-50"
                            leftIcon={<XCircle size={14} />}
                            onClick={() =>
                              setConfirmStatusAction({
                                interview: item,
                                nextStatus: 'CANCELLED',
                              })
                            }
                          >
                            Cancel
                          </Button>
                        </div>
                      )}
                    </div>
                  </Card.Body>
                </Card>
              );
            })}

            {totalPages > 1 && (
              <div className="pt-4 flex justify-end">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={(page) => setCurrentPage(page)}
                />
              </div>
            )}
          </div>
        )}

        {/* Reschedule Modal */}
        <Modal
          isOpen={Boolean(rescheduleInterview)}
          onClose={() => setRescheduleInterview(null)}
          title={`Reschedule Interview: ${rescheduleInterview?.job?.title || 'Round'}`}
          subtitle="Select a new future date and time for the candidate interview"
          size="md"
        >
          <form onSubmit={handleRescheduleSubmit} className="space-y-4 pt-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">
                New Date & Time <span className="text-rose-500">*</span>
              </label>
              <Input
                type="datetime-local"
                value={rescheduleForm.scheduledDateTime}
                onChange={(e) =>
                  setRescheduleForm((p) => ({ ...p, scheduledDateTime: e.target.value }))
                }
                error={rescheduleErrors.scheduledDateTime}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">
                Interview Delivery Mode <span className="text-rose-500">*</span>
              </label>
              <Select
                value={rescheduleForm.interviewMode}
                onChange={(val) =>
                  setRescheduleForm((p) => ({ ...p, interviewMode: val }))
                }
                options={[
                  { value: 'ONLINE', label: 'Online Video Conference' },
                  { value: 'OFFLINE', label: 'In-Person / On-Site' },
                  { value: 'PHONE', label: 'Telephone Screening' },
                ]}
              />
            </div>

            {rescheduleForm.interviewMode === 'ONLINE' && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  Video Conference URL <span className="text-rose-500">*</span>
                </label>
                <Input
                  placeholder="https://meet.google.com/xyz"
                  value={rescheduleForm.meetingLink}
                  onChange={(e) =>
                    setRescheduleForm((p) => ({ ...p, meetingLink: e.target.value }))
                  }
                  error={rescheduleErrors.meetingLink}
                  required
                  maxLength={500}
                />
              </div>
            )}

            {rescheduleForm.interviewMode === 'OFFLINE' && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  Office / Room Location <span className="text-rose-500">*</span>
                </label>
                <Input
                  placeholder="Building 4, Room 201"
                  value={rescheduleForm.location}
                  onChange={(e) =>
                    setRescheduleForm((p) => ({ ...p, location: e.target.value }))
                  }
                  error={rescheduleErrors.location}
                  required
                  maxLength={255}
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">
                Notes & Instructions
              </label>
              <textarea
                rows={3}
                className="w-full rounded-lg border border-slate-200 p-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                placeholder="Updated topics, prerequisites, or preparation notes..."
                value={rescheduleForm.notes}
                onChange={(e) =>
                  setRescheduleForm((p) => ({ ...p, notes: e.target.value }))
                }
                maxLength={2000}
              />
              {rescheduleErrors.notes && (
                <span className="text-xs text-rose-600 block">
                  {rescheduleErrors.notes}
                </span>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setRescheduleInterview(null)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Schedule'}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Confirm Status Change Modal */}
        <Modal
          isOpen={Boolean(confirmStatusAction)}
          onClose={() => setConfirmStatusAction(null)}
          title={`Confirm ${confirmStatusAction?.nextStatus === 'COMPLETED' ? 'Completion' : 'Cancellation'}`}
          subtitle={`Are you sure you want to mark this interview as ${confirmStatusAction?.nextStatus}?`}
          size="sm"
          footer={
            <>
              <Button
                variant="outline"
                onClick={() => setConfirmStatusAction(null)}
                disabled={isSubmitting}
              >
                Go Back
              </Button>
              <Button
                variant={
                  confirmStatusAction?.nextStatus === 'COMPLETED'
                    ? 'primary'
                    : 'danger'
                }
                onClick={handleConfirmStatusChange}
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? 'Updating...'
                  : `Mark ${confirmStatusAction?.nextStatus}`}
              </Button>
            </>
          }
        >
          <div className="text-sm text-slate-600 space-y-2">
            <p>
              This action will update the status of the interview for role{' '}
              <strong>&ldquo;{confirmStatusAction?.interview?.job?.title}&rdquo;</strong> to{' '}
              <strong>{confirmStatusAction?.nextStatus}</strong>.
            </p>
            <p className="text-xs text-slate-500">
              This status transition is terminal and cannot be reverted back to SCHEDULED.
            </p>
          </div>
        </Modal>

        {/* Schedule New Interview Modal */}
        <Modal
          isOpen={scheduleModalOpen}
          onClose={() => setScheduleModalOpen(false)}
          title="Schedule Interview Round"
          subtitle="Select a shortlisted applicant and configure round details"
          size="md"
        >
          <form onSubmit={handleNewScheduleSubmit} className="space-y-4 pt-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">
                Shortlisted Candidate Application <span className="text-rose-500">*</span>
              </label>
              {shortlistedApps.length === 0 ? (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                  No shortlisted applicants currently available. Please visit{' '}
                  <Link
                    to="/recruiter/applications"
                    className="font-bold underline text-amber-900"
                  >
                    Applications
                  </Link>{' '}
                  and advance qualified candidates to SHORTLISTED first.
                </div>
              ) : (
                <Select
                  value={selectedAppId}
                  onChange={(val) => setSelectedAppId(val)}
                  options={shortlistedApps.map((a) => ({
                    value: String(a.id),
                    label: `${a.candidate?.fullName || 'Candidate'} — ${a.job?.title || 'Job'} (${a.status})`,
                  }))}
                />
              )}
              {newScheduleErrors.applicationId && (
                <span className="text-xs text-rose-600 block">
                  {newScheduleErrors.applicationId}
                </span>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">
                Scheduled Date & Time <span className="text-rose-500">*</span>
              </label>
              <Input
                type="datetime-local"
                value={newScheduleForm.scheduledDateTime}
                onChange={(e) =>
                  setNewScheduleForm((p) => ({
                    ...p,
                    scheduledDateTime: e.target.value,
                  }))
                }
                error={newScheduleErrors.scheduledDateTime}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">
                Delivery Mode <span className="text-rose-500">*</span>
              </label>
              <Select
                value={newScheduleForm.interviewMode}
                onChange={(val) =>
                  setNewScheduleForm((p) => ({ ...p, interviewMode: val }))
                }
                options={[
                  { value: 'ONLINE', label: 'Online Video Call' },
                  { value: 'OFFLINE', label: 'In-Person / On-Site' },
                  { value: 'PHONE', label: 'Telephone Call' },
                ]}
              />
            </div>

            {newScheduleForm.interviewMode === 'ONLINE' && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  Video Conference URL <span className="text-rose-500">*</span>
                </label>
                <Input
                  placeholder="https://meet.google.com/xyz"
                  value={newScheduleForm.meetingLink}
                  onChange={(e) =>
                    setNewScheduleForm((p) => ({
                      ...p,
                      meetingLink: e.target.value,
                    }))
                  }
                  error={newScheduleErrors.meetingLink}
                  required
                  maxLength={500}
                />
              </div>
            )}

            {newScheduleForm.interviewMode === 'OFFLINE' && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  Physical Office / Room Location <span className="text-rose-500">*</span>
                </label>
                <Input
                  placeholder="e.g. Headquarters, Floor 3, Meeting Room Alpha"
                  value={newScheduleForm.location}
                  onChange={(e) =>
                    setNewScheduleForm((p) => ({ ...p, location: e.target.value }))
                  }
                  error={newScheduleErrors.location}
                  required
                  maxLength={255}
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">
                Notes & Instructions
              </label>
              <textarea
                rows={3}
                className="w-full rounded-lg border border-slate-200 p-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                placeholder="Preparation topics, coding test link, or technical prerequisites..."
                value={newScheduleForm.notes}
                onChange={(e) =>
                  setNewScheduleForm((p) => ({ ...p, notes: e.target.value }))
                }
                maxLength={2000}
              />
              {newScheduleErrors.notes && (
                <span className="text-xs text-rose-600 block">
                  {newScheduleErrors.notes}
                </span>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setScheduleModalOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || shortlistedApps.length === 0}
              >
                {isSubmitting ? 'Scheduling...' : 'Confirm Schedule'}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default RecruiterInterviewsPage;
