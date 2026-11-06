import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, ArrowRight, CheckCircle2 } from 'lucide-react';
import { DashboardLayout } from '../../components/layout';
import {
  Card,
  Button,
  Pagination,
  EmptyState,
  ErrorState,
  LoadingSpinner,
  useToast,
} from '../../components/ui';
import { JobCard } from '../../components/jobs/JobCard';
import { savedJobService } from '../../api';
import './CandidateSavedJobs.css';

export const CandidateSavedJobsPage = () => {
  const toast = useToast();
  const [savedJobs, setSavedJobs] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let isCancelled = false;

    const loadSavedJobs = async () => {
      try {
        const res = await savedJobService.getMySavedJobs({
          page: page - 1,
          size: 9,
          sort: 'savedAt,desc',
        });

        if (isCancelled) return;

        if (res.success && res.data) {
          const content = res.data.content || [];
          setSavedJobs(content);
          setTotalPages(res.data.totalPages || 1);
          setTotalElements(res.data.totalElements ?? content.length);
        }
      } catch (err) {
        if (!isCancelled) {
          setError(err.message || 'Failed to load saved jobs.');
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    loadSavedJobs();

    return () => {
      isCancelled = true;
    };
  }, [page, refreshKey]);

  const handleRemoveSavedJob = async (jobId) => {
    try {
      await savedJobService.removeSavedJob(jobId);
      setSavedJobs((prev) => prev.filter((item) => (item.job?.id ?? item.id) !== jobId));
      setTotalElements((prev) => Math.max(0, prev - 1));
      const msg = 'Job removed from your saved list.';
      setFeedback(msg);
      toast.info(msg);
      setTimeout(() => setFeedback(''), 3500);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to remove saved job.';
      setError(msg);
      toast.error(msg);
    }
  };

  const handleRetry = () => {
    setIsLoading(true);
    setError(null);
    setRefreshKey((p) => p + 1);
  };

  return (
    <DashboardLayout role="candidate" title="Saved Opportunities" breadcrumb="Candidate Portal / Saved Jobs">
      {feedback && (
        <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {isLoading ? (
        <LoadingSpinner center text="Loading your saved opportunities..." />
      ) : error ? (
        <ErrorState
          title="Could not load saved jobs"
          message={error}
          onRetry={handleRetry}
        />
      ) : savedJobs.length === 0 ? (
        <Card>
          <Card.Body>
            <EmptyState
              icon={<Bookmark size={32} />}
              title="You have no saved jobs yet"
              description="Keep track of exciting job openings and internships by saving them as you browse."
              action={
                <Link to="/jobs">
                  <Button size="sm" rightIcon={<ArrowRight size={14} />}>
                    Explore Open Opportunities
                  </Button>
                </Link>
              }
            />
          </Card.Body>
        </Card>
      ) : (
        <>
          <div className="saved-jobs-header-stats">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Your Bookmarked Roles</h2>
              <p className="text-xs text-secondary">
                {totalElements} saved {totalElements === 1 ? 'opportunity' : 'opportunities'} available for quick review and application
              </p>
            </div>
            <Link to="/jobs">
              <Button variant="outline" size="sm">
                Browse More Jobs
              </Button>
            </Link>
          </div>

          <div className="saved-jobs-grid">
            {savedJobs.map((item) => {
              const jobData = item.job || item;
              return (
                <JobCard
                  key={item.id || jobData.id}
                  job={jobData}
                  isSaved={true}
                  onSaveToggle={() => handleRemoveSavedJob(jobData.id)}
                />
              );
            })}
          </div>

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
    </DashboardLayout>
  );
};

export default CandidateSavedJobsPage;
