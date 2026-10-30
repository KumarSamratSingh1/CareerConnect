import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  Users,
  Calendar,
  ArrowRight,
  Plus,
  Building2,
  Clock,
  CheckCircle2,
  Video,
  MapPin,
  User,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { DashboardLayout } from '../../components/layout';
import { Card, Badge, Button, EmptyState, MetricCardSkeleton } from '../../components/ui';
import { useAuth } from '../../context';
import {
  recruiterJobService,
  recruiterApplicationService,
  recruiterInterviewService,
  recruiterService,
  companyService,
} from '../../api';

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

export const RecruiterDashboardPage = () => {
  const { user } = useAuth();

  const [profile, setProfile] = useState(null);
  const [company, setCompany] = useState(null);
  const [hasProfile, setHasProfile] = useState(true);
  const [hasCompany, setHasCompany] = useState(true);

  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [interviews, setInterviews] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isCancelled = false;

    const loadDashboard = async () => {
      try {
        // 1. Fetch Profile and Company concurrently
        const [profResult, compResult] = await Promise.allSettled([
          recruiterService.getProfile(),
          companyService.getMyCompany(),
        ]);

        if (isCancelled) return;

        if (profResult.status === 'fulfilled' && profResult.value?.success && profResult.value?.data) {
          setProfile(profResult.value.data);
          setHasProfile(true);
        } else {
          setHasProfile(false);
        }

        if (compResult.status === 'fulfilled' && compResult.value?.success && compResult.value?.data) {
          setCompany(compResult.value.data);
          setHasCompany(true);
        } else {
          setHasCompany(false);
        }

        // 2. Fetch Jobs
        let myJobs = [];
        try {
          const jobRes = await recruiterJobService.getMyJobs({
            page: 0,
            size: 50,
            sort: 'createdAt,desc',
          });
          if (jobRes.success && jobRes.data) {
            myJobs = jobRes.data.content || [];
            setJobs(myJobs);
          }
        } catch {
          // If no company exists yet, jobs endpoint throws 404
          myJobs = [];
        }

        if (isCancelled) return;

        // 3. Fetch Interviews
        try {
          const intRes = await recruiterInterviewService.getInterviews({
            page: 0,
            size: 20,
            sort: 'scheduledDateTime,asc',
          });
          if (intRes.success && intRes.data) {
            setInterviews(intRes.data.content || []);
          }
        } catch {
          setInterviews([]);
        }

        if (isCancelled) return;

        // 4. Fetch Applications for top active jobs
        if (myJobs.length > 0) {
          try {
            const topJobs = myJobs.slice(0, 5);
            const appPromises = topJobs.map((j) =>
              recruiterApplicationService
                .getJobApplications(j.id, { page: 0, size: 10, sort: 'appliedAt,desc' })
                .catch(() => ({ success: false, data: { content: [] } }))
            );
            const appResults = await Promise.all(appPromises);
            const combinedApps = appResults.flatMap((r) => r.data?.content || []);
            // Sort by appliedAt descending
            combinedApps.sort((a, b) => new Date(b.appliedAt || 0) - new Date(a.appliedAt || 0));
            setApplications(combinedApps);
          } catch {
            setApplications([]);
          }
        }
      } catch (err) {
        if (!isCancelled) {
          setError(err.response?.data?.message || err.message || 'Failed to load dashboard data.');
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    loadDashboard();
    return () => {
      isCancelled = true;
    };
  }, []);

  // Calculated Metrics
  const totalJobs = jobs.length;
  const openJobs = jobs.filter((j) => j.status === 'OPEN').length;
  const closedJobs = jobs.filter((j) => j.status === 'CLOSED').length;

  const totalApplications = applications.length;
  const pendingReviewCount = applications.filter(
    (a) => a.status === 'APPLIED' || a.status === 'UNDER_REVIEW'
  ).length;
  const shortlistedCount = applications.filter(
    (a) => a.status === 'SHORTLISTED' || a.status === 'INTERVIEW_SCHEDULED'
  ).length;
  const selectedCount = applications.filter((a) => a.status === 'SELECTED').length;

  const now = new Date();
  const upcomingInterviews = interviews.filter((item) => {
    if (item.status === 'COMPLETED' || item.status === 'CANCELLED') return false;
    if (!item.scheduledDateTime) return true;
    return new Date(item.scheduledDateTime) >= now;
  });

  const displayName = profile?.fullName || user?.email?.split('@')[0] || 'Recruiter';

  return (
    <DashboardLayout
      role="recruiter"
      title="Recruiter Workspace"
      breadcrumb="Recruiter Hub / Overview"
    >
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-slate-900 to-indigo-950 p-6 rounded-2xl text-white shadow-sm">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300">
                Talent Acquisition Command
              </span>
              {company?.verified && (
                <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <ShieldCheck size={12} /> Verified Employer
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold">Welcome back, {displayName}</h1>
            <p className="text-sm text-slate-300 mt-1">
              {company
                ? `Hiring portal for ${company.name} • ${company.location}`
                : 'Manage job postings, review applicant profiles, and schedule interviews.'}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Link to="/recruiter/jobs?action=create">
              <Button
                size="sm"
                className="bg-indigo-600 hover:bg-indigo-700 text-white border-0 shadow"
                leftIcon={<Plus size={16} />}
              >
                Post New Job
              </Button>
            </Link>
            <Link to="/recruiter/company">
              <Button size="sm" variant="outline" className="text-white border-slate-700 hover:bg-slate-800">
                Company Profile
              </Button>
            </Link>
          </div>
        </div>

        {/* Onboarding / Setup Alert if missing profile or company */}
        {(!hasProfile || !hasCompany) && (
          <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900">
            <div className="flex items-start gap-3">
              <AlertCircle size={22} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-2 w-full">
                <h3 className="font-bold text-sm">Action Required: Complete Recruiter Onboarding</h3>
                <p className="text-xs text-amber-800">
                  To publish job listings and invite candidates to interviews, the backend requires your professional profile and verified corporate identity.
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {!hasProfile && (
                    <Link to="/recruiter/profile">
                      <Button size="sm" variant="outline" className="bg-white text-xs">
                        1. Complete Recruiter Profile
                      </Button>
                    </Link>
                  )}
                  {!hasCompany && (
                    <Link to="/recruiter/company">
                      <Button size="sm" variant="outline" className="bg-white text-xs">
                        2. Register Company Profile
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2">
            <AlertCircle size={18} className="text-rose-600 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Loading Skeletons */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
          </div>
        ) : (
          <>
            {/* Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <Card.Body>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                        Active Openings
                      </p>
                      <h3 className="text-2xl font-bold text-slate-900 mt-1">
                        <AnimatedMetric value={openJobs} />
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {totalJobs} total ({closedJobs} closed)
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600">
                      <Briefcase size={22} />
                    </div>
                  </div>
                </Card.Body>
              </Card>

              <Card>
                <Card.Body>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                        Total Applicants
                      </p>
                      <h3 className="text-2xl font-bold text-slate-900 mt-1">
                        <AnimatedMetric value={totalApplications} />
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">Across active pipelines</p>
                    </div>
                    <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
                      <Users size={22} />
                    </div>
                  </div>
                </Card.Body>
              </Card>

              <Card>
                <Card.Body>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                        Needs Review
                      </p>
                      <h3 className="text-2xl font-bold text-amber-600 mt-1">
                        <AnimatedMetric value={pendingReviewCount} />
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">Applied & Under Review</p>
                    </div>
                    <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
                      <Clock size={22} />
                    </div>
                  </div>
                </Card.Body>
              </Card>

              <Card>
                <Card.Body>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                        Interviews Scheduled
                      </p>
                      <h3 className="text-2xl font-bold text-emerald-600 mt-1">
                        <AnimatedMetric value={upcomingInterviews.length} />
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {shortlistedCount} shortlisted candidates
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
                      <Calendar size={22} />
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </div>

            {/* Hiring Pipeline Telemetry */}
            {totalApplications > 0 && (
              <Card>
                <Card.Body>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">Talent Pipeline Distribution</h4>
                        <p className="text-xs text-slate-500">Live breakdown across {totalApplications} candidate applications</p>
                      </div>
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700">
                        {Math.round(((shortlistedCount + selectedCount) / (totalApplications || 1)) * 100)}% Conversion
                      </span>
                    </div>

                    {/* Segmented Pipeline Bar */}
                    <div className="h-3 w-full rounded-full bg-slate-100 flex overflow-hidden p-0.5 gap-0.5">
                      <div
                        className="bg-amber-500 rounded-l-full transition-all duration-700"
                        style={{ width: `${Math.max(pendingReviewCount > 0 ? 4 : 0, (pendingReviewCount / totalApplications) * 100)}%` }}
                        title={`Review Pending: ${pendingReviewCount}`}
                      />
                      <div
                        className="bg-blue-500 transition-all duration-700"
                        style={{ width: `${(shortlistedCount / totalApplications) * 100}%` }}
                        title={`Shortlisted / Interviewing: ${shortlistedCount}`}
                      />
                      <div
                        className="bg-emerald-500 rounded-r-full transition-all duration-700"
                        style={{ width: `${(selectedCount / totalApplications) * 100}%` }}
                        title={`Selected / Offered: ${selectedCount}`}
                      />
                    </div>

                    {/* Legend */}
                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 mt-1">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                        <span>Pending Review ({pendingReviewCount})</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
                        <span>Shortlisted ({shortlistedCount})</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                        <span>Selected ({selectedCount})</span>
                      </div>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            )}

            {/* Quick Actions Bar */}
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Quick Navigation
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <Link to="/recruiter/jobs">
                  <Button variant="outline" size="sm" leftIcon={<Briefcase size={14} />}>
                    Manage Jobs
                  </Button>
                </Link>
                <Link to="/recruiter/applications">
                  <Button variant="outline" size="sm" leftIcon={<Users size={14} />}>
                    Review Applications
                  </Button>
                </Link>
                <Link to="/recruiter/interviews">
                  <Button variant="outline" size="sm" leftIcon={<Calendar size={14} />}>
                    Manage Interviews
                  </Button>
                </Link>
                <Link to="/recruiter/company">
                  <Button variant="outline" size="sm" leftIcon={<Building2 size={14} />}>
                    Company Info
                  </Button>
                </Link>
                <Link to="/recruiter/profile">
                  <Button variant="outline" size="sm" leftIcon={<User size={14} />}>
                    My Profile
                  </Button>
                </Link>
              </div>
            </div>

            {/* Two Column Layout: Recent Postings & Upcoming Interviews */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Jobs (2 cols) */}
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <Card.Header>
                    <div className="flex items-center justify-between w-full">
                      <Card.Title>Recent Job Postings</Card.Title>
                      <Link to="/recruiter/jobs">
                        <Button variant="ghost" size="sm" rightIcon={<ArrowRight size={14} />}>
                          View All ({totalJobs})
                        </Button>
                      </Link>
                    </div>
                  </Card.Header>
                  <Card.Body noPadding>
                    {jobs.length === 0 ? (
                      <div className="p-8">
                        <EmptyState
                          icon={<Briefcase size={32} />}
                          title="No Active Job Postings"
                          description="Get started by posting your first job to begin sourcing candidate applications."
                          action={
                            <Link to="/recruiter/jobs?action=create">
                              <Button size="sm" leftIcon={<Plus size={14} />}>
                                Post First Job
                              </Button>
                            </Link>
                          }
                        />
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-slate-100 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                              <th className="p-3.5">Position</th>
                              <th className="p-3.5">Location</th>
                              <th className="p-3.5">Type</th>
                              <th className="p-3.5">Status</th>
                              <th className="p-3.5 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-sm">
                            {jobs.slice(0, 5).map((job) => (
                              <tr key={job.id} className="hover:bg-slate-50/75 transition-colors">
                                <td className="p-3.5">
                                  <Link
                                    to={`/recruiter/applications?jobId=${job.id}`}
                                    className="font-semibold text-slate-900 hover:text-indigo-600 block"
                                  >
                                    {job.title}
                                  </Link>
                                  <span className="text-[11px] text-slate-400">
                                    Posted {new Date(job.createdAt).toLocaleDateString()}
                                  </span>
                                </td>

                                <td className="p-3.5 text-slate-600 text-xs">
                                  <span className="flex items-center gap-1">
                                    <MapPin size={12} className="text-slate-400" />
                                    {job.location}
                                  </span>
                                </td>

                                <td className="p-3.5 text-xs">
                                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                                    {job.jobType}
                                  </span>
                                </td>

                                <td className="p-3.5">
                                  <Badge status={job.status} hasDot />
                                </td>

                                <td className="p-3.5 text-right">
                                  <Link to={`/recruiter/applications?jobId=${job.id}`}>
                                    <Button variant="outline" size="sm">
                                      Review
                                    </Button>
                                  </Link>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </Card.Body>
                </Card>

                {/* Recent Applications Card */}
                <Card>
                  <Card.Header>
                    <div className="flex items-center justify-between w-full">
                      <Card.Title>Recent Candidate Submissions</Card.Title>
                      <Link to="/recruiter/applications">
                        <Button variant="ghost" size="sm" rightIcon={<ArrowRight size={14} />}>
                          All Applications
                        </Button>
                      </Link>
                    </div>
                  </Card.Header>
                  <Card.Body noPadding>
                    {applications.length === 0 ? (
                      <div className="p-8">
                        <EmptyState
                          icon={<Users size={32} />}
                          title="No Applications Received"
                          description="As qualified candidates apply to your openings, their submissions will appear here for review."
                        />
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {applications.slice(0, 4).map((app) => (
                          <div
                            key={app.id}
                            className="p-4 hover:bg-slate-50/75 transition-colors flex items-center justify-between gap-4"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
                                {app.candidate?.fullName
                                  ? app.candidate.fullName.charAt(0).toUpperCase()
                                  : 'C'}
                              </div>
                              <div>
                                <h4 className="text-sm font-semibold text-slate-900">
                                  {app.candidate?.fullName || 'Candidate'}
                                </h4>
                                <p className="text-xs text-slate-500">
                                  Applied for <span className="font-medium text-slate-700">{app.job?.title}</span> •{' '}
                                  {app.appliedAt
                                    ? new Date(app.appliedAt).toLocaleDateString()
                                    : 'Recently'}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <Badge status={app.status} hasDot />
                              <Link to={`/recruiter/applications?jobId=${app.job?.id || ''}`}>
                                <Button variant="outline" size="sm">
                                  Review
                                </Button>
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </div>

              {/* Upcoming Interviews (1 col) */}
              <div className="space-y-6">
                <Card>
                  <Card.Header>
                    <div className="flex items-center justify-between w-full">
                      <Card.Title>Upcoming Interviews</Card.Title>
                      <Link to="/recruiter/interviews">
                        <Button variant="ghost" size="sm" rightIcon={<ArrowRight size={14} />}>
                          View
                        </Button>
                      </Link>
                    </div>
                  </Card.Header>
                  <Card.Body>
                    {upcomingInterviews.length === 0 ? (
                      <EmptyState
                        icon={<Calendar size={32} />}
                        title="No Upcoming Sessions"
                        description="Shortlist applications to schedule video or on-site candidate interviews."
                      />
                    ) : (
                      <div className="space-y-3">
                        {upcomingInterviews.slice(0, 4).map((item) => {
                          const date = item.scheduledDateTime
                            ? new Date(item.scheduledDateTime)
                            : null;
                          const formattedDate = date
                            ? date.toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                              })
                            : 'TBD';
                          const formattedTime = date
                            ? date.toLocaleTimeString(undefined, {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : '';

                          return (
                            <div
                              key={item.id}
                              className="p-3.5 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100/80 transition-colors space-y-2"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-slate-900 block truncate max-w-[180px]">
                                  {item.job?.title || 'Technical Round'}
                                </span>
                                <Badge status={item.status} hasDot />
                              </div>

                              <div className="flex items-center justify-between text-xs text-slate-600">
                                <span className="flex items-center gap-1 font-medium text-indigo-700">
                                  <Calendar size={13} /> {formattedDate} at {formattedTime}
                                </span>
                                <span className="capitalize text-[11px] px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-600">
                                  {item.interviewMode?.toLowerCase()}
                                </span>
                              </div>

                              {item.interviewMode === 'ONLINE' && item.meetingLink && (
                                <a
                                  href={item.meetingLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 hover:underline pt-1"
                                >
                                  <Video size={12} /> Launch Video Call <ExternalLink size={11} />
                                </a>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </Card.Body>
                </Card>

                {/* Company Status Snapshot */}
                <Card>
                  <Card.Header>
                    <Card.Title>Organization Status</Card.Title>
                  </Card.Header>
                  <Card.Body>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">Corporate Identity:</span>
                        <span className="font-semibold text-slate-800">
                          {company?.name || 'Not Configured'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">Industry:</span>
                        <span className="font-semibold text-slate-800">
                          {company?.industry || 'N/A'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">Verification:</span>
                        {company?.verified ? (
                          <span className="font-semibold text-emerald-600 flex items-center gap-1">
                            <CheckCircle2 size={13} /> Verified
                          </span>
                        ) : (
                          <span className="font-semibold text-amber-600 flex items-center gap-1">
                            <Clock size={13} /> Pending
                          </span>
                        )}
                      </div>

                      <div className="pt-2 border-t border-slate-100">
                        <Link to="/recruiter/company" className="w-full block">
                          <Button variant="outline" size="sm" className="w-full">
                            Manage Organization
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default RecruiterDashboardPage;
