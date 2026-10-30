import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Building,
  GraduationCap,
  Award,
  FolderGit2,
  Globe,
  Plus,
  Check,
  X,
} from 'lucide-react';
import { DashboardLayout } from '../../components/layout';
import {
  Card,
  Input,
  Button,
  Badge,
  ErrorState,
} from '../../components/ui';
import { candidateService, resumeService } from '../../api';
import './ResumeImportPage.css';

export const ResumeImportPage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Workflow steps: 'upload' -> 'review' -> 'success'
  const [step, setStep] = useState('upload');

  // Existing Profile state (for overwrite detection)
  const [existingProfile, setExistingProfile] = useState(null);

  // Upload state
  const [selectedFile, setSelectedFile] = useState(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState(null);
  const [warnings, setWarnings] = useState([]);
  const [extractionMetadata, setExtractionMetadata] = useState(null);

  // Editable Draft state
  const [personalDetails, setPersonalDetails] = useState({
    fullName: '',
    phone: '',
    reviewRequiredName: false,
    reviewRequiredPhone: false,
  });
  const [approvePersonalDetailsOverwrite, setApprovePersonalDetailsOverwrite] = useState(false);

  const [socialLinks, setSocialLinks] = useState({
    linkedIn: '',
    gitHub: '',
    portfolio: '',
    reviewRequiredLinkedIn: false,
    reviewRequiredGitHub: false,
    reviewRequiredPortfolio: false,
  });
  const [approveSocialLinksOverwrite, setApproveSocialLinksOverwrite] = useState(false);

  const [educations, setEducations] = useState([]);
  const [experiences, setExperiences] = useState([]);
  const [skills, setSkills] = useState([]);
  const [projects, setProjects] = useState([]);
  const [certifications, setCertifications] = useState([]);

  // New item inputs
  const [customSkill, setCustomSkill] = useState('');

  // Import state
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState(null);
  const [importSummary, setImportSummary] = useState(null);

  // Load candidate profile on mount
  useEffect(() => {
    candidateService.getProfile()
      .then((res) => {
        if (res?.success && res?.data) {
          setExistingProfile(res.data);
        }
      })
      .catch(() => {
        // Ignored; candidate may not have a profile yet
      });
  }, []);

  // Handle file drop / selection
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.match(/\.(pdf|docx)$/i)) {
      setParseError('Please upload a PDF or DOCX resume document.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setParseError('File size must not exceed 10MB.');
      return;
    }

    setSelectedFile(file);
    setParseError(null);
  };

  // Trigger parsing
  const handleParseResume = async () => {
    if (!selectedFile) return;

    setIsParsing(true);
    setParseError(null);

    try {
      const res = await resumeService.parseResume(selectedFile);
      if (res?.success && res?.data) {
        populateDraftData(res.data);
        setStep('review');
      } else {
        setParseError(res?.message || 'Failed to parse resume document.');
      }
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        'Network error parsing resume. Please ensure file is valid.';
      setParseError(message);
    } finally {
      setIsParsing(false);
    }
  };

  // Convert parsed response to editable state
  const populateDraftData = (data) => {
    setWarnings(data.warnings || []);
    setExtractionMetadata(data.extractionMetadata || null);

    // Personal details
    const pd = data.personalDetails;
    setPersonalDetails({
      fullName: pd?.fullName?.value || '',
      phone: pd?.phone?.value || '',
      reviewRequiredName: pd?.fullName?.reviewRequired || false,
      reviewRequiredPhone: pd?.phone?.reviewRequired || false,
    });

    // Social links
    const sl = data.socialLinks;
    setSocialLinks({
      linkedIn: sl?.linkedIn?.value || '',
      gitHub: sl?.gitHub?.value || '',
      portfolio: sl?.portfolio?.value || '',
      reviewRequiredLinkedIn: sl?.linkedIn?.reviewRequired || false,
      reviewRequiredGitHub: sl?.gitHub?.reviewRequired || false,
      reviewRequiredPortfolio: sl?.portfolio?.reviewRequired || false,
    });

    // Educations
    if (Array.isArray(data.educations)) {
      setEducations(
        data.educations.map((edu, idx) => ({
          id: `edu-${idx}`,
          selected: true,
          institution: edu.institution?.value || '',
          degree: edu.degree?.value || '',
          fieldOfStudy: edu.fieldOfStudy?.value || '',
          startDate: edu.startDate?.value || '',
          endDate: edu.endDate?.value || '',
          currentlyStudying: false,
          reviewRequired:
            edu.institution?.reviewRequired ||
            edu.degree?.reviewRequired ||
            edu.startDate?.reviewRequired ||
            edu.endDate?.reviewRequired,
        }))
      );
    }

    // Experiences
    if (Array.isArray(data.experiences)) {
      setExperiences(
        data.experiences.map((exp, idx) => ({
          id: `exp-${idx}`,
          selected: true,
          companyName: exp.companyName?.value || '',
          jobTitle: exp.jobTitle?.value || '',
          description: exp.description?.value || '',
          startDate: exp.startDate?.value || '',
          endDate: exp.endDate?.value || '',
          currentlyWorking: false,
          reviewRequired:
            exp.companyName?.reviewRequired ||
            exp.jobTitle?.reviewRequired ||
            exp.startDate?.reviewRequired ||
            exp.endDate?.reviewRequired,
        }))
      );
    }

    // Skills
    if (Array.isArray(data.skills)) {
      setSkills(
        data.skills.map((skill, idx) => ({
          id: `skill-${idx}`,
          selected: true,
          name: typeof skill === 'string' ? skill : skill.name?.value || skill.name || '',
          reviewRequired: skill.name?.reviewRequired || false,
        }))
      );
    }

    // Projects
    if (Array.isArray(data.projects)) {
      setProjects(
        data.projects.map((proj, idx) => ({
          id: `proj-${idx}`,
          selected: true,
          title: proj.title?.value || '',
          description: proj.description?.value || '',
          technologies: Array.isArray(proj.technologies) ? proj.technologies : [],
          reviewRequired: proj.title?.reviewRequired || proj.description?.reviewRequired,
        }))
      );
    }

    // Certifications
    if (Array.isArray(data.certifications)) {
      setCertifications(
        data.certifications.map((cert, idx) => ({
          id: `cert-${idx}`,
          selected: true,
          name: cert.name?.value || '',
          issuingOrganization: cert.issuingOrganization?.value || '',
          issueDate: '',
          expiryDate: '',
          reviewRequired: cert.name?.reviewRequired || cert.issuingOrganization?.reviewRequired,
        }))
      );
    }
  };

  // Section batch selectors
  const toggleAllSection = (setter, items, select) => {
    setter(items.map((item) => ({ ...item, selected: select })));
  };

  // Overwrite conflict checks
  const hasPersonalDetailsConflict =
    existingProfile &&
    ((personalDetails.fullName &&
      existingProfile.fullName &&
      existingProfile.fullName.trim() !== personalDetails.fullName.trim()) ||
      (personalDetails.phone &&
        existingProfile.phone &&
        existingProfile.phone.trim() !== personalDetails.phone.trim()));

  const hasSocialLinksConflict =
    existingProfile &&
    ((socialLinks.linkedIn &&
      existingProfile.linkedInUrl &&
      existingProfile.linkedInUrl.trim() !== socialLinks.linkedIn.trim()) ||
      (socialLinks.gitHub &&
        existingProfile.gitHubUrl &&
        existingProfile.gitHubUrl.trim() !== socialLinks.gitHub.trim()) ||
      (socialLinks.portfolio &&
        existingProfile.portfolioUrl &&
        existingProfile.portfolioUrl.trim() !== socialLinks.portfolio.trim()));

  // Add custom skill
  const handleAddCustomSkill = () => {
    if (!customSkill.trim()) return;
    const exists = skills.some(
      (s) => s.name.toLowerCase() === customSkill.trim().toLowerCase()
    );
    if (!exists) {
      setSkills((prev) => [
        ...prev,
        {
          id: `skill-custom-${Date.now()}`,
          selected: true,
          name: customSkill.trim(),
          reviewRequired: false,
        },
      ]);
    }
    setCustomSkill('');
  };

  // Execute Import
  const handleExecuteImport = async () => {
    setIsImporting(true);
    setImportError(null);

    const payload = {
      personalDetails: personalDetails.fullName || personalDetails.phone ? {
        fullName: personalDetails.fullName || null,
        phone: personalDetails.phone || null,
      } : null,
      approvePersonalDetailsOverwrite,

      socialLinks: socialLinks.linkedIn || socialLinks.gitHub || socialLinks.portfolio ? {
        linkedIn: socialLinks.linkedIn || null,
        gitHub: socialLinks.gitHub || null,
        portfolio: socialLinks.portfolio || null,
      } : null,
      approveSocialLinksOverwrite,

      educations: educations.map((e) => ({
        selected: e.selected,
        institution: e.institution,
        degree: e.degree,
        fieldOfStudy: e.fieldOfStudy || null,
        startDate: e.startDate || null,
        endDate: e.endDate || null,
        currentlyStudying: e.currentlyStudying,
      })),

      experiences: experiences.map((e) => ({
        selected: e.selected,
        companyName: e.companyName,
        jobTitle: e.jobTitle,
        description: e.description || null,
        startDate: e.startDate || null,
        endDate: e.endDate || null,
        currentlyWorking: e.currentlyWorking,
      })),

      skills: skills.map((s) => ({
        selected: s.selected,
        name: s.name,
      })),

      projects: projects.map((p) => ({
        selected: p.selected,
        title: p.title,
        description: p.description || null,
        technologies: p.technologies?.length ? p.technologies : null,
      })),

      certifications: certifications.map((c) => ({
        selected: c.selected,
        name: c.name,
        issuingOrganization: c.issuingOrganization || null,
        issueDate: c.issueDate || null,
        expiryDate: c.expiryDate || null,
      })),
    };

    try {
      const res = await resumeService.importResume(payload);
      if (res?.success && res?.data) {
        setImportSummary(res.data);
        setStep('success');
      } else {
        setImportError(res?.message || 'Import failed. No valid records imported.');
      }
    } catch (err) {
      if (err.response?.status === 422 && err.response?.data?.data) {
        setImportSummary(err.response.data.data);
        setImportError(err.response.data.message || 'No records could be imported.');
        setStep('success');
      } else {
        setImportError(
          err.response?.data?.message ||
          err.message ||
          'Failed to import selected resume data.'
        );
      }
    } finally {
      setIsImporting(false);
    }
  };

  const selectedCount =
    (personalDetails.fullName || personalDetails.phone ? 1 : 0) +
    (socialLinks.linkedIn || socialLinks.gitHub || socialLinks.portfolio ? 1 : 0) +
    educations.filter((e) => e.selected).length +
    experiences.filter((e) => e.selected).length +
    skills.filter((s) => s.selected).length +
    projects.filter((p) => p.selected).length +
    certifications.filter((c) => c.selected).length;

  return (
    <DashboardLayout role="candidate">
      <div className="resume-import-page">
        {/* Page Header */}
        <div className="resume-import__header">
          <h1 className="resume-import__title">
            <Sparkles className="text-primary" size={28} />
            Resume Intelligence & Import
          </h1>
          <p className="resume-import__subtitle">
            Extract profile data from your existing resume, review and edit each section, and import approved records directly to your CareerConnect profile.
          </p>
        </div>

        {/* Steps Navigation */}
        <div className="resume-steps-nav">
          <div className={`resume-step-indicator ${step === 'upload' ? 'active' : 'completed'}`}>
            <span className="resume-step-badge">1</span>
            <span>Upload Document</span>
          </div>
          <ChevronDivider />
          <div className={`resume-step-indicator ${step === 'review' ? 'active' : step === 'success' ? 'completed' : ''}`}>
            <span className="resume-step-badge">2</span>
            <span>Review & Edit Draft</span>
          </div>
          <ChevronDivider />
          <div className={`resume-step-indicator ${step === 'success' ? 'active' : ''}`}>
            <span className="resume-step-badge">3</span>
            <span>Import Summary</span>
          </div>
        </div>

        {/* Privacy & Safe Extraction Banner */}
        <div className="resume-privacy-banner">
          <ShieldCheck className="resume-privacy-banner__icon" size={24} />
          <div className="resume-privacy-banner__text">
            <h4>Privacy Protected & Candidate Controlled</h4>
            <p>
              Your resume document is processed with deterministic rule-based algorithms. You maintain full granular control: nothing is updated or overwritten on your profile without your explicit review and confirmation.
            </p>
          </div>
        </div>

        {/* STEP 1: UPLOAD */}
        {step === 'upload' && (
          <Card>
            <Card.Body>
              <div
                className="resume-dropzone"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files?.[0]) {
                    handleFileChange({ target: { files: e.dataTransfer.files } });
                  }
                }}
              >
                <div className="resume-dropzone__icon-wrap">
                  <UploadCloud size={32} />
                </div>
                <h3 className="resume-dropzone__title">
                  {selectedFile ? selectedFile.name : 'Select or drag your resume here'}
                </h3>
                <p className="resume-dropzone__desc">
                  Supports PDF or DOCX files up to 10MB in size
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  className="resume-dropzone__input"
                  onChange={handleFileChange}
                />
                <Button
                  variant="outline"
                  size="md"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                >
                  Browse Files
                </Button>
              </div>

              {parseError && (
                <div style={{ marginTop: '1.25rem' }}>
                  <ErrorState
                    title="Extraction Error"
                    message={parseError}
                  />
                </div>
              )}

              {selectedFile && (
                <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                  <Button
                    variant="primary"
                    size="lg"
                    isLoading={isParsing}
                    disabled={isParsing}
                    onClick={handleParseResume}
                    rightIcon={<ArrowRight size={18} />}
                  >
                    Extract & Review Resume
                  </Button>
                </div>
              )}
            </Card.Body>
          </Card>
        )}

        {/* STEP 2: REVIEW & EDIT */}
        {step === 'review' && (
          <div className="resume-sections-list">
            {/* Extraction Info Callout */}
            {extractionMetadata && (
              <div className="card card--default" style={{ padding: '1rem 1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <FileText size={20} className="text-primary" />
                    <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                      {extractionMetadata.fileName}
                    </span>
                    <Badge variant="neutral">{extractionMetadata.fileFormat}</Badge>
                    <Badge variant="success">Rule-Based Extraction</Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedFile(null);
                      setStep('upload');
                    }}
                  >
                    Upload Different File
                  </Button>
                </div>
                {warnings.length > 0 && (
                  <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: '#b45309' }}>
                    <strong>Notices:</strong> {warnings.join(' • ')}
                  </div>
                )}
              </div>
            )}

            {/* Section 1: Personal Details */}
            <Card>
              <Card.Header>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckCircle2 size={18} className="text-primary" />
                  <Card.Title>Personal Details</Card.Title>
                </div>
                <Card.Description>Review extracted name and phone number.</Card.Description>
              </Card.Header>
              <Card.Body>
                {hasPersonalDetailsConflict && (
                  <div className="resume-overwrite-alert">
                    <AlertTriangle size={20} color="#b45309" style={{ flexShrink: 0 }} />
                    <div className="resume-overwrite-alert__content">
                      <div className="resume-overwrite-alert__title">Existing Profile Data Detected</div>
                      <div className="resume-overwrite-alert__desc">
                        Your profile currently has: <strong>{existingProfile.fullName}</strong> ({existingProfile.phone || 'No phone'}).
                        Importing these values will update your profile.
                      </div>
                      <label className="resume-overwrite-checkbox">
                        <input
                          type="checkbox"
                          checked={approvePersonalDetailsOverwrite}
                          onChange={(e) => setApprovePersonalDetailsOverwrite(e.target.checked)}
                        />
                        <span>I approve updating my existing profile personal details</span>
                      </label>
                    </div>
                  </div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                      Full Name
                      {personalDetails.reviewRequiredName && (
                        <span className="resume-review-flag" style={{ marginLeft: '0.5rem' }}>
                          Review Required
                        </span>
                      )}
                    </label>
                    <Input
                      value={personalDetails.fullName}
                      onChange={(e) => setPersonalDetails((p) => ({ ...p, fullName: e.target.value }))}
                      placeholder="Candidate Full Name"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                      Phone Number
                      {personalDetails.reviewRequiredPhone && (
                        <span className="resume-review-flag" style={{ marginLeft: '0.5rem' }}>
                          Review Required
                        </span>
                      )}
                    </label>
                    <Input
                      value={personalDetails.phone}
                      onChange={(e) => setPersonalDetails((p) => ({ ...p, phone: e.target.value }))}
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                </div>
              </Card.Body>
            </Card>

            {/* Section 2: Social & Portfolio Links */}
            <Card>
              <Card.Header>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Globe size={18} className="text-primary" />
                  <Card.Title>Social & Portfolio Links</Card.Title>
                </div>
                <Card.Description>Extracted links to professional profiles.</Card.Description>
              </Card.Header>
              <Card.Body>
                {hasSocialLinksConflict && (
                  <div className="resume-overwrite-alert">
                    <AlertTriangle size={20} color="#b45309" style={{ flexShrink: 0 }} />
                    <div className="resume-overwrite-alert__content">
                      <div className="resume-overwrite-alert__title">Existing Social Links Detected</div>
                      <div className="resume-overwrite-alert__desc">
                        Your profile currently has saved social links. Confirm to overwrite with extracted values.
                      </div>
                      <label className="resume-overwrite-checkbox">
                        <input
                          type="checkbox"
                          checked={approveSocialLinksOverwrite}
                          onChange={(e) => setApproveSocialLinksOverwrite(e.target.checked)}
                        />
                        <span>I approve updating my existing social links</span>
                      </label>
                    </div>
                  </div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                      LinkedIn URL
                      {socialLinks.reviewRequiredLinkedIn && (
                        <span className="resume-review-flag" style={{ marginLeft: '0.5rem' }}>
                          Review
                        </span>
                      )}
                    </label>
                    <Input
                      value={socialLinks.linkedIn}
                      onChange={(e) => setSocialLinks((s) => ({ ...s, linkedIn: e.target.value }))}
                      placeholder="https://linkedin.com/in/username"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                      GitHub URL
                      {socialLinks.reviewRequiredGitHub && (
                        <span className="resume-review-flag" style={{ marginLeft: '0.5rem' }}>
                          Review
                        </span>
                      )}
                    </label>
                    <Input
                      value={socialLinks.gitHub}
                      onChange={(e) => setSocialLinks((s) => ({ ...s, gitHub: e.target.value }))}
                      placeholder="https://github.com/username"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                      Portfolio / Website URL
                      {socialLinks.reviewRequiredPortfolio && (
                        <span className="resume-review-flag" style={{ marginLeft: '0.5rem' }}>
                          Review
                        </span>
                      )}
                    </label>
                    <Input
                      value={socialLinks.portfolio}
                      onChange={(e) => setSocialLinks((s) => ({ ...s, portfolio: e.target.value }))}
                      placeholder="https://yourportfolio.dev"
                    />
                  </div>
                </div>
              </Card.Body>
            </Card>

            {/* Section 3: Education */}
            <Card>
              <Card.Header>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <GraduationCap size={18} className="text-primary" />
                    <Card.Title>Education ({educations.length})</Card.Title>
                  </div>
                  {educations.length > 0 && (
                    <div className="resume-card-header-actions">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleAllSection(setEducations, educations, true)}
                      >
                        Select All
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleAllSection(setEducations, educations, false)}
                      >
                        Deselect All
                      </Button>
                    </div>
                  )}
                </div>
              </Card.Header>
              <Card.Body>
                {educations.length === 0 ? (
                  <p style={{ color: '#64748b', fontSize: '0.9rem', fontStyle: 'italic' }}>
                    No education records detected in resume.
                  </p>
                ) : (
                  educations.map((edu, idx) => (
                    <div
                      key={edu.id}
                      className={`resume-item-card ${
                        edu.selected ? 'resume-item-card--selected' : 'resume-item-card--deselected'
                      }`}
                    >
                      <div className="resume-item-header">
                        <label className="resume-item-checkbox">
                          <input
                            type="checkbox"
                            checked={edu.selected}
                            onChange={(e) => {
                              const updated = [...educations];
                              updated[idx].selected = e.target.checked;
                              setEducations(updated);
                            }}
                          />
                          <span>{edu.institution || `Education Record #${idx + 1}`}</span>
                        </label>
                        {edu.reviewRequired && (
                          <span className="resume-review-flag">
                            <AlertCircle size={12} /> Review Required
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                        <div>
                          <label style={{ fontSize: '0.8rem', color: '#64748b' }}>Institution *</label>
                          <Input
                            value={edu.institution}
                            disabled={!edu.selected}
                            onChange={(e) => {
                              const updated = [...educations];
                              updated[idx].institution = e.target.value;
                              setEducations(updated);
                            }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.8rem', color: '#64748b' }}>Degree *</label>
                          <Input
                            value={edu.degree}
                            disabled={!edu.selected}
                            onChange={(e) => {
                              const updated = [...educations];
                              updated[idx].degree = e.target.value;
                              setEducations(updated);
                            }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.8rem', color: '#64748b' }}>Field of Study</label>
                          <Input
                            value={edu.fieldOfStudy}
                            disabled={!edu.selected}
                            onChange={(e) => {
                              const updated = [...educations];
                              updated[idx].fieldOfStudy = e.target.value;
                              setEducations(updated);
                            }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.8rem', color: '#64748b' }}>Start Date</label>
                          <Input
                            type="date"
                            value={edu.startDate}
                            disabled={!edu.selected}
                            onChange={(e) => {
                              const updated = [...educations];
                              updated[idx].startDate = e.target.value;
                              setEducations(updated);
                            }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.8rem', color: '#64748b' }}>End Date</label>
                          <Input
                            type="date"
                            value={edu.endDate}
                            disabled={!edu.selected || edu.currentlyStudying}
                            onChange={(e) => {
                              const updated = [...educations];
                              updated[idx].endDate = e.target.value;
                              setEducations(updated);
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </Card.Body>
            </Card>

            {/* Section 4: Experience */}
            <Card>
              <Card.Header>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Building size={18} className="text-primary" />
                    <Card.Title>Work Experience ({experiences.length})</Card.Title>
                  </div>
                  {experiences.length > 0 && (
                    <div className="resume-card-header-actions">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleAllSection(setExperiences, experiences, true)}
                      >
                        Select All
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleAllSection(setExperiences, experiences, false)}
                      >
                        Deselect All
                      </Button>
                    </div>
                  )}
                </div>
              </Card.Header>
              <Card.Body>
                {experiences.length === 0 ? (
                  <p style={{ color: '#64748b', fontSize: '0.9rem', fontStyle: 'italic' }}>
                    No experience records detected in resume.
                  </p>
                ) : (
                  experiences.map((exp, idx) => (
                    <div
                      key={exp.id}
                      className={`resume-item-card ${
                        exp.selected ? 'resume-item-card--selected' : 'resume-item-card--deselected'
                      }`}
                    >
                      <div className="resume-item-header">
                        <label className="resume-item-checkbox">
                          <input
                            type="checkbox"
                            checked={exp.selected}
                            onChange={(e) => {
                              const updated = [...experiences];
                              updated[idx].selected = e.target.checked;
                              setExperiences(updated);
                            }}
                          />
                          <span>{exp.jobTitle || exp.companyName || `Role #${idx + 1}`}</span>
                        </label>
                        {exp.reviewRequired && (
                          <span className="resume-review-flag">
                            <AlertCircle size={12} /> Review Required
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '0.75rem' }}>
                        <div>
                          <label style={{ fontSize: '0.8rem', color: '#64748b' }}>Company Name *</label>
                          <Input
                            value={exp.companyName}
                            disabled={!exp.selected}
                            onChange={(e) => {
                              const updated = [...experiences];
                              updated[idx].companyName = e.target.value;
                              setExperiences(updated);
                            }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.8rem', color: '#64748b' }}>Job Title *</label>
                          <Input
                            value={exp.jobTitle}
                            disabled={!exp.selected}
                            onChange={(e) => {
                              const updated = [...experiences];
                              updated[idx].jobTitle = e.target.value;
                              setExperiences(updated);
                            }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.8rem', color: '#64748b' }}>Start Date</label>
                          <Input
                            type="date"
                            value={exp.startDate}
                            disabled={!exp.selected}
                            onChange={(e) => {
                              const updated = [...experiences];
                              updated[idx].startDate = e.target.value;
                              setExperiences(updated);
                            }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.8rem', color: '#64748b' }}>End Date</label>
                          <Input
                            type="date"
                            value={exp.endDate}
                            disabled={!exp.selected || exp.currentlyWorking}
                            onChange={(e) => {
                              const updated = [...experiences];
                              updated[idx].endDate = e.target.value;
                              setExperiences(updated);
                            }}
                          />
                        </div>
                      </div>
                      <div>
                        <label style={{ fontSize: '0.8rem', color: '#64748b' }}>Description / Responsibilities</label>
                        <textarea
                          rows={2}
                          style={{
                            width: '100%',
                            borderRadius: '8px',
                            border: '1px solid #cbd5e1',
                            padding: '0.5rem 0.75rem',
                            fontSize: '0.875rem',
                            fontFamily: 'inherit',
                          }}
                          value={exp.description}
                          disabled={!exp.selected}
                          onChange={(e) => {
                            const updated = [...experiences];
                            updated[idx].description = e.target.value;
                            setExperiences(updated);
                          }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </Card.Body>
            </Card>

            {/* Section 5: Skills */}
            <Card>
              <Card.Header>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Sparkles size={18} className="text-primary" />
                    <Card.Title>Skills ({skills.filter((s) => s.selected).length} selected)</Card.Title>
                  </div>
                  {skills.length > 0 && (
                    <div className="resume-card-header-actions">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleAllSection(setSkills, skills, true)}
                      >
                        Select All
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleAllSection(setSkills, skills, false)}
                      >
                        Deselect All
                      </Button>
                    </div>
                  )}
                </div>
                <Card.Description>Click skill chips to include or exclude them.</Card.Description>
              </Card.Header>
              <Card.Body>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', maxWidth: '350px' }}>
                  <Input
                    placeholder="Add custom skill..."
                    value={customSkill}
                    onChange={(e) => setCustomSkill(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddCustomSkill()}
                  />
                  <Button variant="outline" size="md" onClick={handleAddCustomSkill}>
                    <Plus size={16} />
                  </Button>
                </div>

                <div className="resume-skills-grid">
                  {skills.map((skill, idx) => (
                    <button
                      key={skill.id}
                      type="button"
                      className={`resume-skill-chip ${
                        skill.selected ? 'resume-skill-chip--selected' : 'resume-skill-chip--deselected'
                      }`}
                      onClick={() => {
                        const updated = [...skills];
                        updated[idx].selected = !updated[idx].selected;
                        setSkills(updated);
                      }}
                    >
                      {skill.selected ? <Check size={14} /> : <X size={14} />}
                      <span>{skill.name}</span>
                    </button>
                  ))}
                </div>
              </Card.Body>
            </Card>

            {/* Section 6: Projects */}
            <Card>
              <Card.Header>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FolderGit2 size={18} className="text-primary" />
                    <Card.Title>Projects ({projects.length})</Card.Title>
                  </div>
                  {projects.length > 0 && (
                    <div className="resume-card-header-actions">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleAllSection(setProjects, projects, true)}
                      >
                        Select All
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleAllSection(setProjects, projects, false)}
                      >
                        Deselect All
                      </Button>
                    </div>
                  )}
                </div>
              </Card.Header>
              <Card.Body>
                {projects.length === 0 ? (
                  <p style={{ color: '#64748b', fontSize: '0.9rem', fontStyle: 'italic' }}>
                    No project records detected in resume.
                  </p>
                ) : (
                  projects.map((proj, idx) => (
                    <div
                      key={proj.id}
                      className={`resume-item-card ${
                        proj.selected ? 'resume-item-card--selected' : 'resume-item-card--deselected'
                      }`}
                    >
                      <div className="resume-item-header">
                        <label className="resume-item-checkbox">
                          <input
                            type="checkbox"
                            checked={proj.selected}
                            onChange={(e) => {
                              const updated = [...projects];
                              updated[idx].selected = e.target.checked;
                              setProjects(updated);
                            }}
                          />
                          <span>{proj.title || `Project #${idx + 1}`}</span>
                        </label>
                        {proj.reviewRequired && (
                          <span className="resume-review-flag">
                            <AlertCircle size={12} /> Review Required
                          </span>
                        )}
                      </div>
                      <div style={{ marginBottom: '0.75rem' }}>
                        <label style={{ fontSize: '0.8rem', color: '#64748b' }}>Project Title *</label>
                        <Input
                          value={proj.title}
                          disabled={!proj.selected}
                          onChange={(e) => {
                            const updated = [...projects];
                            updated[idx].title = e.target.value;
                            setProjects(updated);
                          }}
                        />
                      </div>
                      <div style={{ marginBottom: '0.75rem' }}>
                        <label style={{ fontSize: '0.8rem', color: '#64748b' }}>Description</label>
                        <textarea
                          rows={2}
                          style={{
                            width: '100%',
                            borderRadius: '8px',
                            border: '1px solid #cbd5e1',
                            padding: '0.5rem 0.75rem',
                            fontSize: '0.875rem',
                            fontFamily: 'inherit',
                          }}
                          value={proj.description}
                          disabled={!proj.selected}
                          onChange={(e) => {
                            const updated = [...projects];
                            updated[idx].description = e.target.value;
                            setProjects(updated);
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.8rem', color: '#64748b' }}>Technologies (comma separated)</label>
                        <Input
                          value={proj.technologies?.join(', ') || ''}
                          disabled={!proj.selected}
                          onChange={(e) => {
                            const updated = [...projects];
                            updated[idx].technologies = e.target.value
                              .split(',')
                              .map((t) => t.trim())
                              .filter(Boolean);
                            setProjects(updated);
                          }}
                          placeholder="e.g. Java, React, Spring Boot, MySQL"
                        />
                      </div>
                    </div>
                  ))
                )}
              </Card.Body>
            </Card>

            {/* Section 7: Certifications */}
            <Card>
              <Card.Header>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Award size={18} className="text-primary" />
                    <Card.Title>Certifications ({certifications.length})</Card.Title>
                  </div>
                  {certifications.length > 0 && (
                    <div className="resume-card-header-actions">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleAllSection(setCertifications, certifications, true)}
                      >
                        Select All
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleAllSection(setCertifications, certifications, false)}
                      >
                        Deselect All
                      </Button>
                    </div>
                  )}
                </div>
              </Card.Header>
              <Card.Body>
                {certifications.length === 0 ? (
                  <p style={{ color: '#64748b', fontSize: '0.9rem', fontStyle: 'italic' }}>
                    No certifications detected in resume.
                  </p>
                ) : (
                  certifications.map((cert, idx) => (
                    <div
                      key={cert.id}
                      className={`resume-item-card ${
                        cert.selected ? 'resume-item-card--selected' : 'resume-item-card--deselected'
                      }`}
                    >
                      <div className="resume-item-header">
                        <label className="resume-item-checkbox">
                          <input
                            type="checkbox"
                            checked={cert.selected}
                            onChange={(e) => {
                              const updated = [...certifications];
                              updated[idx].selected = e.target.checked;
                              setCertifications(updated);
                            }}
                          />
                          <span>{cert.name || `Certification #${idx + 1}`}</span>
                        </label>
                        {cert.reviewRequired && (
                          <span className="resume-review-flag">
                            <AlertCircle size={12} /> Review Required
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                        <div>
                          <label style={{ fontSize: '0.8rem', color: '#64748b' }}>Certification Name *</label>
                          <Input
                            value={cert.name}
                            disabled={!cert.selected}
                            onChange={(e) => {
                              const updated = [...certifications];
                              updated[idx].name = e.target.value;
                              setCertifications(updated);
                            }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.8rem', color: '#64748b' }}>Issuing Organization</label>
                          <Input
                            value={cert.issuingOrganization}
                            disabled={!cert.selected}
                            onChange={(e) => {
                              const updated = [...certifications];
                              updated[idx].issuingOrganization = e.target.value;
                              setCertifications(updated);
                            }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.8rem', color: '#64748b' }}>Issue Date</label>
                          <Input
                            type="date"
                            value={cert.issueDate}
                            disabled={!cert.selected}
                            onChange={(e) => {
                              const updated = [...certifications];
                              updated[idx].issueDate = e.target.value;
                              setCertifications(updated);
                            }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.8rem', color: '#64748b' }}>Expiry Date</label>
                          <Input
                            type="date"
                            value={cert.expiryDate}
                            disabled={!cert.selected}
                            onChange={(e) => {
                              const updated = [...certifications];
                              updated[idx].expiryDate = e.target.value;
                              setCertifications(updated);
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </Card.Body>
            </Card>

            {/* Error Message if import fails */}
            {importError && (
              <ErrorState
                title="Import Failed"
                message={importError}
              />
            )}

            {/* Bottom Floating Action Bar */}
            <div className="resume-action-bar">
              <div className="resume-action-bar__info">
                <strong>{selectedCount}</strong> items selected for import
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedFile(null);
                    setStep('upload');
                  }}
                  disabled={isImporting}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  isLoading={isImporting}
                  disabled={isImporting || selectedCount === 0}
                  onClick={handleExecuteImport}
                  rightIcon={<ArrowRight size={16} />}
                >
                  Approve & Import Selected ({selectedCount})
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: SUCCESS & IMPORT SUMMARY */}
        {step === 'success' && importSummary && (
          <Card>
            <Card.Header>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: '#dcfce7',
                    color: '#15803d',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <Card.Title>Resume Import Finished</Card.Title>
                  <Card.Description>
                    Approved information has been persisted to your CareerConnect candidate profile.
                  </Card.Description>
                </div>
              </div>
            </Card.Header>
            <Card.Body>
              {/* Summary Stats Grid */}
              <div className="resume-summary-grid">
                <div className="resume-summary-stat resume-summary-stat--imported">
                  <div className="resume-summary-stat__label">Educations</div>
                  <div className="resume-summary-stat__value">
                    {importSummary.educations?.imported || 0}
                  </div>
                </div>
                <div className="resume-summary-stat resume-summary-stat--imported">
                  <div className="resume-summary-stat__label">Experiences</div>
                  <div className="resume-summary-stat__value">
                    {importSummary.experiences?.imported || 0}
                  </div>
                </div>
                <div className="resume-summary-stat resume-summary-stat--imported">
                  <div className="resume-summary-stat__label">Skills Added</div>
                  <div className="resume-summary-stat__value">
                    {importSummary.skills?.imported || 0}
                  </div>
                </div>
                <div className="resume-summary-stat resume-summary-stat--imported">
                  <div className="resume-summary-stat__label">Projects</div>
                  <div className="resume-summary-stat__value">
                    {importSummary.projects?.imported || 0}
                  </div>
                </div>
                <div className="resume-summary-stat resume-summary-stat--imported">
                  <div className="resume-summary-stat__label">Certifications</div>
                  <div className="resume-summary-stat__value">
                    {importSummary.certifications?.imported || 0}
                  </div>
                </div>
              </div>

              {/* Any skipped records / warnings */}
              {importSummary.errors && importSummary.errors.length > 0 && (
                <div className="resume-errors-list">
                  <h4>Information & Skip Notices ({importSummary.errors.length}):</h4>
                  <ul>
                    {importSummary.errors.map((err, i) => (
                      <li key={i}>
                        <strong>[{err.section}]</strong> Record #{err.index + 1}: {err.reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedFile(null);
                    setImportSummary(null);
                    setStep('upload');
                  }}
                >
                  Import Another Resume
                </Button>
                <Button
                  variant="primary"
                  onClick={() => navigate('/candidate/profile')}
                  rightIcon={<ArrowRight size={16} />}
                >
                  View Updated Profile
                </Button>
              </div>
            </Card.Body>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

const ChevronDivider = () => (
  <span style={{ color: '#cbd5e1', fontSize: '1.25rem', margin: '0 0.5rem' }}>›</span>
);

export default ResumeImportPage;
