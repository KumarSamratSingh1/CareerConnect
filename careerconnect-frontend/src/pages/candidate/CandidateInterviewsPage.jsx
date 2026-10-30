import { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Video,
  Building,
  MapPin,
  Phone,
  Info
} from 'lucide-react';
import { DashboardLayout } from '../../components/layout';
import {
  Card,
  Badge,
  Button,
  EmptyState,
  ErrorState,
  LoadingSpinner
} from '../../components/ui';
import { interviewService } from '../../api';
import './CandidateInterviews.css';

export const CandidateInterviewsPage = () => {
  const [interviews, setInterviews] = useState([]);
  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' | 'past'

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let isCancelled = false;

    const loadInterviews = async () => {
      try {
        const res = await interviewService.getMyInterviews({
          page: 0,
          size: 50,
          sort: 'scheduledDateTime,asc',
        });

        if (isCancelled) return;

        if (res.success && res.data) {
          setInterviews(res.data.content || []);
        }
      } catch (err) {
        if (!isCancelled) {
          setError(err.message || 'Failed to load interviews.');
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    loadInterviews();

    return () => {
      isCancelled = true;
    };
  }, [refreshKey]);

  const now = new Date();

  const upcomingInterviews = interviews.filter((item) => {
    if (item.status === 'COMPLETED' || item.status === 'CANCELLED') return false;
    if (!item.scheduledDateTime) return true;
    return new Date(item.scheduledDateTime) >= now;
  });

  const pastInterviews = interviews.filter((item) => {
    if (item.status === 'COMPLETED' || item.status === 'CANCELLED') return true;
    if (!item.scheduledDateTime) return false;
    return new Date(item.scheduledDateTime) < now;
  });

  const displayedList = activeTab === 'upcoming' ? upcomingInterviews : pastInterviews;

  const handleRetry = () => {
    setIsLoading(true);
    setError(null);
    setRefreshKey((p) => p + 1);
  };

  return (
    <DashboardLayout role="candidate" title="Scheduled Interviews" breadcrumb="Candidate Portal / Interviews">
      {/* Tabs */}
      <div className="interviews-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'upcoming'}
          className={`interviews-tab-btn ${activeTab === 'upcoming' ? 'interviews-tab-btn--active' : ''}`}
          onClick={() => setActiveTab('upcoming')}
        >
          <Calendar size={16} />
          <span>Upcoming Sessions</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
            {upcomingInterviews.length}
          </span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'past'}
          className={`interviews-tab-btn ${activeTab === 'past' ? 'interviews-tab-btn--active' : ''}`}
          onClick={() => setActiveTab('past')}
        >
          <Clock size={16} />
          <span>Past & Completed</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
            {pastInterviews.length}
          </span>
        </button>
      </div>

      {/* Main Content */}
      {isLoading ? (
        <LoadingSpinner center text="Loading your interview schedule..." />
      ) : error ? (
        <ErrorState
          title="Could not load interview schedule"
          message={error}
          onRetry={handleRetry}
        />
      ) : displayedList.length === 0 ? (
        <Card>
          <Card.Body>
            <EmptyState
              icon={<Calendar size={32} />}
              title={
                activeTab === 'upcoming'
                  ? 'No upcoming interviews scheduled'
                  : 'No past interviews found'
              }
              description={
                activeTab === 'upcoming'
                  ? 'When a hiring manager or recruiter schedules a technical or HR round, all connection details and notes will appear here.'
                  : 'You do not have any historical completed or cancelled interview sessions on record.'
              }
            />
          </Card.Body>
        </Card>
      ) : (
        <div>
          {displayedList.map((item) => {
            const jobTitle = item.job?.title || 'Technical Interview Round';
            const companyName = item.job?.company?.name || 'Hiring Organization';
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
              : 'Date to be scheduled';
            const formattedTime = scheduledDate
              ? scheduledDate.toLocaleTimeString(undefined, {
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : 'Time TBD';

            return (
              <div key={item.id} className="interview-card">
                <div className="interview-card__main">
                  <div className="interview-card__title-group">
                    <div className="flex items-center gap-2">
                      <h3 className="interview-card__role">{jobTitle}</h3>
                      <Badge
                        variant={
                          item.status === 'COMPLETED'
                            ? 'success'
                            : item.status === 'CANCELLED'
                            ? 'danger'
                            : 'primary'
                        }
                      >
                        {item.status || 'SCHEDULED'}
                      </Badge>
                    </div>

                    <span className="interview-card__company">
                      <Building size={14} /> {companyName}
                    </span>
                  </div>

                  {/* Actions according to mode */}
                  {item.status === 'SCHEDULED' && item.interviewMode === 'ONLINE' && item.meetingLink && (
                    <a
                      href={item.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button size="sm" leftIcon={<Video size={15} />}>
                        Join Video Call
                      </Button>
                    </a>
                  )}
                </div>

                {/* Metadata Row */}
                <div className="interview-card__meta-grid">
                  <div className="interview-card__meta-item">
                    <Calendar size={15} className="text-brand" />
                    <span>{formattedDate}</span>
                  </div>

                  <div className="interview-card__meta-item">
                    <Clock size={15} className="text-brand" />
                    <span>{formattedTime}</span>
                  </div>

                  <div className="interview-card__meta-item">
                    {item.interviewMode === 'ONLINE' ? (
                      <Video size={15} className="text-brand" />
                    ) : item.interviewMode === 'PHONE' ? (
                      <Phone size={15} className="text-brand" />
                    ) : (
                      <MapPin size={15} className="text-brand" />
                    )}
                    <span>
                      Mode: <strong>{item.interviewMode || 'ONLINE'}</strong>
                      {item.location ? ` (${item.location})` : ''}
                    </span>
                  </div>
                </div>

                {/* Recruiter Notes */}
                {item.notes && (
                  <div className="interview-card__notes flex items-start gap-2">
                    <Info size={15} className="text-brand mt-0.5 flex-shrink-0" />
                    <div>
                      <strong className="block text-slate-800 text-xs mb-0.5">Instructions & Preparation Notes:</strong>
                      <span>{item.notes}</span>
                    </div>
                  </div>
                )}

                {/* Meeting Link Preview when not joined yet */}
                {item.meetingLink && (
                  <div className="mt-2 text-xs text-muted truncate">
                    <span>Meeting link: </span>
                    <a
                      href={item.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand hover:underline"
                    >
                      {item.meetingLink}
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
};

export default CandidateInterviewsPage;
