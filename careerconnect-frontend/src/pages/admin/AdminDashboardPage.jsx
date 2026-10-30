import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Building2,
  Briefcase,
  Calendar,
  FileText,
  UserCheck,
  UserX,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  RefreshCw,
  ArrowRight,
} from 'lucide-react';
import { DashboardLayout } from '../../components/layout';
import { Card, Badge, Button, ErrorState, MetricCardSkeleton } from '../../components/ui';
import { adminService } from '../../api';

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

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setDisplayVal(Math.floor(easeOut * (value || 0)));

      if (progress < 1) {
        frameId = requestAnimationFrame(animate);
      } else {
        setDisplayVal(value || 0);
      }
    };

    frameId = requestAnimationFrame(animate);
    return () => {
      if (frameId) cancelAnimationFrame(frameId);
    };
  }, [value]);

  return <span>{displayVal?.toLocaleString() ?? 0}</span>;
};

export const AdminDashboardPage = () => {
  const [dashboard, setDashboard] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let isCancelled = false;

    const fetchDashboard = async () => {
      try {
        setError(null);
        const res = await adminService.getDashboard();
        if (isCancelled) return;
        if (res.success && res.data) {
          setDashboard(res.data);
        } else {
          setError(res.message || 'Failed to load system metrics.');
        }
      } catch (err) {
        if (isCancelled) return;
        setError(err.response?.data?.message || err.message || 'Failed to connect to admin dashboard service.');
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchDashboard();
    return () => {
      isCancelled = true;
    };
  }, [refreshKey]);

  const handleRefresh = () => {
    setIsLoading(true);
    setRefreshKey((k) => k + 1);
  };

  const calculatePercent = (val, total) => {
    if (!total || total === 0 || !val) return 0;
    return Math.round((val / total) * 100);
  };

  return (
    <DashboardLayout
      role="admin"
      title="Platform Governance & Analytics"
      breadcrumb="Admin Center / Overview"
    >
      <div className="space-y-8">
        {/* Top Controls / Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 text-white p-6 rounded-2xl shadow-sm">
          <div>
            <div className="flex items-center gap-2 mb-1 text-amber-400 font-medium text-xs tracking-wider uppercase">
              <ShieldCheck size={16} />
              System Administration Console
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Real-Time Platform Telemetry
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              Global platform health, user distribution, recruitment metrics, and governance status.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
              className="bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700 hover:text-white"
              leftIcon={<RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />}
            >
              Refresh Data
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && !dashboard && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 py-8">
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
          </div>
        )}

        {/* Error State */}
        {error && !dashboard && (
          <ErrorState
            title="Failed to Load Admin Dashboard"
            message={error}
            onRetry={handleRefresh}
          />
        )}

        {/* Dashboard Content */}
        {dashboard && (
          <>
            {/* ================= SECTION A & B: USERS & HEALTH ================= */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">User Ecosystem & Health</h3>
                  <p className="text-xs text-slate-500">Registered roles, authentication status, and active accounts</p>
                </div>
                <Link to="/admin/users">
                  <Button variant="ghost" size="sm" rightIcon={<ArrowRight size={14} />}>
                    Manage Users
                  </Button>
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Users */}
                <Card className="border-l-4 border-l-indigo-500">
                  <Card.Body>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                          Total Users
                        </p>
                        <h4 className="text-3xl font-extrabold text-slate-900">
                          <AnimatedMetric value={dashboard.totalUsers} />
                        </h4>
                      </div>
                      <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                        <Users size={22} />
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <span>Global Registrations</span>
                      <Badge variant="primary">Platform</Badge>
                    </div>
                  </Card.Body>
                </Card>

                {/* Candidates */}
                <Card className="border-l-4 border-l-blue-500">
                  <Card.Body>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                          Candidates
                        </p>
                        <h4 className="text-3xl font-extrabold text-slate-900">
                          <AnimatedMetric value={dashboard.totalCandidates} />
                        </h4>
                      </div>
                      <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                        <UserCheck size={22} />
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <span>Job Seekers</span>
                      <span className="font-semibold text-slate-700">
                        {calculatePercent(dashboard.totalCandidates, dashboard.totalUsers)}% of users
                      </span>
                    </div>
                  </Card.Body>
                </Card>

                {/* Recruiters */}
                <Card className="border-l-4 border-l-emerald-500">
                  <Card.Body>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                          Recruiters
                        </p>
                        <h4 className="text-3xl font-extrabold text-slate-900">
                          <AnimatedMetric value={dashboard.totalRecruiters} />
                        </h4>
                      </div>
                      <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <Briefcase size={22} />
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <span>Hiring Managers</span>
                      <span className="font-semibold text-slate-700">
                        {calculatePercent(dashboard.totalRecruiters, dashboard.totalUsers)}% of users
                      </span>
                    </div>
                  </Card.Body>
                </Card>

                {/* System Administrators */}
                <Card className="border-l-4 border-l-amber-500">
                  <Card.Body>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                          Administrators
                        </p>
                        <h4 className="text-3xl font-extrabold text-slate-900">
                          <AnimatedMetric value={dashboard.totalAdmins} />
                        </h4>
                      </div>
                      <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                        <ShieldCheck size={22} />
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <span>Superusers</span>
                      <Badge variant="warning">Admin</Badge>
                    </div>
                  </Card.Body>
                </Card>
              </div>

              {/* User Health Status Bar */}
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card className="bg-emerald-50/50 border-emerald-200">
                  <Card.Body className="py-3 px-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                          <UserCheck size={16} />
                        </div>
                        <div>
                          <div className="text-xs font-medium text-emerald-800">Enabled & Active Accounts</div>
                          <div className="text-lg font-bold text-emerald-950">
                            <AnimatedMetric value={dashboard.enabledUsers} />
                          </div>
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-emerald-700 bg-emerald-100/80 px-2 py-1 rounded">
                        {calculatePercent(dashboard.enabledUsers, dashboard.totalUsers)}%
                      </span>
                    </div>
                  </Card.Body>
                </Card>

                <Card className="bg-rose-50/50 border-rose-200">
                  <Card.Body className="py-3 px-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
                          <UserX size={16} />
                        </div>
                        <div>
                          <div className="text-xs font-medium text-rose-800">Suspended / Disabled Accounts</div>
                          <div className="text-lg font-bold text-rose-950">
                            <AnimatedMetric value={dashboard.disabledUsers} />
                          </div>
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-rose-700 bg-rose-100/80 px-2 py-1 rounded">
                        {calculatePercent(dashboard.disabledUsers, dashboard.totalUsers)}%
                      </span>
                    </div>
                  </Card.Body>
                </Card>
              </div>
            </div>

            {/* ================= SECTION C & F: JOBS & COMPANIES ================= */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recruitment Activity (Jobs) */}
              <Card>
                <Card.Header className="flex items-center justify-between">
                  <div>
                    <Card.Title className="flex items-center gap-2">
                      <Briefcase size={18} className="text-indigo-600" />
                      Job Postings Governance
                    </Card.Title>
                    <p className="text-xs text-slate-400 mt-0.5">Live marketplace opportunities and closure status</p>
                  </div>
                  <Link to="/admin/jobs">
                    <Button variant="ghost" size="sm" rightIcon={<ArrowRight size={14} />}>
                      View Jobs
                    </Button>
                  </Link>
                </Card.Header>
                <Card.Body className="space-y-4">
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-3 bg-slate-50 rounded-xl">
                      <div className="text-xs text-slate-500 font-medium">Total Postings</div>
                      <div className="text-2xl font-bold text-slate-900 mt-1">
                        <AnimatedMetric value={dashboard.totalJobs} />
                      </div>
                    </div>
                    <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl">
                      <div className="text-xs text-emerald-700 font-medium">Open / Active</div>
                      <div className="text-2xl font-bold text-emerald-800 mt-1">
                        <AnimatedMetric value={dashboard.openJobs} />
                      </div>
                    </div>
                    <div className="p-3 bg-slate-100 rounded-xl">
                      <div className="text-xs text-slate-500 font-medium">Closed</div>
                      <div className="text-2xl font-bold text-slate-700 mt-1">
                        <AnimatedMetric value={dashboard.closedJobs} />
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <div className="text-xs font-semibold text-slate-600 mb-2">Job Categorization Breakdown</div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center justify-between p-3 border border-slate-100 rounded-lg text-sm">
                        <span className="text-slate-600">Regular Positions</span>
                        <span className="font-bold text-slate-900">
                          <AnimatedMetric value={dashboard.totalRegularJobs} />
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 border border-slate-100 rounded-lg text-sm">
                        <span className="text-slate-600">Internships</span>
                        <span className="font-bold text-slate-900">
                          <AnimatedMetric value={dashboard.totalInternships} />
                        </span>
                      </div>
                    </div>
                  </div>
                </Card.Body>
              </Card>

              {/* Company Verification (Governance) */}
              <Card>
                <Card.Header className="flex items-center justify-between">
                  <div>
                    <Card.Title className="flex items-center gap-2">
                      <Building2 size={18} className="text-indigo-600" />
                      Company Verification Status
                    </Card.Title>
                    <p className="text-xs text-slate-400 mt-0.5">Corporate identity audit and trust verification</p>
                  </div>
                  <Link to="/admin/companies">
                    <Button variant="ghost" size="sm" rightIcon={<ArrowRight size={14} />}>
                      View Companies
                    </Button>
                  </Link>
                </Card.Header>
                <Card.Body className="space-y-4">
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-3 bg-slate-50 rounded-xl">
                      <div className="text-xs text-slate-500 font-medium">Registered</div>
                      <div className="text-2xl font-bold text-slate-900 mt-1">
                        <AnimatedMetric value={dashboard.totalCompanies} />
                      </div>
                    </div>
                    <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl">
                      <div className="text-xs text-emerald-700 font-medium">Verified</div>
                      <div className="text-2xl font-bold text-emerald-800 mt-1">
                        <AnimatedMetric value={dashboard.verifiedCompanies} />
                      </div>
                    </div>
                    <div className="p-3 bg-amber-50/70 border border-amber-100 rounded-xl">
                      <div className="text-xs text-amber-700 font-medium">Pending Review</div>
                      <div className="text-2xl font-bold text-amber-800 mt-1">
                        <AnimatedMetric value={dashboard.unverifiedCompanies} />
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                      <span>Verification Progress</span>
                      <span className="font-semibold text-slate-700">
                        {calculatePercent(dashboard.verifiedCompanies, dashboard.totalCompanies)}% Verified
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden flex">
                      <div
                        className="bg-emerald-500 h-full transition-all duration-500"
                        style={{
                          width: `${calculatePercent(dashboard.verifiedCompanies, dashboard.totalCompanies)}%`,
                        }}
                      />
                      <div
                        className="bg-amber-400 h-full transition-all duration-500"
                        style={{
                          width: `${calculatePercent(dashboard.unverifiedCompanies, dashboard.totalCompanies)}%`,
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                        Verified Employers
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                        Unverified / Pending Review
                      </span>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </div>

            {/* ================= SECTION D & E: APPLICATIONS & INTERVIEWS ================= */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Application Status Breakdown */}
              <Card>
                <Card.Header className="flex items-center justify-between">
                  <div>
                    <Card.Title className="flex items-center gap-2">
                      <FileText size={18} className="text-indigo-600" />
                      Applications Funnel ({dashboard.totalApplications?.toLocaleString() || 0})
                    </Card.Title>
                    <p className="text-xs text-slate-400 mt-0.5">Real-time status breakdown across all candidate submissions</p>
                  </div>
                  <Link to="/admin/applications">
                    <Button variant="ghost" size="sm" rightIcon={<ArrowRight size={14} />}>
                      Audit Applications
                    </Button>
                  </Link>
                </Card.Header>
                <Card.Body>
                  <div className="space-y-3">
                    {[
                      { status: 'APPLIED', label: 'Applied (Initial)', color: 'bg-slate-500', badgeVariant: 'secondary' },
                      { status: 'UNDER_REVIEW', label: 'Under Review', color: 'bg-blue-500', badgeVariant: 'primary' },
                      { status: 'SHORTLISTED', label: 'Shortlisted', color: 'bg-indigo-500', badgeVariant: 'info' },
                      { status: 'INTERVIEW_SCHEDULED', label: 'Interview Scheduled', color: 'bg-purple-500', badgeVariant: 'warning' },
                      { status: 'SELECTED', label: 'Selected / Hired', color: 'bg-emerald-500', badgeVariant: 'success' },
                      { status: 'REJECTED', label: 'Rejected', color: 'bg-rose-500', badgeVariant: 'error' },
                      { status: 'WITHDRAWN', label: 'Withdrawn', color: 'bg-slate-400', badgeVariant: 'neutral' },
                    ].map((item) => {
                      const count = dashboard.applicationsByStatus?.[item.status] || 0;
                      const percent = calculatePercent(count, dashboard.totalApplications);

                      return (
                        <div key={item.status} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium text-slate-700 flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${item.color}`} />
                              {item.label}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900">{count.toLocaleString()}</span>
                              <span className="text-slate-400 text-[11px] w-8 text-right">{percent}%</span>
                            </div>
                          </div>
                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`${item.color} h-full transition-all duration-500`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card.Body>
              </Card>

              {/* Interviews Status Breakdown */}
              <Card>
                <Card.Header className="flex items-center justify-between">
                  <div>
                    <Card.Title className="flex items-center gap-2">
                      <Calendar size={18} className="text-indigo-600" />
                      Interview Sessions ({dashboard.totalInterviews?.toLocaleString() || 0})
                    </Card.Title>
                    <p className="text-xs text-slate-400 mt-0.5">Platform interview lifecycle volume and status breakdown</p>
                  </div>
                  <Link to="/admin/interviews">
                    <Button variant="ghost" size="sm" rightIcon={<ArrowRight size={14} />}>
                      Audit Interviews
                    </Button>
                  </Link>
                </Card.Header>
                <Card.Body>
                  <div className="grid grid-cols-3 gap-3 mb-6 text-center">
                    <div className="p-3 bg-purple-50/70 border border-purple-100 rounded-xl">
                      <div className="text-xs text-purple-700 font-medium">Scheduled</div>
                      <div className="text-2xl font-bold text-purple-900 mt-1">
                        {(dashboard.interviewsByStatus?.SCHEDULED || 0).toLocaleString()}
                      </div>
                    </div>
                    <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl">
                      <div className="text-xs text-emerald-700 font-medium">Completed</div>
                      <div className="text-2xl font-bold text-emerald-900 mt-1">
                        {(dashboard.interviewsByStatus?.COMPLETED || 0).toLocaleString()}
                      </div>
                    </div>
                    <div className="p-3 bg-rose-50/70 border border-rose-100 rounded-xl">
                      <div className="text-xs text-rose-700 font-medium">Cancelled</div>
                      <div className="text-2xl font-bold text-rose-900 mt-1">
                        {(dashboard.interviewsByStatus?.CANCELLED || 0).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2 border-t border-slate-100">
                    {[
                      { status: 'SCHEDULED', label: 'Upcoming / Scheduled', color: 'bg-purple-500', icon: Clock },
                      { status: 'COMPLETED', label: 'Successfully Completed', color: 'bg-emerald-500', icon: CheckCircle2 },
                      { status: 'CANCELLED', label: 'Cancelled Sessions', color: 'bg-rose-500', icon: AlertCircle },
                    ].map((item) => {
                      const count = dashboard.interviewsByStatus?.[item.status] || 0;
                      const percent = calculatePercent(count, dashboard.totalInterviews);
                      const Icon = item.icon;

                      return (
                        <div key={item.status} className="p-3 border border-slate-100 rounded-xl flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${item.color} text-white`}>
                              <Icon size={14} />
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-slate-900">{item.label}</div>
                              <div className="text-xs text-slate-400">{percent}% of total sessions</div>
                            </div>
                          </div>
                          <div className="text-base font-bold text-slate-900">{count.toLocaleString()}</div>
                        </div>
                      );
                    })}
                  </div>
                </Card.Body>
              </Card>
            </div>

            {/* Quick Action / Governance Navigation Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 pt-2">
              <Link to="/admin/users" className="block">
                <Card className="hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer">
                  <Card.Body className="p-4 text-center">
                    <Users size={24} className="mx-auto text-indigo-600 mb-2" />
                    <div className="font-bold text-slate-900 text-sm">User Directory</div>
                    <p className="text-xs text-slate-400 mt-1">Audit & toggle accounts</p>
                  </Card.Body>
                </Card>
              </Link>

              <Link to="/admin/companies" className="block">
                <Card className="hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer">
                  <Card.Body className="p-4 text-center">
                    <Building2 size={24} className="mx-auto text-emerald-600 mb-2" />
                    <div className="font-bold text-slate-900 text-sm">Company Directory</div>
                    <p className="text-xs text-slate-400 mt-1">Review & verify employers</p>
                  </Card.Body>
                </Card>
              </Link>

              <Link to="/admin/jobs" className="block">
                <Card className="hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer">
                  <Card.Body className="p-4 text-center">
                    <Briefcase size={24} className="mx-auto text-blue-600 mb-2" />
                    <div className="font-bold text-slate-900 text-sm">Job Governance</div>
                    <p className="text-xs text-slate-400 mt-1">Oversee & force-close</p>
                  </Card.Body>
                </Card>
              </Link>

              <Link to="/admin/applications" className="block">
                <Card className="hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer">
                  <Card.Body className="p-4 text-center">
                    <FileText size={24} className="mx-auto text-amber-600 mb-2" />
                    <div className="font-bold text-slate-900 text-sm">Application Logs</div>
                    <p className="text-xs text-slate-400 mt-1">Audit candidate submissions</p>
                  </Card.Body>
                </Card>
              </Link>

              <Link to="/admin/interviews" className="block">
                <Card className="hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer">
                  <Card.Body className="p-4 text-center">
                    <Calendar size={24} className="mx-auto text-purple-600 mb-2" />
                    <div className="font-bold text-slate-900 text-sm">Interview Oversight</div>
                    <p className="text-xs text-slate-400 mt-1">Audit scheduled sessions</p>
                  </Card.Body>
                </Card>
              </Link>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboardPage;
