import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Building,
  MapPin,
  Calendar,
  ExternalLink,
  Search
} from 'lucide-react';
import { DashboardLayout } from '../../components/layout';
import {
  Card,
  Badge,
  Button,
  Select,
  Input,
  Pagination,
  Modal,
  EmptyState,
  ErrorState,
  LoadingSpinner
} from '../../components/ui';
import { applicationService } from '../../api';
import './CandidateApplications.css';

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'APPLIED', label: 'Applied' },
  { value: 'UNDER_REVIEW', label: 'Under Review' },
  { value: 'SHORTLISTED', label: 'Shortlisted' },
  { value: 'INTERVIEW_SCHEDULED', label: 'Interview Scheduled' },
  { value: 'SELECTED', label: 'Selected' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'WITHDRAWN', label: 'Withdrawn' },
];

export const CandidateApplicationsPage = () => {
  const [applications, setApplications] = useState([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Details Modal
  const [selectedApp, setSelectedApp] = useState(null);

  useEffect(() => {
    let isCancelled = false;

    const loadApplications = async () => {
      try {
        const res = await applicationService.getMyApplications({
          page: page - 1,
          size: 10,
          sort: 'appliedAt,desc',
        });

        if (isCancelled) return;

        if (res.success && res.data) {
          const content = res.data.content || [];
          setApplications(content);
          setTotalPages(res.data.totalPages || 1);
          setTotalElements(res.data.totalElements ?? content.length);
        }
      } catch (err) {
        if (!isCancelled) {
          setError(err.message || 'Failed to load applications.');
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    loadApplications();

    return () => {
      isCancelled = true;
    };
  }, [page, refreshKey]);

  // Client-side filtering for search and status
  const filteredApps = applications.filter((app) => {
    const matchesStatus = statusFilter === 'ALL' || app.status === statusFilter;
    const title = app.job?.title?.toLowerCase() || '';
    const comp = app.job?.company?.name?.toLowerCase() || '';
    const q = searchKeyword.toLowerCase().trim();
    const matchesSearch = !q || title.includes(q) || comp.includes(q);
    return matchesStatus && matchesSearch;
  });

  const handleRetry = () => {
    setIsLoading(true);
    setError(null);
    setRefreshKey((p) => p + 1);
  };

  return (
    <DashboardLayout role="candidate" title="My Applications" breadcrumb="Candidate Portal / Applications">
      {/* Top Filter Controls */}
      <div className="applications-filter-bar">
        <div className="applications-filter-bar__search">
          <Input
            placeholder="Search by role or company..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            leftIcon={<Search size={16} />}
          />
        </div>

        <div className="applications-filter-bar__select">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={STATUS_OPTIONS}
          />
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <LoadingSpinner center text="Loading your job applications..." />
      ) : error ? (
        <ErrorState
          title="Could not load applications"
          message={error}
          onRetry={handleRetry}
        />
      ) : filteredApps.length === 0 ? (
        <Card>
          <Card.Body>
            <EmptyState
              icon={<FileText size={32} />}
              title={
                statusFilter !== 'ALL' || searchKeyword
                  ? 'No matching applications found'
                  : 'You have not applied to any jobs yet'
              }
              description={
                statusFilter !== 'ALL' || searchKeyword
                  ? 'Try selecting a different status filter or clearing your search term.'
                  : 'Explore current job openings and submit your application to kick off your hiring journey.'
              }
              action={
                statusFilter !== 'ALL' || searchKeyword ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setStatusFilter('ALL');
                      setSearchKeyword('');
                    }}
                  >
                    Reset Filters
                  </Button>
                ) : (
                  <Link to="/jobs">
                    <Button size="sm">Browse Open Jobs</Button>
                  </Link>
                )
              }
            />
          </Card.Body>
        </Card>
      ) : (
        <>
          <Card>
            <Card.Header>
              <div>
                <Card.Title>Submitted Applications</Card.Title>
                <p className="text-xs text-secondary mt-0.5">
                  Showing {filteredApps.length} of {totalElements} application records
                </p>
              </div>
            </Card.Header>

            <Card.Body noPadding>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-subtle bg-slate-50 text-xs text-secondary">
                      <th className="p-4 font-semibold">Position</th>
                      <th className="p-4 font-semibold">Company</th>
                      <th className="p-4 font-semibold">Location</th>
                      <th className="p-4 font-semibold">Applied Date</th>
                      <th className="p-4 font-semibold">Status</th>
                      <th className="p-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredApps.map((app) => {
                      const jobTitle = app.job?.title || 'Job Application';
                      const companyName = app.job?.company?.name || 'Company';
                      const location = app.job?.location || 'Not Specified';
                      const dateStr = app.appliedAt
                        ? new Date(app.appliedAt).toLocaleDateString(undefined, {
                            dateStyle: 'medium',
                          })
                        : 'Recent';

                      return (
                        <tr
                          key={app.id}
                          className="border-b border-subtle text-sm hover:bg-slate-50 transition-colors"
                        >
                          <td className="p-4">
                            <span className="font-semibold text-slate-900 block">{jobTitle}</span>
                            {app.job?.employmentType && (
                              <span className="text-xs text-muted">{app.job.employmentType}</span>
                            )}
                          </td>
                          <td className="p-4">
                            <span className="text-secondary flex items-center gap-1">
                              <Building size={14} className="text-muted" /> {companyName}
                            </span>
                          </td>
                          <td className="p-4 text-secondary">
                            <span className="flex items-center gap-1 text-xs">
                              <MapPin size={13} className="text-muted" /> {location}
                            </span>
                          </td>
                          <td className="p-4 text-muted text-xs">
                            <span className="flex items-center gap-1">
                              <Calendar size={13} /> {dateStr}
                            </span>
                          </td>
                          <td className="p-4">
                            <Badge status={app.status} hasDot />
                          </td>
                          <td className="p-4 text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedApp(app)}
                            >
                              View Details
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card.Body>
          </Card>

          {totalPages > 1 && (
            <div className="flex justify-center mt-6">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={(p) => setPage(p)}
              />
            </div>
          )}
        </>
      )}

      {/* Application Details & Timeline Modal */}
      {selectedApp && (
        <Modal
          isOpen={Boolean(selectedApp)}
          onClose={() => setSelectedApp(null)}
          title="Application Details"
          subtitle={`Reference ID: #${selectedApp.id}`}
        >
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm-flex-row sm-items-center justify-between p-4 rounded-lg bg-slate-50 border border-subtle gap-2">
              <div>
                <h4 className="font-bold text-slate-900 text-lg">{selectedApp.job?.title}</h4>
                <p className="text-xs text-secondary flex items-center gap-1 mt-0.5">
                  <Building size={13} /> {selectedApp.job?.company?.name || 'Company'}
                  {selectedApp.job?.location && <span>• {selectedApp.job.location}</span>}
                </p>
              </div>
              <div>
                <Badge status={selectedApp.status} hasDot />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs text-secondary p-3 rounded-lg border border-subtle">
              <div>
                <span className="text-muted block">Applied On:</span>
                <span className="font-semibold text-slate-800">
                  {selectedApp.appliedAt ? new Date(selectedApp.appliedAt).toLocaleString() : 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-muted block">Application Deadline:</span>
                <span className="font-semibold text-slate-800">
                  {selectedApp.job?.applicationDeadline
                    ? new Date(selectedApp.job.applicationDeadline).toLocaleDateString()
                    : 'Open until filled'}
                </span>
              </div>
            </div>

            {selectedApp.coverLetter && (
              <div>
                <h5 className="text-xs font-semibold text-secondary uppercase mb-1">
                  Your Submitted Cover Letter
                </h5>
                <div className="p-3 rounded-lg border border-subtle bg-white text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                  {selectedApp.coverLetter}
                </div>
              </div>
            )}

            {selectedApp.statusHistory && selectedApp.statusHistory.length > 0 && (
              <div>
                <h5 className="text-xs font-semibold text-secondary uppercase mb-2">
                  Status Timeline & History
                </h5>
                <div className="app-details-timeline">
                  {selectedApp.statusHistory.map((hist, idx) => (
                    <div key={idx} className="app-details-timeline__step">
                      <div className="app-details-timeline__dot" />
                      <div className="app-details-timeline__status">
                        <Badge status={hist.status} hasDot />
                        <span className="app-details-timeline__date">
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
                    View Original Job
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

export default CandidateApplicationsPage;
