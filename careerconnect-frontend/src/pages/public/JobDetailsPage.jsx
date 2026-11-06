import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Building,
  MapPin,
  Briefcase,
  Calendar,
  Bookmark,
  CheckCircle,
  ExternalLink,
  Users,
  FileText,
  CheckCircle2,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context';
import { Navbar, Footer } from '../../components/layout';
import { Button, Card, Badge, Modal, Input, LoadingSpinner, ErrorState, useToast } from '../../components/ui';
import { JobCard } from '../../components/jobs';
import { getJobById, getRelatedJobs, MOCK_JOBS } from '../../data/mockJobs';
import { jobService, applicationService, savedJobService } from '../../api';
import './JobDetailsPage.css';

export const JobDetailsPage = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const toast = useToast();

  const [job, setJob] = useState(null);
  const [isLoadingJob, setIsLoadingJob] = useState(true);
  const [jobError, setJobError] = useState(null);

  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [alreadyApplied, setAlreadyApplied] = useState(false);

  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [applicationSubmitted, setApplicationSubmitted] = useState(false);
  const [applicationError, setApplicationError] = useState('');
  const [actionFeedback, setActionFeedback] = useState(null);

  // Application form fields
  const [formData, setFormData] = useState(() => ({
    name: user?.email ? user.email.split('@')[0] : 'Alex Johnson',
    email: user?.email || 'candidate@example.com',
    phone: '+91 98765 43210',
    portfolio: 'https://github.com',
    note: ''
  }));

  // Scroll to top when jobId changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [jobId]);

  // Normalization helper ensuring consistency between backend DTO and mock structures
  const normalizeJob = useCallback((rawJob) => {
    if (!rawJob) return null;
    const companyName =
      typeof rawJob.company === 'object' && rawJob.company !== null
        ? rawJob.company.name || 'Company'
        : rawJob.company || 'Company';

    const companyInfo =
      typeof rawJob.company === 'object' && rawJob.company !== null
        ? {
            name: rawJob.company.name || 'Company',
            about:
              rawJob.company.about ||
              rawJob.company.description ||
              'A forward-thinking organization hiring top talent.',
            industry: rawJob.company.industry || 'Technology',
            size: rawJob.company.companySize || rawJob.company.size || '100-500 employees',
            founded: rawJob.company.foundedYear ? String(rawJob.company.foundedYear) : '2018',
            headquarters:
              rawJob.company.headquarters ||
              rawJob.company.location ||
              rawJob.location ||
              'Bangalore, India',
            website: rawJob.company.website || 'https://careerconnect.example.com'
          }
        : rawJob.companyInfo || {
            name: companyName,
            about: 'A leading team empowering professionals.',
            industry: 'Technology',
            size: '100-500 employees',
            founded: '2018',
            headquarters: rawJob.location || 'Bangalore, India',
            website: 'https://careerconnect.example.com'
          };

    const tags =
      rawJob.tags ||
      (Array.isArray(rawJob.requiredSkills)
        ? rawJob.requiredSkills.map((s) => (typeof s === 'string' ? s : s.name))
        : typeof rawJob.requiredSkills === 'string' && rawJob.requiredSkills.trim().length > 0
        ? rawJob.requiredSkills.split(',').map((s) => s.trim()).filter(Boolean)
        : []);

    const salaryStr =
      rawJob.salary ||
      (rawJob.minSalary
        ? `₹${rawJob.minSalary.toLocaleString()}${rawJob.maxSalary ? ` - ₹${rawJob.maxSalary.toLocaleString()}` : ''}`
        : 'Competitive compensation');

    const experienceStr =
      rawJob.experience ||
      (rawJob.minExperience !== undefined
        ? `${rawJob.minExperience}+ Years Experience`
        : 'Flexible experience');

    const postedDateStr =
      rawJob.postedDate ||
      (rawJob.createdAt ? new Date(rawJob.createdAt).toLocaleDateString() : 'Recently');

    return {
      id: rawJob.id,
      title: rawJob.title,
      company: companyName,
      companyLogoColor: rawJob.companyLogoColor || '#2563eb',
      companyInfo,
      location: rawJob.location || 'Remote',
      locationType: rawJob.locationType || (rawJob.jobType ? rawJob.jobType : 'Full-time'),
      salary: salaryStr,
      experience: experienceStr,
      postedDate: postedDateStr,
      applicantsCount: rawJob.applicantsCount ?? 0,
      description: rawJob.description || '',
      responsibilities:
        rawJob.responsibilities || (rawJob.description ? [rawJob.description] : []),
      requirements: rawJob.requirements || tags,
      tags,
      benefits: rawJob.benefits || [
        'Comprehensive health coverage',
        'Flexible work-from-home policy',
        'Continuous learning & certifications allowance',
        'Competitive compensation package'
      ],
      category: rawJob.category || 'Engineering',
      type: rawJob.type || rawJob.employmentType || 'Full-time',
      status: rawJob.status || 'OPEN'
    };
  }, []);

  // Fetch job details from backend or fallback to mock
  useEffect(() => {
    let isCancelled = false;

    const fetchJobDetails = async () => {
      setIsLoadingJob(true);
      setJobError(null);
      try {
        let loadedJob = null;
        try {
          const res = await jobService.getPublicJob(jobId);
          if (res && res.data) {
            loadedJob = normalizeJob(res.data);
          }
        } catch {
          // Backend lookup failed, fallback to mock data if matches ID
          const mockJob =
            getJobById(jobId) || MOCK_JOBS.find((j) => String(j.id) === String(jobId));
          if (mockJob) {
            loadedJob = normalizeJob(mockJob);
          }
        }

        if (isCancelled) return;

        if (loadedJob) {
          setJob(loadedJob);
        } else {
          setJobError('The requested job position could not be found.');
        }
      } catch (err) {
        if (!isCancelled) {
          setJobError(err.message || 'Failed to load job details.');
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingJob(false);
        }
      }
    };

    fetchJobDetails();

    return () => {
      isCancelled = true;
    };
  }, [jobId, normalizeJob]);

  // Sync candidate bookmark & application status
  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'CANDIDATE' || !jobId) {
      return;
    }

    let isCancelled = false;

    const checkCandidateStatus = async () => {
      try {
        const savedRes = await savedJobService.getMySavedJobs({ size: 100 });
        if (!isCancelled && savedRes?.data?.content) {
          const isItemSaved = savedRes.data.content.some((item) => {
            const id = item.job?.id ?? item.id;
            return String(id) === String(jobId);
          });
          setIsSaved(isItemSaved);
        }
      } catch {
        // Silently catch saved lookup errors
      }

      try {
        const appRes = await applicationService.getMyApplications({ size: 100 });
        if (!isCancelled && appRes?.data?.content) {
          const hasApplied = appRes.data.content.some((app) => {
            const appliedJobId = app.job?.id ?? app.jobId;
            return String(appliedJobId) === String(jobId);
          });
          setAlreadyApplied(hasApplied);
        }
      } catch {
        // Silently catch application lookup errors
      }
    };

    checkCandidateStatus();

    return () => {
      isCancelled = true;
    };
  }, [isAuthenticated, user, jobId]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveToggle = async () => {
    if (!isAuthenticated) {
      navigate('/login', {
        state: {
          from: location,
          action: 'save',
          jobId: job?.id || jobId
        }
      });
      return;
    }

    if (user?.role !== 'CANDIDATE') {
      setActionFeedback({
        type: 'warning',
        message: 'Only candidates can save jobs. Please sign in with a candidate account.'
      });
      return;
    }

    if (isSaving || !job) return;

    setIsSaving(true);
    setActionFeedback(null);
    try {
      if (isSaved) {
        await savedJobService.removeSavedJob(job.id);
        setIsSaved(false);
        toast.info('Job removed from your saved bookmarks.');
        setActionFeedback({
          type: 'success',
          message: 'Job removed from your saved bookmarks.'
        });
      } else {
        await savedJobService.saveJob(job.id);
        setIsSaved(true);
        toast.success('Job successfully saved to your bookmarks!');
        setActionFeedback({
          type: 'success',
          message: 'Job successfully saved to your bookmarks!'
        });
      }
    } catch (err) {
      toast.error('Failed to update saved job status.');
      setActionFeedback({
        type: 'warning',
        message: err.response?.data?.message || err.message || 'Failed to update saved job status.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleApplyClick = () => {
    if (!isAuthenticated) {
      navigate('/login', {
        state: {
          from: location,
          action: 'apply',
          jobId: job?.id || jobId
        }
      });
      return;
    }

    if (user?.role !== 'CANDIDATE') {
      setActionFeedback({
        type: 'warning',
        message: 'Only candidates can apply for jobs. Please sign in with a candidate account.'
      });
      return;
    }

    if (alreadyApplied) {
      setActionFeedback({
        type: 'info',
        message: 'You have already submitted an application for this position.'
      });
      return;
    }

    if (user?.email) {
      setFormData((prev) => ({
        ...prev,
        email: user.email,
        name: prev.name === 'Alex Johnson' || !prev.name ? user.email.split('@')[0] : prev.name
      }));
    }

    setApplicationError('');
    setApplyModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!job) return;

    setIsSubmitting(true);
    setApplicationError('');
    try {
      await applicationService.applyForJob(job.id, {
        coverLetter:
          formData.note || 'Excited to apply for this opportunity through CareerConnect.'
      });
      setApplicationSubmitted(true);
      setAlreadyApplied(true);
      toast.success(`Application submitted for ${job.title}!`);
    } catch (err) {
      setApplicationError(
        err.response?.data?.message ||
          err.message ||
          'Failed to submit application. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setApplyModalOpen(false);
    setTimeout(() => {
      setApplicationSubmitted(false);
      setApplicationError('');
    }, 300);
  };

  const relatedJobs = job ? getRelatedJobs(job.id, job.category, 2) : [];

  return (
    <div className="job-details-page">
      <Navbar />

      <main className="job-details-page__main">
        <div className="container">
          {/* Back Button */}
          <button
            type="button"
            className="job-details-page__back-btn"
            onClick={() => navigate('/jobs')}
          >
            <ArrowLeft size={16} /> Back to Open Positions
          </button>

          {/* User Feedback Alert */}
          {actionFeedback && (
            <div
              className={`mb-4 p-3 rounded-lg border flex items-center justify-between text-sm ${
                actionFeedback.type === 'warning'
                  ? 'bg-amber-50 border-amber-200 text-amber-800'
                  : actionFeedback.type === 'info'
                    ? 'bg-blue-50 border-blue-200 text-blue-800'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-800'
              }`}
            >
              <div className="flex items-center gap-2">
                {actionFeedback.type === 'warning' ? (
                  <AlertCircle size={16} className="text-amber-600 flex-shrink-0" />
                ) : actionFeedback.type === 'info' ? (
                  <AlertCircle size={16} className="text-blue-600 flex-shrink-0" />
                ) : (
                  <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
                )}
                <span>{actionFeedback.message}</span>
              </div>
              <button
                type="button"
                onClick={() => setActionFeedback(null)}
                className="text-xs opacity-70 hover:opacity-100 ml-3"
                aria-label="Dismiss feedback"
              >
                ✕
              </button>
            </div>
          )}

          {isLoadingJob ? (
            <div className="py-16">
              <LoadingSpinner center text="Loading position details..." />
            </div>
          ) : jobError || !job ? (
            <div className="py-12">
              <ErrorState
                title="Position Unavailable"
                message={jobError || 'The requested job opportunity could not be found.'}
                onRetry={() => navigate('/jobs')}
              />
            </div>
          ) : (
            <>
              {/* Header Card */}
              <div className="job-details-header">
                <div className="job-details-header__top">
                  <div className="job-details-header__company-group">
                    <div
                      className="job-details-header__avatar"
                      style={{ backgroundColor: job.companyLogoColor || '#2563eb' }}
                      aria-hidden="true"
                    >
                      {job.company.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h1 className="job-details-header__title">{job.title}</h1>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-semibold text-slate-700 flex items-center gap-1">
                          <Building size={15} className="text-muted" />
                          {job.company}
                        </span>
                        <Badge status={job.status || 'OPEN'} hasDot />
                        <Badge variant="neutral">Job ID: #{job.id}</Badge>
                      </div>
                    </div>
                  </div>

                  <div className="job-details-header__actions">
                    <Button
                      variant={isSaved ? 'secondary' : 'outline'}
                      size="md"
                      isLoading={isSaving}
                      onClick={handleSaveToggle}
                      leftIcon={<Bookmark size={16} fill={isSaved ? 'currentColor' : 'none'} />}
                    >
                      {isSaved ? 'Saved' : 'Save Job'}
                    </Button>

                    <Button
                      size="lg"
                      variant={alreadyApplied ? 'secondary' : 'primary'}
                      onClick={handleApplyClick}
                      leftIcon={alreadyApplied ? <CheckCircle2 size={16} /> : undefined}
                    >
                      {alreadyApplied ? 'Already Applied' : 'Apply for Position'}
                    </Button>
                  </div>
                </div>

                {/* Header Metadata Strip */}
                <div className="job-details-header__meta-row">
                  <span className="job-details-header__meta-item">
                    <MapPin size={16} className="text-brand" />
                    {job.location} ({job.locationType})
                  </span>
                  <span className="job-details-header__meta-item">
                    <DollarSign size={16} className="text-brand" />
                    {job.salary}
                  </span>
                  <span className="job-details-header__meta-item">
                    <Briefcase size={16} className="text-brand" />
                    {job.experience}
                  </span>
                  <span className="job-details-header__meta-item">
                    <Calendar size={16} className="text-brand" />
                    Posted {job.postedDate}
                  </span>
                  <span className="job-details-header__meta-item">
                    <Users size={16} className="text-brand" />
                    {job.applicantsCount} Applicants
                  </span>
                </div>
              </div>

              {/* Two-Column Layout */}
              <div className="job-details-grid">
                {/* Left Column: Role Details */}
                <div className="space-y-6">
                  <Card>
                    <Card.Body>
                      {/* Overview */}
                      <div className="job-details-section">
                        <h2 className="job-details-section__title">
                          <FileText size={18} className="text-brand" />
                          Role Overview
                        </h2>
                        <p className="job-details-section__content">{job.description}</p>
                      </div>

                      <div className="divider" />

                      {/* Key Responsibilities */}
                      {job.responsibilities && job.responsibilities.length > 0 && (
                        <div className="job-details-section">
                          <h2 className="job-details-section__title">
                            <CheckCircle2 size={18} className="text-brand" />
                            Key Responsibilities
                          </h2>
                          <ul className="job-details-list">
                            {job.responsibilities.map((resp, idx) => (
                              <li key={idx} className="job-details-list__item">
                                <span className="job-details-list__bullet">•</span>
                                <span>{resp}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="divider" />

                      {/* Requirements */}
                      {job.requirements && job.requirements.length > 0 && (
                        <div className="job-details-section">
                          <h2 className="job-details-section__title">
                            <CheckCircle size={18} className="text-brand" />
                            Requirements & Qualifications
                          </h2>
                          <ul className="job-details-list">
                            {job.requirements.map((req, idx) => (
                              <li key={idx} className="job-details-list__item">
                                <span className="job-details-list__bullet">•</span>
                                <span>{req}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="divider" />

                      {/* Skills & Tech Stack */}
                      {job.tags && job.tags.length > 0 && (
                        <div className="job-details-section">
                          <h2 className="job-details-section__title">
                            Required Skills & Technologies
                          </h2>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {job.tags.map((skill) => (
                              <Badge key={skill} variant="neutral">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Benefits */}
                      {job.benefits && job.benefits.length > 0 && (
                        <>
                          <div className="divider" />
                          <div className="job-details-section">
                            <h2 className="job-details-section__title">Benefits & Offerings</h2>
                            <ul className="job-details-list">
                              {job.benefits.map((benefit, idx) => (
                                <li key={idx} className="job-details-list__item">
                                  <span className="job-details-list__bullet">✓</span>
                                  <span>{benefit}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </>
                      )}
                    </Card.Body>
                  </Card>
                </div>

                {/* Right Column: Sidebar */}
                <div className="job-details-sidebar">
                  {/* Quick Summary Card */}
                  <Card>
                    <Card.Header>
                      <Card.Title>Opportunity Summary</Card.Title>
                    </Card.Header>
                    <Card.Body>
                      <div className="job-overview-row">
                        <span className="job-overview-row__label">Role Category</span>
                        <span className="job-overview-row__value">{job.category}</span>
                      </div>
                      <div className="job-overview-row">
                        <span className="job-overview-row__label">Employment Type</span>
                        <span className="job-overview-row__value">{job.type}</span>
                      </div>
                      <div className="job-overview-row">
                        <span className="job-overview-row__label">Work Setup</span>
                        <span className="job-overview-row__value">{job.locationType}</span>
                      </div>
                      <div className="job-overview-row">
                        <span className="job-overview-row__label">Experience Level</span>
                        <span className="job-overview-row__value">{job.experience}</span>
                      </div>
                      <div className="job-overview-row">
                        <span className="job-overview-row__label">Compensation</span>
                        <span className="job-overview-row__value">{job.salary}</span>
                      </div>
                      <div className="job-overview-row">
                        <span className="job-overview-row__label">Total Applicants</span>
                        <span className="job-overview-row__value">
                          {job.applicantsCount} candidates
                        </span>
                      </div>

                      <div className="mt-6">
                        <Button
                          variant={alreadyApplied ? 'secondary' : 'primary'}
                          fullWidth
                          size="lg"
                          onClick={handleApplyClick}
                          leftIcon={alreadyApplied ? <CheckCircle2 size={16} /> : undefined}
                        >
                          {alreadyApplied ? 'Already Applied' : 'Apply Now'}
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>

                  {/* Company Info Card */}
                  {job.companyInfo && (
                    <Card>
                      <Card.Header>
                        <Card.Title>About {job.companyInfo.name}</Card.Title>
                      </Card.Header>
                      <Card.Body>
                        <p className="text-sm text-secondary mb-4 leading-relaxed">
                          {job.companyInfo.about}
                        </p>

                        <div className="job-overview-row">
                          <span className="job-overview-row__label">Industry</span>
                          <span className="job-overview-row__value">
                            {job.companyInfo.industry}
                          </span>
                        </div>
                        <div className="job-overview-row">
                          <span className="job-overview-row__label">Company Size</span>
                          <span className="job-overview-row__value">
                            {job.companyInfo.size}
                          </span>
                        </div>
                        <div className="job-overview-row">
                          <span className="job-overview-row__label">Founded</span>
                          <span className="job-overview-row__value">
                            {job.companyInfo.founded}
                          </span>
                        </div>
                        <div className="job-overview-row">
                          <span className="job-overview-row__label">Headquarters</span>
                          <span className="job-overview-row__value">
                            {job.companyInfo.headquarters}
                          </span>
                        </div>

                        <div className="mt-4">
                          <a
                            href={job.companyInfo.website}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-block w-full"
                          >
                            <Button
                              variant="outline"
                              fullWidth
                              size="sm"
                              rightIcon={<ExternalLink size={14} />}
                            >
                              Visit Company Website
                            </Button>
                          </a>
                        </div>
                      </Card.Body>
                    </Card>
                  )}
                </div>
              </div>

              {/* Related Opportunities Section */}
              {relatedJobs.length > 0 && (
                <div className="mt-12">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900">Similar Positions</h2>
                      <p className="text-sm text-secondary mt-1">
                        Other {job.category} openings that match your skill profile
                      </p>
                    </div>
                    <Link to="/jobs">
                      <Button variant="ghost" size="sm">
                        View All Opportunities
                      </Button>
                    </Link>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {relatedJobs.map((relJob) => (
                      <JobCard key={relJob.id} job={relJob} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Application Confirmation Modal */}
      {job && (
        <Modal
          isOpen={applyModalOpen}
          onClose={handleCloseModal}
          title={applicationSubmitted ? 'Application Sent!' : `Apply for ${job.title}`}
          subtitle={
            applicationSubmitted
              ? undefined
              : `Submitting your profile to ${job.company} for Job #${job.id}`
          }
          footer={
            applicationSubmitted ? (
              <Button variant="primary" onClick={handleCloseModal}>
                Close & Return
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={handleCloseModal} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleFormSubmit}
                  isLoading={isSubmitting}
                >
                  Submit Application
                </Button>
              </>
            )
          }
        >
          {applicationSubmitted ? (
            <div className="apply-modal-success">
              <div className="apply-modal-success__icon">
                <CheckCircle size={32} />
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-1">
                Application Successfully Delivered
              </h4>
              <p className="text-sm text-secondary max-w-sm mx-auto mb-4 leading-relaxed">
                Your application for <strong>{job.title}</strong> at{' '}
                <strong>{job.company}</strong> (Job #{job.id}) has been forwarded to their talent
                team. You can track progress in your Candidate Portal.
              </p>
              <Badge status="SHORTLISTED" hasDot />
            </div>
          ) : (
            <form onSubmit={handleFormSubmit} className="apply-modal-form">
              {applicationError && (
                <div className="p-3 mb-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
                  <AlertCircle size={15} className="flex-shrink-0 text-rose-600" />
                  <span>{applicationError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Full Name"
                  required
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                />
                <Input
                  label="Email Address"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Phone Number"
                  required
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                />
                <Input
                  label="Portfolio or GitHub URL"
                  placeholder="https://..."
                  value={formData.portfolio}
                  onChange={(e) => handleInputChange('portfolio', e.target.value)}
                />
              </div>

              <div>
                <label className="input-label" htmlFor="cover-note">
                  Short Note / Why you are a great fit
                </label>
                <textarea
                  id="cover-note"
                  rows={3}
                  className="input-field"
                  placeholder="Highlight your key projects, tech stack experience, or availability..."
                  value={formData.note}
                  onChange={(e) => handleInputChange('note', e.target.value)}
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-subtle text-xs text-secondary">
                <p>
                  ✓ Your saved resume and verified education records will be automatically attached.
                </p>
              </div>
            </form>
          )}
        </Modal>
      )}

      <Footer />
    </div>
  );
};

export default JobDetailsPage;
