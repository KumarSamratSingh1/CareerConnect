import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Bookmark,
  Calendar,
  Clock,
  ArrowRight,
  Video,
  MapPin,
  ExternalLink,
  Briefcase,
  UserCheck,
  Sparkles
} from 'lucide-react';
import { DashboardLayout } from '../../components/layout';
import { Card, Badge, Button, EmptyState, ErrorState, LoadingSpinner, Modal, MetricCardSkeleton, useToast } from '../../components/ui';
import { JobCard } from '../../components/jobs/JobCard';
import { useAuth } from '../../context';
import {
  candidateService,
  applicationService,
  interviewService,
  savedJobService,
  jobService
} from '../../api';
import './CandidateDashboard.css';

const AnimatedMetric = ({ value }) => {
  const [displayVal, setDisplayVal] = useState(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return value;
    }
    return 0;
  });

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    let startTime = null;
    let frameId = null;
    const duration = 800;

    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setDisplayVal(Math.floor(eased * value));
      if (progress < 1) {
        frameId = requestAnimationFrame(step);
      } else {
        setDisplayVal(value);
      }
    };

    frameId = requestAnimationFrame(step);
    return () => {
      if (frameId) cancelAnimationFrame(frameId);
    };
  }, [value]);

  return <span>{displayVal}</span>;
};

