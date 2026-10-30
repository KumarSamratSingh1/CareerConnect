import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Briefcase, Bookmark, ArrowRight, Clock } from 'lucide-react';
import { Badge } from '../ui/Badge';
import './JobCard.css';

/**
 * Polished Job Card component adhering to the F8.3 SaaS visual system:
 * - Clear hierarchy with Title as primary focal point
 * - Soft brand-tinted squircle company logo (no random rainbow colors)
 * - Zero colored top lines
 * - Pop burst animation strictly upon API-confirmed save transition
 * - View Details CTA with subtle hover arrow translation
 */
export const JobCard = ({ job, onSaveToggle, isSaved: controlledSaved, index = 0 }) => {
  const [internalSaved, setInternalSaved] = useState(false);
  const isSaved = controlledSaved !== undefined ? controlledSaved : internalSaved;
  const prevSavedRef = useRef(isSaved);
  const [isBursting, setIsBursting] = useState(false);

  // Trigger burst/pop ONLY when isSaved transitions from false to true (API confirmation)
  useEffect(() => {
    let resetTimer;
    let burstTimer;
    if (!prevSavedRef.current && isSaved) {
      burstTimer = setTimeout(() => {
        setIsBursting(true);
        resetTimer = setTimeout(() => setIsBursting(false), 400);
      }, 0);
    }
    prevSavedRef.current = isSaved;
    return () => {
      if (burstTimer) clearTimeout(burstTimer);
      if (resetTimer) clearTimeout(resetTimer);
    };
  }, [isSaved]);

  const handleBookmarkClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onSaveToggle) {
      onSaveToggle(job.id);
    } else {
      setInternalSaved((prev) => !prev);
    }
  };

  const companyName = typeof job.company === 'object' && job.company !== null
    ? (job.company.name || 'Company')
    : (job.company || 'Company');

  const getInitial = (name) => {
    return name && typeof name === 'string' ? name.charAt(0).toUpperCase() : 'J';
  };

  const locationTypeStr = job.locationType || (job.jobType ? job.jobType : '');
  const experienceStr = job.experience || (job.minExperience !== undefined ? `${job.minExperience}+ Yrs Exp` : 'Experience Flexible');
  const jobTypeStr = job.type || job.employmentType || 'Full-time';
  const salaryStr = job.salary || (job.minSalary ? `₹${job.minSalary.toLocaleString()}${job.maxSalary ? ` - ₹${job.maxSalary.toLocaleString()}` : ''}` : 'Competitive');
  const postedDateStr = job.postedDate || (job.createdAt ? new Date(job.createdAt).toLocaleDateString() : 'Recently');
  const tagsList = job.tags || (Array.isArray(job.requiredSkills) ? job.requiredSkills.map(s => (typeof s === 'string' ? s : s.name)) : []);

  return (
    <div className="job-card" style={{ '--card-index': index }}>
      <div className="job-card__inner">
        {/* Row 1: Company + Save Button */}
        <div className="job-card__header">
          <div className="job-card__company-group">
            <div className="job-card__avatar" aria-hidden="true">
              {getInitial(companyName)}
            </div>
            <span className="job-card__company-name">{companyName}</span>
          </div>

          <button
            type="button"
            className={`job-card__bookmark-btn ${isSaved ? 'saved' : ''} ${isBursting ? 'burst' : ''}`}
            onClick={handleBookmarkClick}
            aria-label={isSaved ? `Remove ${job.title} from saved jobs` : `Save ${job.title}`}
            title={isSaved ? 'Saved' : 'Save Job'}
          >
            <Bookmark size={16} fill={isSaved ? 'currentColor' : 'none'} />
          </button>
        </div>

        {/* Row 2: Job Title (Visual Focal Point) */}
        <div className="job-card__title-group">
          <Link to={`/jobs/${job.id}`} className="job-card__title">
            {job.title}
          </Link>
        </div>

        {/* Row 3: Metadata & Status Badges */}
        <div className="job-card__meta-row">
          <span className="job-card__meta-item">
            <MapPin size={13} className="text-muted flex-shrink-0" />
            <span className="truncate max-w-[150px]">
              {job.location || 'Flexible'}{locationTypeStr ? ` (${locationTypeStr})` : ''}
            </span>
          </span>
          <span className="job-card__meta-item">
            <Briefcase size={13} className="text-muted flex-shrink-0" />
            <span>{experienceStr}</span>
          </span>
          <Badge variant={jobTypeStr === 'Internship' ? 'warning' : 'primary'}>
            {jobTypeStr}
          </Badge>
          {job.urgent && (
            <Badge variant="danger">Actively Hiring</Badge>
          )}
        </div>

        {/* Row 4: Skills Metadata */}
        {tagsList && tagsList.length > 0 && (
          <div className="job-card__skills">
            {tagsList.slice(0, 4).map((tag, idx) => (
              <span key={idx} className="job-card__skill-tag">
                {tag}
              </span>
            ))}
            {tagsList.length > 4 && (
              <span className="job-card__skill-tag job-card__skill-tag--more">
                +{tagsList.length - 4} more
              </span>
            )}
          </div>
        )}

        {/* Row 5: Footer with Salary & Details CTA */}
        <div className="job-card__footer">
          <div className="job-card__compensation">
            <div className="job-card__salary">{salaryStr}</div>
            <div className="job-card__posted flex items-center gap-1">
              <Clock size={11} />
              <span>{postedDateStr}</span>
            </div>
          </div>

          <Link to={`/jobs/${job.id}`} className="job-card__cta-link" tabIndex={-1}>
            <span className="job-card__cta-btn">
              <span>View Details</span>
              <ArrowRight size={14} className="job-card__cta-icon" />
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default JobCard;
