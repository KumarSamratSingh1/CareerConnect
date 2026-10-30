import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  User,
  Mail,
  Phone,
  FileText,
  Building,
  GraduationCap,
  Briefcase,
  Plus,
  Trash2,
  Edit2,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles
} from 'lucide-react';
import { DashboardLayout } from '../../components/layout';
import {
  Card,
  Input,
  Button,
  Badge,
  Modal,
  EmptyState,
  ErrorState,
  LoadingSpinner
} from '../../components/ui';
import { useAuth } from '../../context';
import { candidateService } from '../../api';
import './CandidateProfile.css';

export const CandidateProfilePage = () => {
  const { user } = useAuth();

  // Profile data
  const [profile, setProfile] = useState(null);
  const [educations, setEducations] = useState([]);
  const [experiences, setExperiences] = useState([]);
  const [skills, setSkills] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [globalError, setGlobalError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  // Form states for Basic Profile
  const [basicForm, setBasicForm] = useState({
    fullName: '',
    phone: '',
    resumeUrl: '',
  });
  const [basicSubmitting, setBasicSubmitting] = useState(false);
  const [basicErrors, setBasicErrors] = useState({});

  // Skill Form State
  const [newSkillName, setNewSkillName] = useState('');
  const [skillSubmitting, setSkillSubmitting] = useState(false);

  // Education Modal & Form State
  const [eduModalOpen, setEduModalOpen] = useState(false);
  const [editingEduId, setEditingEduId] = useState(null);
  const [eduForm, setEduForm] = useState({
    institution: '',
    degree: '',
    fieldOfStudy: '',
    startDate: '',
    endDate: '',
    currentlyStudying: false,
  });
  const [eduErrors, setEduErrors] = useState({});
  const [eduSubmitting, setEduSubmitting] = useState(false);

  // Experience Modal & Form State
  const [expModalOpen, setExpModalOpen] = useState(false);
  const [editingExpId, setEditingExpId] = useState(null);
  const [expForm, setExpForm] = useState({
    companyName: '',
    jobTitle: '',
    description: '',
    startDate: '',
    endDate: '',
    currentlyWorking: false,
  });
  const [expErrors, setExpErrors] = useState({});
  const [expSubmitting, setExpSubmitting] = useState(false);

  // Load all profile details
  useEffect(() => {
    let isCancelled = false;

    const loadProfile = async () => {
      try {
        const [profRes, eduRes, expRes, skillRes] = await Promise.allSettled([
          candidateService.getProfile(),
          candidateService.getEducations(),
          candidateService.getExperiences(),
          candidateService.getSkills(),
        ]);

        if (isCancelled) return;

        if (profRes.status === 'fulfilled' && profRes.value?.success && profRes.value?.data) {
          const data = profRes.value.data;
          setProfile(data);
          setBasicForm({
            fullName: data.fullName || '',
            phone: data.phone || '',
            resumeUrl: data.resumeUrl || '',
          });
        }

        if (eduRes.status === 'fulfilled' && eduRes.value?.success && Array.isArray(eduRes.value?.data)) {
          setEducations(eduRes.value.data);
        } else if (profRes.status === 'fulfilled' && profRes.value?.data?.educations) {
          setEducations(profRes.value.data.educations);
        }

        if (expRes.status === 'fulfilled' && expRes.value?.success && Array.isArray(expRes.value?.data)) {
          setExperiences(expRes.value.data);
        } else if (profRes.status === 'fulfilled' && profRes.value?.data?.experiences) {
          setExperiences(profRes.value.data.experiences);
        }

        if (skillRes.status === 'fulfilled' && skillRes.value?.success && Array.isArray(skillRes.value?.data)) {
          setSkills(skillRes.value.data);
        } else if (profRes.status === 'fulfilled' && profRes.value?.data?.skills) {
          setSkills(profRes.value.data.skills);
        }
      } catch (err) {
        if (!isCancelled) {
          setGlobalError(err.message || 'Failed to load profile details.');
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      isCancelled = true;
    };
  }, [refreshKey]);

  // Show temporary feedback toast
  const showFeedback = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  // --- 1. Basic Profile Update ---
  const handleBasicSubmit = async (e) => {
    e.preventDefault();
    setBasicErrors({});

    const errs = {};
    if (!basicForm.fullName.trim()) {
      errs.fullName = 'Full name is required';
    }
    if (basicForm.phone && basicForm.phone.length > 20) {
      errs.phone = 'Phone cannot exceed 20 characters';
    }
    if (basicForm.resumeUrl && !basicForm.resumeUrl.startsWith('http://') && !basicForm.resumeUrl.startsWith('https://')) {
      errs.resumeUrl = 'Resume URL must start with http:// or https://';
    }

    if (Object.keys(errs).length > 0) {
      setBasicErrors(errs);
      return;
    }

    setBasicSubmitting(true);
    try {
      let res;
      if (profile?.id) {
        res = await candidateService.updateProfile(basicForm);
      } else {
        res = await candidateService.createProfile(basicForm);
      }
      if (res.success && res.data) {
        setProfile(res.data);
      }
      showFeedback('Profile information saved successfully!');
    } catch (err) {
      setBasicErrors({ general: err.response?.data?.message || err.message || 'Failed to save profile' });
    } finally {
      setBasicSubmitting(false);
    }
  };

  // --- 2. Skills Handlers ---
  const handleAddSkill = async (e) => {
    e.preventDefault();
    const trimmed = newSkillName.trim();
    if (!trimmed) return;

    if (skills.some((s) => s.name.toLowerCase() === trimmed.toLowerCase())) {
      showFeedback('Skill is already added.');
      return;
    }

    setSkillSubmitting(true);
    try {
      const res = await candidateService.addSkill({ name: trimmed });
      if (res.success && res.data) {
        setSkills((prev) => [...prev, res.data]);
        setNewSkillName('');
        showFeedback(`Added "${trimmed}" to your skills.`);
      }
    } catch (err) {
      setGlobalError(err.response?.data?.message || err.message || 'Could not add skill');
    } finally {
      setSkillSubmitting(false);
    }
  };

  const handleRemoveSkill = async (skillId, skillName) => {
    try {
      await candidateService.removeSkill(skillId);
      setSkills((prev) => prev.filter((s) => s.id !== skillId));
      showFeedback(`Removed skill "${skillName}".`);
    } catch (err) {
      setGlobalError(err.response?.data?.message || err.message || 'Could not remove skill');
    }
  };

  // --- 3. Education Handlers ---
  const openAddEduModal = () => {
    setEditingEduId(null);
    setEduForm({
      institution: '',
      degree: '',
      fieldOfStudy: '',
      startDate: '',
      endDate: '',
      currentlyStudying: false,
    });
    setEduErrors({});
    setEduModalOpen(true);
  };

  const openEditEduModal = (edu) => {
    setEditingEduId(edu.id);
    setEduForm({
      institution: edu.institution || '',
      degree: edu.degree || '',
      fieldOfStudy: edu.fieldOfStudy || '',
      startDate: edu.startDate || '',
      endDate: edu.endDate || '',
      currentlyStudying: Boolean(edu.currentlyStudying),
    });
    setEduErrors({});
    setEduModalOpen(true);
  };

  const handleEduSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!eduForm.institution.trim()) errs.institution = 'Institution is required';
    if (!eduForm.degree.trim()) errs.degree = 'Degree is required';

    if (Object.keys(errs).length > 0) {
      setEduErrors(errs);
      return;
    }

    setEduSubmitting(true);
    try {
      const payload = {
        institution: eduForm.institution.trim(),
        degree: eduForm.degree.trim(),
        fieldOfStudy: eduForm.fieldOfStudy?.trim() || null,
        startDate: eduForm.startDate || null,
        endDate: eduForm.currentlyStudying ? null : (eduForm.endDate || null),
        currentlyStudying: eduForm.currentlyStudying,
      };

      if (editingEduId) {
        const res = await candidateService.updateEducation(editingEduId, payload);
        if (res.success && res.data) {
          setEducations((prev) => prev.map((item) => (item.id === editingEduId ? res.data : item)));
        }
        showFeedback('Education record updated.');
      } else {
        const res = await candidateService.addEducation(payload);
        if (res.success && res.data) {
          setEducations((prev) => [...prev, res.data]);
        }
        showFeedback('Education record added.');
      }
      setEduModalOpen(false);
    } catch (err) {
      setEduErrors({ general: err.response?.data?.message || err.message || 'Failed to save education' });
    } finally {
      setEduSubmitting(false);
    }
  };

  const handleDeleteEdu = async (id) => {
    if (!window.confirm('Are you sure you want to remove this education entry?')) return;
    try {
      await candidateService.deleteEducation(id);
      setEducations((prev) => prev.filter((item) => item.id !== id));
      showFeedback('Education record deleted.');
    } catch (err) {
      setGlobalError(err.response?.data?.message || err.message || 'Failed to delete education');
    }
  };

  // --- 4. Experience Handlers ---
  const openAddExpModal = () => {
    setEditingExpId(null);
    setExpForm({
      companyName: '',
      jobTitle: '',
      description: '',
      startDate: '',
      endDate: '',
      currentlyWorking: false,
    });
    setExpErrors({});
    setExpModalOpen(true);
  };

  const openEditExpModal = (exp) => {
    setEditingExpId(exp.id);
    setExpForm({
      companyName: exp.companyName || '',
      jobTitle: exp.jobTitle || '',
      description: exp.description || '',
      startDate: exp.startDate || '',
      endDate: exp.endDate || '',
      currentlyWorking: Boolean(exp.currentlyWorking),
    });
    setExpErrors({});
    setExpModalOpen(true);
  };

  const handleExpSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!expForm.companyName.trim()) errs.companyName = 'Company name is required';
    if (!expForm.jobTitle.trim()) errs.jobTitle = 'Job title is required';

    if (Object.keys(errs).length > 0) {
      setExpErrors(errs);
      return;
    }

    setExpSubmitting(true);
    try {
      const payload = {
        companyName: expForm.companyName.trim(),
        jobTitle: expForm.jobTitle.trim(),
        description: expForm.description?.trim() || '',
        startDate: expForm.startDate || null,
        endDate: expForm.currentlyWorking ? null : (expForm.endDate || null),
        currentlyWorking: expForm.currentlyWorking,
      };

      if (editingExpId) {
        const res = await candidateService.updateExperience(editingExpId, payload);
        if (res.success && res.data) {
          setExperiences((prev) => prev.map((item) => (item.id === editingExpId ? res.data : item)));
        }
        showFeedback('Experience record updated.');
      } else {
        const res = await candidateService.addExperience(payload);
        if (res.success && res.data) {
          setExperiences((prev) => [...prev, res.data]);
        }
        showFeedback('Experience record added.');
      }
      setExpModalOpen(false);
    } catch (err) {
      setExpErrors({ general: err.response?.data?.message || err.message || 'Failed to save experience' });
    } finally {
      setExpSubmitting(false);
    }
  };

  const handleDeleteExp = async (id) => {
    if (!window.confirm('Are you sure you want to remove this experience entry?')) return;
    try {
      await candidateService.deleteExperience(id);
      setExperiences((prev) => prev.filter((item) => item.id !== id));
      showFeedback('Experience record deleted.');
    } catch (err) {
      setGlobalError(err.response?.data?.message || err.message || 'Failed to delete experience');
    }
  };

  const displayName = basicForm.fullName || user?.email?.split('@')[0] || 'Candidate';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <DashboardLayout role="candidate" title="My Profile" breadcrumb="Candidate Portal / Profile">
      {/* Notifications */}
      {successMessage && (
        <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {globalError && (
        <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-rose-600 flex-shrink-0" />
            <span>{globalError}</span>
          </div>
          <button
            type="button"
            onClick={() => setGlobalError(null)}
            className="text-rose-500 hover:text-rose-700"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {isLoading ? (
        <LoadingSpinner center text="Loading profile details..." />
      ) : globalError && !profile ? (
        <ErrorState
          title="Could not load candidate profile"
          message={globalError}
          onRetry={() => {
            setIsLoading(true);
            setGlobalError(null);
            setRefreshKey((p) => p + 1);
          }}
          className="mb-6"
        />
      ) : (
        <div className="grid grid-cols-1 lg-grid-cols-3 gap-6">
          {/* Left Column: Avatar & Skills */}
          <div className="flex flex-col gap-6">
            {/* Identity Card */}
            <Card>
              <Card.Body>
                <div className="profile-avatar-card">
                  <div className="profile-avatar-circle" aria-hidden="true">
                    {initial}
                  </div>
                  <h2 className="profile-avatar-name">{displayName}</h2>
                  <p className="profile-avatar-email flex items-center gap-1">
                    <Mail size={13} /> {user?.email || 'Authenticated User'}
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge variant="primary">Candidate</Badge>
                    <Badge variant="success">Verified</Badge>
                  </div>
                </div>
              </Card.Body>
            </Card>

            {/* Skills Card */}
            <Card>
              <Card.Header>
                <Card.Title>Skills & Expertise</Card.Title>
              </Card.Header>
              <Card.Body>
                <form onSubmit={handleAddSkill} className="flex gap-2 mb-3">
                  <Input
                    placeholder="e.g. React, Spring Boot, SQL"
                    value={newSkillName}
                    onChange={(e) => setNewSkillName(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    type="submit"
                    variant="outline"
                    size="sm"
                    disabled={!newSkillName.trim() || skillSubmitting}
                    leftIcon={<Plus size={14} />}
                  >
                    Add
                  </Button>
                </form>

                {skills.length === 0 ? (
                  <EmptyState
                    title="No skills added"
                    description="Add your core technologies and skills to stand out to hiring managers."
                  />
                ) : (
                  <div className="profile-skills-grid">
                    {skills.map((skill) => (
                      <span key={skill.id} className="profile-skill-chip">
                        <span>{skill.name}</span>
                        <button
                          type="button"
                          className="profile-skill-remove-btn"
                          onClick={() => handleRemoveSkill(skill.id, skill.name)}
                          title={`Remove ${skill.name}`}
                          aria-label={`Remove ${skill.name}`}
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </Card.Body>
            </Card>

            {/* Resume Link Card */}
            <Card>
              <Card.Header>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <Card.Title>Resume / Portfolio</Card.Title>
                  <Link to="/candidate/resume">
                    <Button size="sm" variant="outline" leftIcon={<Sparkles size={14} />}>
                      Import Resume
                    </Button>
                  </Link>
                </div>
              </Card.Header>
              <Card.Body>
                {basicForm.resumeUrl ? (
                  <div className="profile-resume-box">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <FileText size={20} className="text-brand flex-shrink-0" />
                      <div className="truncate">
                        <span className="text-xs text-muted block">Current Resume Link</span>
                        <a
                          href={basicForm.resumeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-semibold text-brand hover:underline truncate block"
                        >
                          {basicForm.resumeUrl}
                        </a>
                      </div>
                    </div>
                    <a
                      href={basicForm.resumeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button size="sm" variant="outline" rightIcon={<ExternalLink size={14} />}>
                        Open
                      </Button>
                    </a>
                  </div>
                ) : (
                  <p className="text-sm text-secondary">
                    Provide a public Google Drive, LinkedIn, or personal portfolio URL in the Personal Information form.
                  </p>
                )}
              </Card.Body>
            </Card>
          </div>

          {/* Right Column: Personal Info, Education, Experience */}
          <div className="lg-col-span-2 flex flex-col gap-6">
            {/* Personal Information Form */}
            <Card>
              <Card.Header>
                <Card.Title>Personal Information</Card.Title>
              </Card.Header>
              <Card.Body>
                {basicErrors.general && (
                  <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm">
                    {basicErrors.general}
                  </div>
                )}
                <form onSubmit={handleBasicSubmit} className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 md-grid-cols-2 gap-4">
                    <Input
                      label="Full Name *"
                      placeholder="e.g. Sarah Connor"
                      value={basicForm.fullName}
                      onChange={(e) => setBasicForm((p) => ({ ...p, fullName: e.target.value }))}
                      error={basicErrors.fullName}
                      leftIcon={<User size={16} />}
                    />
                    <Input
                      label="Email Address"
                      value={user?.email || ''}
                      disabled
                      leftIcon={<Mail size={16} />}
                      helper="Registered login email"
                    />
                    <Input
                      label="Phone Number"
                      placeholder="e.g. +91 9876543210"
                      value={basicForm.phone}
                      onChange={(e) => setBasicForm((p) => ({ ...p, phone: e.target.value }))}
                      error={basicErrors.phone}
                      leftIcon={<Phone size={16} />}
                    />
                    <Input
                      label="Resume URL"
                      placeholder="https://drive.google.com/..."
                      value={basicForm.resumeUrl}
                      onChange={(e) => setBasicForm((p) => ({ ...p, resumeUrl: e.target.value }))}
                      error={basicErrors.resumeUrl}
                      leftIcon={<FileText size={16} />}
                    />
                  </div>

                  <div className="flex justify-end mt-2">
                    <Button type="submit" disabled={basicSubmitting}>
                      {basicSubmitting ? 'Saving Profile...' : 'Save Changes'}
                    </Button>
                  </div>
                </form>
              </Card.Body>
            </Card>

            {/* Experience Section */}
            <Card>
              <Card.Header>
                <Card.Title>Work Experience</Card.Title>
                <Button size="sm" variant="outline" leftIcon={<Plus size={14} />} onClick={openAddExpModal}>
                  Add Experience
                </Button>
              </Card.Header>
              <Card.Body>
                {experiences.length === 0 ? (
                  <EmptyState
                    icon={<Briefcase size={28} />}
                    title="No work experience added"
                    description="Highlight your internships, full-time jobs, and freelance projects."
                    action={
                      <Button size="sm" onClick={openAddExpModal}>
                        Add Your First Role
                      </Button>
                    }
                  />
                ) : (
                  <div className="profile-timeline-list">
                    {experiences.map((exp) => (
                      <div key={exp.id} className="profile-timeline-item">
                        <div className="profile-timeline-header">
                          <div>
                            <h4 className="profile-timeline-title">{exp.jobTitle}</h4>
                            <p className="profile-timeline-subtitle flex items-center gap-1">
                              <Building size={14} /> {exp.companyName}
                            </p>
                            <div className="profile-timeline-meta">
                              <span>
                                {exp.startDate || 'Start Date'} &rarr;{' '}
                                {exp.currentlyWorking ? 'Present' : (exp.endDate || 'End Date')}
                              </span>
                              {exp.currentlyWorking && (
                                <Badge variant="success">Current Role</Badge>
                              )}
                            </div>
                          </div>
                          <div className="profile-timeline-actions">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditExpModal(exp)}
                              title="Edit Experience"
                            >
                              <Edit2 size={14} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteExp(exp.id)}
                              title="Delete Experience"
                              className="text-danger-600 hover:text-danger-700"
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </div>
                        {exp.description && (
                          <p className="profile-timeline-desc">{exp.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Card.Body>
            </Card>

            {/* Education Section */}
            <Card>
              <Card.Header>
                <Card.Title>Education History</Card.Title>
                <Button size="sm" variant="outline" leftIcon={<Plus size={14} />} onClick={openAddEduModal}>
                  Add Education
                </Button>
              </Card.Header>
              <Card.Body>
                {educations.length === 0 ? (
                  <EmptyState
                    icon={<GraduationCap size={28} />}
                    title="No education added"
                    description="Add your degree, university, or academic background."
                    action={
                      <Button size="sm" onClick={openAddEduModal}>
                        Add Education
                      </Button>
                    }
                  />
                ) : (
                  <div className="profile-timeline-list">
                    {educations.map((edu) => (
                      <div key={edu.id} className="profile-timeline-item">
                        <div className="profile-timeline-header">
                          <div>
                            <h4 className="profile-timeline-title">{edu.degree}</h4>
                            <p className="profile-timeline-subtitle flex items-center gap-1">
                              <GraduationCap size={14} /> {edu.institution}
                            </p>
                            <div className="profile-timeline-meta">
                              {edu.fieldOfStudy && <span>Major: {edu.fieldOfStudy}</span>}
                              <span>•</span>
                              <span>
                                {edu.startDate || 'Start'} &rarr;{' '}
                                {edu.currentlyStudying ? 'Present' : (edu.endDate || 'End')}
                              </span>
                              {edu.currentlyStudying && (
                                <Badge variant="primary">Currently Studying</Badge>
                              )}
                            </div>
                          </div>
                          <div className="profile-timeline-actions">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditEduModal(edu)}
                              title="Edit Education"
                            >
                              <Edit2 size={14} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteEdu(edu.id)}
                              title="Delete Education"
                              className="text-danger-600 hover:text-danger-700"
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card.Body>
            </Card>
          </div>
        </div>
      )}

      {/* Add / Edit Education Modal */}
      <Modal
        isOpen={eduModalOpen}
        onClose={() => setEduModalOpen(false)}
        title={editingEduId ? 'Edit Education' : 'Add Education'}
        subtitle="Provide your academic qualifications and dates"
      >
        <form onSubmit={handleEduSubmit} className="flex flex-col gap-4">
          {eduErrors.general && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm">
              {eduErrors.general}
            </div>
          )}

          <Input
            label="Institution / University *"
            placeholder="e.g. National Institute of Technology"
            value={eduForm.institution}
            onChange={(e) => setEduForm((p) => ({ ...p, institution: e.target.value }))}
            error={eduErrors.institution}
          />

          <Input
            label="Degree / Qualification *"
            placeholder="e.g. Bachelor of Technology (B.Tech)"
            value={eduForm.degree}
            onChange={(e) => setEduForm((p) => ({ ...p, degree: e.target.value }))}
            error={eduErrors.degree}
          />

          <Input
            label="Field of Study"
            placeholder="e.g. Computer Science and Engineering"
            value={eduForm.fieldOfStudy}
            onChange={(e) => setEduForm((p) => ({ ...p, fieldOfStudy: e.target.value }))}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Start Date"
              type="date"
              value={eduForm.startDate}
              onChange={(e) => setEduForm((p) => ({ ...p, startDate: e.target.value }))}
            />
            <Input
              label="End Date"
              type="date"
              value={eduForm.endDate}
              disabled={eduForm.currentlyStudying}
              onChange={(e) => setEduForm((p) => ({ ...p, endDate: e.target.value }))}
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700 select-none">
            <input
              type="checkbox"
              checked={eduForm.currentlyStudying}
              onChange={(e) => setEduForm((p) => ({ ...p, currentlyStudying: e.target.checked }))}
              className="w-4 h-4 rounded border-slate-300 text-brand"
            />
            <span>I am currently studying here</span>
          </label>

          <div className="flex justify-end gap-2 mt-4">
            <Button type="button" variant="outline" onClick={() => setEduModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={eduSubmitting}>
              {eduSubmitting ? 'Saving...' : 'Save Education'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add / Edit Experience Modal */}
      <Modal
        isOpen={expModalOpen}
        onClose={() => setExpModalOpen(false)}
        title={editingExpId ? 'Edit Work Experience' : 'Add Work Experience'}
        subtitle="Highlight your professional accomplishments and responsibilities"
      >
        <form onSubmit={handleExpSubmit} className="flex flex-col gap-4">
          {expErrors.general && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm">
              {expErrors.general}
            </div>
          )}

          <Input
            label="Company Name *"
            placeholder="e.g. TechCorp Solutions"
            value={expForm.companyName}
            onChange={(e) => setExpForm((p) => ({ ...p, companyName: e.target.value }))}
            error={expErrors.companyName}
          />

          <Input
            label="Job Title *"
            placeholder="e.g. Software Engineer"
            value={expForm.jobTitle}
            onChange={(e) => setExpForm((p) => ({ ...p, jobTitle: e.target.value }))}
            error={expErrors.jobTitle}
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Description & Key Accomplishments
            </label>
            <textarea
              className="w-full p-2.5 text-sm rounded-lg border border-subtle bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
              rows={4}
              placeholder="Describe your role, tech stack, and achievements..."
              value={expForm.description}
              onChange={(e) => setExpForm((p) => ({ ...p, description: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Start Date"
              type="date"
              value={expForm.startDate}
              onChange={(e) => setExpForm((p) => ({ ...p, startDate: e.target.value }))}
            />
            <Input
              label="End Date"
              type="date"
              value={expForm.endDate}
              disabled={expForm.currentlyWorking}
              onChange={(e) => setExpForm((p) => ({ ...p, endDate: e.target.value }))}
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700 select-none">
            <input
              type="checkbox"
              checked={expForm.currentlyWorking}
              onChange={(e) => setExpForm((p) => ({ ...p, currentlyWorking: e.target.checked }))}
              className="w-4 h-4 rounded border-slate-300 text-brand"
            />
            <span>I currently work here</span>
          </label>

          <div className="flex justify-end gap-2 mt-4">
            <Button type="button" variant="outline" onClick={() => setExpModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={expSubmitting}>
              {expSubmitting ? 'Saving...' : 'Save Experience'}
            </Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
};

export default CandidateProfilePage;