export const CandidateDashboardPage = () => {
  const { user } = useAuth();
  const toast = useToast();

  // State
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({
    totalApplications: 0,
    underReview: 0,
    shortlisted: 0,
    scheduledInterviews: 0,
    savedJobsCount: 0,
  });
  const [recentApplications, setRecentApplications] = useState([]);
  const [upcomingInterviews, setUpcomingInterviews] = useState([]);
  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const [savedJobIds, setSavedJobIds] = useState(new Set());

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Application details modal state
  const [selectedApp, setSelectedApp] = useState(null);

  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let isCancelled = false;

    const loadDashboardData = async () => {
      try {
        const [profileRes, appsRes, intRes, savedRes, jobsRes] = await Promise.allSettled([
          candidateService.getProfile(),
          applicationService.getMyApplications({ page: 0, size: 50, sort: 'appliedAt,desc' }),
          interviewService.getMyInterviews({ page: 0, size: 20, sort: 'scheduledDateTime,asc' }),
          savedJobService.getMySavedJobs({ page: 0, size: 50 }),
          jobService.getPublicJobs({ page: 0, size: 3 }),
        ]);

        if (isCancelled) return;

        // 1. Profile
        if (profileRes.status === 'fulfilled' && profileRes.value?.success && profileRes.value?.data) {
          setProfile(profileRes.value.data);
        }

        // 2. Applications
        let totalApps = 0;
        let reviewCount = 0;
        let shortCount = 0;
        if (appsRes.status === 'fulfilled' && appsRes.value?.success && appsRes.value?.data) {
          const content = appsRes.value.data.content || [];
          totalApps = appsRes.value.data.totalElements ?? content.length;
          reviewCount = content.filter((a) => a.status === 'UNDER_REVIEW').length;
          shortCount = content.filter((a) => a.status === 'SHORTLISTED' || a.status === 'INTERVIEW_SCHEDULED').length;
          setRecentApplications(content.slice(0, 3));
        }

        // 3. Interviews
        let scheduledCount = 0;
        if (intRes.status === 'fulfilled' && intRes.value?.success && intRes.value?.data) {
          const content = intRes.value.data.content || [];
          const scheduled = content.filter((i) => i.status === 'SCHEDULED');
          scheduledCount = scheduled.length;
          setUpcomingInterviews(scheduled.slice(0, 2));
        }

        // 4. Saved Jobs
        let savedCount = 0;
        const savedIds = new Set();
        if (savedRes.status === 'fulfilled' && savedRes.value?.success && savedRes.value?.data) {
          const content = savedRes.value.data.content || [];
          savedCount = savedRes.value.data.totalElements ?? content.length;
          content.forEach((item) => {
            if (item.job?.id) savedIds.add(item.job.id);
          });
          setSavedJobIds(savedIds);
        }

        // 5. Recommended Jobs
        if (jobsRes.status === 'fulfilled' && jobsRes.value?.success && jobsRes.value?.data?.content?.length > 0) {
          setRecommendedJobs(jobsRes.value.data.content);
        } else {
          setRecommendedJobs([]);
        }

        setStats({
          totalApplications: totalApps,
          underReview: reviewCount,
          shortlisted: shortCount,
          scheduledInterviews: scheduledCount,
          savedJobsCount: savedCount,
        });
      } catch (err) {
        if (!isCancelled) {
          setError(err.message || 'Unable to load dashboard data. Please try again.');
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    loadDashboardData();

    return () => {
      isCancelled = true;
    };
  }, [refreshKey]);

  const handleRetry = () => {
    setIsLoading(true);
    setError(null);
    setRefreshKey((prev) => prev + 1);
  };

  // Handle Save / Unsave Job toggle
  const handleSaveToggle = async (jobId) => {
    const isCurrentlySaved = savedJobIds.has(jobId);
    try {
      if (isCurrentlySaved) {
        await savedJobService.removeSavedJob(jobId);
        setSavedJobIds((prev) => {
          const next = new Set(prev);
          next.delete(jobId);
          return next;
        });
        setStats((prev) => ({ ...prev, savedJobsCount: Math.max(0, prev.savedJobsCount - 1) }));
        toast.info('Job removed from your saved list');
      } else {
        await savedJobService.saveJob(jobId);
        setSavedJobIds((prev) => new Set([...prev, jobId]));
        setStats((prev) => ({ ...prev, savedJobsCount: prev.savedJobsCount + 1 }));
        toast.success('Job saved to your bookmarks!');
      }
    } catch {
      toast.error('Unable to update saved job. Please try again.');
    }
  };

  // Calculate profile completion percentage
  const calculateProfileCompletion = () => {
    let score = 20; // Base score for having an authenticated account
    if (profile?.fullName) score += 20;
    if (profile?.phone) score += 15;
    if (profile?.resumeUrl) score += 15;
    if (profile?.skills?.length > 0) score += 15;
    if (profile?.educations?.length > 0) score += 15;
    return Math.min(100, score);
  };

  const profileCompletion = calculateProfileCompletion();
  const displayName = profile?.fullName || user?.email?.split('@')[0] || 'Candidate';

  return (
    <DashboardLayout role="candidate" title="Overview" breadcrumb="Candidate Portal / Dashboard">
      {/* Welcome Banner */}
      <section className="candidate-welcome-card" aria-labelledby="welcome-title">
        <div className="candidate-welcome-card__header">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-sky-400">Welcome back</span>
              <Badge variant="primary">Candidate</Badge>
            </div>
            <h1 id="welcome-title" className="candidate-welcome-card__title">
              Hello, {displayName} 👋
            </h1>
            <p className="candidate-welcome-card__subtitle">
              Here is what is happening with your job applications, interviews, and opportunities today.
            </p>
          </div>

          <div className="candidate-profile-meter">
            <div className="candidate-profile-meter__top">
              <span>Profile Strength</span>
              <span className="text-sky-400 font-bold">{profileCompletion}%</span>
            </div>
            <div className="candidate-profile-meter__bar">
              <div
                className="candidate-profile-meter__fill"
                style={{ width: `${profileCompletion}%` }}
              />
            </div>
            <Link to="/candidate/profile" className="candidate-profile-meter__action">
              {profileCompletion < 100 ? 'Complete your profile' : 'View profile'} <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </section>

      {/* Quick Action Shortcuts */}
      <nav className="candidate-quick-actions" aria-label="Dashboard quick links">
        <Link to="/jobs" className="candidate-quick-btn">
          <div className="candidate-quick-btn__icon">
            <Briefcase size={18} />
          </div>
          <span>Browse Jobs</span>
        </Link>
        <Link to="/candidate/applications" className="candidate-quick-btn">
          <div className="candidate-quick-btn__icon">
            <FileText size={18} />
          </div>
          <span>My Applications</span>
        </Link>
        <Link to="/candidate/saved-jobs" className="candidate-quick-btn">
          <div className="candidate-quick-btn__icon">
            <Bookmark size={18} />
          </div>
          <span>Saved Jobs</span>
        </Link>
        <Link to="/candidate/profile" className="candidate-quick-btn">
          <div className="candidate-quick-btn__icon">
            <UserCheck size={18} />
          </div>
          <span>Update Profile</span>
        </Link>
        <Link to="/candidate/resume" className="candidate-quick-btn">
          <div className="candidate-quick-btn__icon">
            <Sparkles size={18} />
          </div>
          <span>Import Resume</span>
        </Link>
      </nav>

      {/* Main Content / Loading / Error */}
      {isLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg-grid-cols-4 gap-4">
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
          </div>
          <Card>
            <Card.Body>
              <div className="py-8">
                <LoadingSpinner center text="Loading dashboard activity and application stages..." />
              </div>
            </Card.Body>
          </Card>
        </div>
      ) : error ? (
        <ErrorState
          title="Could not load dashboard activity"
          message={error}
          onRetry={handleRetry}
          className="mb-6"
        />
      ) : (
        <>
          {/* Statistics Grid */}
          <div className="grid grid-cols-2 lg-grid-cols-4 gap-4 mb-6">
            <Card className="hover:border-blue-200 transition-all">
              <Card.Body>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted mb-1 font-medium">Total Applications</p>
                    <h3 className="text-2xl font-bold text-slate-900">
                      <AnimatedMetric value={stats.totalApplications} />
                    </h3>
                  </div>
                  <div className="p-3 rounded-xl bg-blue-50 text-blue-600 shadow-xs">
                    <FileText size={20} />
                  </div>
                </div>
              </Card.Body>
            </Card>

            <Card className="hover:border-amber-200 transition-all">
              <Card.Body>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted mb-1 font-medium">Under Review</p>
                    <h3 className="text-2xl font-bold text-slate-900">
                      <AnimatedMetric value={stats.underReview} />
                    </h3>
                  </div>
                  <div className="p-3 rounded-xl bg-amber-50 text-amber-600 shadow-xs">
                    <Clock size={20} />
                  </div>
                </div>
              </Card.Body>
            </Card>

            <Card className="hover:border-purple-200 transition-all">
              <Card.Body>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted mb-1 font-medium">Shortlisted</p>
                    <h3 className="text-2xl font-bold text-slate-900">
                      <AnimatedMetric value={stats.shortlisted} />
                    </h3>
                  </div>
                  <div className="p-3 rounded-xl bg-purple-50 text-purple-600 shadow-xs">
                    <UserCheck size={20} />
                  </div>
                </div>
              </Card.Body>
            </Card>

            <Card className="hover:border-emerald-200 transition-all">
              <Card.Body>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted mb-1 font-medium">Interviews Scheduled</p>
                    <h3 className="text-2xl font-bold text-slate-900">
                      <AnimatedMetric value={stats.scheduledInterviews} />
                    </h3>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 shadow-xs">
                    <Calendar size={20} />
                  </div>
                </div>
              </Card.Body>
            </Card>
          </div>

          {/* Real Application Pipeline Visualizer */}
          {stats.totalApplications > 0 && (
            <Card className="mb-6">
              <Card.Body>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Application Pipeline Progress</h4>
                    <p className="text-xs text-slate-500">Real-time status breakdown across submitted roles</p>
                  </div>
                  <Badge variant="primary" size="sm">
                    {stats.totalApplications} Active Total
                  </Badge>
                </div>
                <div className="h-3 w-full rounded-full bg-slate-100 flex overflow-hidden gap-0.5">
                  <div
                    style={{ width: `${Math.max(4, (stats.underReview / stats.totalApplications) * 100)}%` }}
                    className="bg-amber-500 transition-all"
                    title={`Under Review: ${stats.underReview}`}
                  />
                  <div
                    style={{ width: `${Math.max(4, (stats.shortlisted / stats.totalApplications) * 100)}%` }}
                    className="bg-purple-500 transition-all"
                    title={`Shortlisted: ${stats.shortlisted}`}
                  />
                  <div
                    style={{ width: `${Math.max(4, (stats.scheduledInterviews / stats.totalApplications) * 100)}%` }}
                    className="bg-emerald-500 transition-all"
                    title={`Interviews: ${stats.scheduledInterviews}`}
                  />
                  <div
                    style={{
                      width: `${Math.max(
                        0,
                        100 -
                          ((stats.underReview + stats.shortlisted + stats.scheduledInterviews) /
                            stats.totalApplications) *
                            100
                      )}%`,
                    }}
                    className="bg-blue-500 transition-all"
                    title="Applied / Screening"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" /> Applied
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Under Review ({stats.underReview})
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block" /> Shortlisted ({stats.shortlisted})
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Interviews ({stats.scheduledInterviews})
                  </span>
                </div>
              </Card.Body>
            </Card>
          )}

          {/* Two-column layout: Recent Applications & Upcoming Interviews */}
          <div className="candidate-dash-grid">
            {/* Left Column: Recent Applications */}
            <Card>
              <Card.Header>
                <Card.Title>Recent Applications</Card.Title>
                <Link to="/candidate/applications">
                  <Button variant="ghost" size="sm" rightIcon={<ArrowRight size={14} />}>
                    View All ({stats.totalApplications})
                  </Button>
                </Link>
              </Card.Header>
              <Card.Body noPadding>
                {recentApplications.length === 0 ? (
                  <div className="p-6">
                    <EmptyState
                      icon={<FileText size={32} />}
                      title="No applications submitted yet"
                      description="Discover opportunities that match your background and start applying today."
                      action={
                        <Link to="/jobs">
                          <Button size="sm">Browse Jobs</Button>
                        </Link>
                      }
                    />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-subtle bg-slate-50 text-xs text-secondary">
                          <th className="p-4 font-semibold">Position</th>
                          <th className="p-4 font-semibold">Company</th>
                          <th className="p-4 font-semibold">Applied Date</th>
                          <th className="p-4 font-semibold">Status</th>
                          <th className="p-4 font-semibold text-right">Details</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentApplications.map((app) => {
                          const jobTitle = app.job?.title || 'Job Application';
                          const companyName = app.job?.company?.name || 'Company';
                          const dateStr = app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : 'Recent';

                          return (
                            <tr key={app.id} className="border-b border-subtle text-sm hover:bg-slate-50 transition-colors">
                              <td className="p-4 font-semibold text-slate-900">{jobTitle}</td>
                              <td className="p-4 text-secondary">{companyName}</td>
                              <td className="p-4 text-muted text-xs">{dateStr}</td>
                              <td className="p-4">
                                <Badge status={app.status} hasDot />
                              </td>
                              <td className="p-4 text-right">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setSelectedApp(app)}
                                >
                                  View
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card.Body>
            </Card>

            {/* Right Column: Upcoming Interviews */}
            <Card>
              <Card.Header>
                <Card.Title>Upcoming Interviews</Card.Title>
                <Link to="/candidate/interviews">
                  <Button variant="ghost" size="sm" rightIcon={<ArrowRight size={14} />}>
                    View All
                  </Button>
                </Link>
              </Card.Header>
              <Card.Body>
                {upcomingInterviews.length === 0 ? (
                  <EmptyState
                    icon={<Calendar size={28} />}
                    title="No interviews scheduled"
                    description="When recruiters schedule an interview with you, it will appear here."
                  />
                ) : (
                  <div>
                    {upcomingInterviews.map((item) => {
                      const jobTitle = item.job?.title || 'Interview';
                      const companyName = item.job?.company?.name || 'Hiring Team';
                      const formattedDate = item.scheduledDateTime
                        ? new Date(item.scheduledDateTime).toLocaleString(undefined, {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })
                        : 'Date TBD';

                      return (
                        <div key={item.id} className="interview-preview-item">
                          <div className="interview-preview-item__header">
                            <div>
                              <h4 className="interview-preview-item__title">{jobTitle}</h4>
                              <span className="interview-preview-item__company">{companyName}</span>
                            </div>
                            <Badge variant="primary">{item.interviewMode || 'ONLINE'}</Badge>
                          </div>

                          <div className="interview-preview-item__meta">
                            <span className="interview-preview-item__meta-tag">
                              <Clock size={12} /> {formattedDate}
                            </span>
                            {item.location && (
                              <span className="interview-preview-item__meta-tag">
                                <MapPin size={12} /> {item.location}
                              </span>
                            )}
                          </div>

                          {item.interviewMode === 'ONLINE' && item.meetingLink && (
                            <a
                              href={item.meetingLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full"
                            >
                              <Button size="sm" variant="outline" className="w-full" leftIcon={<Video size={14} />}>
                                Join Video Call
                              </Button>
                            </a>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card.Body>
            </Card>
          </div>

          {/* Recommended / Explore Jobs Section */}
          <section className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Recommended Opportunities</h2>
                <p className="text-secondary text-sm">Curated job openings matching your potential skills and interests.</p>
              </div>
              <Link to="/jobs">
                <Button variant="ghost" size="sm" rightIcon={<ArrowRight size={14} />}>
                  Explore All Jobs
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 md-grid-cols-3 gap-4">
              {recommendedJobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  isSaved={savedJobIds.has(job.id)}
                  onSaveToggle={handleSaveToggle}
                />
              ))}
            </div>
          </section>
        </>
      )}

      {/* Application Details Modal */}
      {selectedApp && (
        <Modal
          isOpen={Boolean(selectedApp)}
          onClose={() => setSelectedApp(null)}
          title="Application Details"
          subtitle={`Application ID: #${selectedApp.id}`}
        >
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-subtle">
              <div>
                <h4 className="font-bold text-slate-900 text-base">{selectedApp.job?.title}</h4>
                <p className="text-xs text-secondary">{selectedApp.job?.company?.name || 'Company'}</p>
              </div>
              <Badge status={selectedApp.status} hasDot />
            </div>

            {selectedApp.appliedAt && (
              <p className="text-xs text-muted">
                Applied on: {new Date(selectedApp.appliedAt).toLocaleString()}
              </p>
            )}

            {selectedApp.coverLetter && (
              <div className="p-3 rounded-lg border border-subtle bg-white">
                <h5 className="text-xs font-semibold text-secondary uppercase mb-1">Cover Letter</h5>
                <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                  {selectedApp.coverLetter}
                </p>
              </div>
            )}

            {selectedApp.statusHistory && selectedApp.statusHistory.length > 0 && (
              <div>
                <h5 className="text-xs font-semibold text-secondary uppercase mb-2">Status Timeline</h5>
                <div className="border-l-2 border-brand ml-2 pl-4 flex flex-col gap-3">
                  {selectedApp.statusHistory.map((hist, idx) => (
                    <div key={idx} className="relative">
                      <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-brand" />
                      <div className="flex items-center gap-2">
                        <Badge status={hist.status} hasDot />
                        <span className="text-xs text-muted">
                          {new Date(hist.changedAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setSelectedApp(null)}>
                Close
              </Button>
              {selectedApp.job?.id && (
                <Link to={`/jobs/${selectedApp.job.id}`}>
                  <Button rightIcon={<ExternalLink size={14} />}>
                    View Job Posting
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </Modal>
      )}
    </DashboardLayout>
  );
};

export default CandidateDashboardPage;
