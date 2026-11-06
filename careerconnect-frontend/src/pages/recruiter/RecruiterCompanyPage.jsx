import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Globe,
  MapPin,
  Tag,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Edit3,
  Save,
  Plus,
  ArrowRight,
  ShieldCheck,
  Clock,
} from 'lucide-react';
import { DashboardLayout } from '../../components/layout';
import { Card, Button, Input, LoadingSpinner, EmptyState, useToast } from '../../components/ui';
import { companyService, recruiterService } from '../../api';

export const RecruiterCompanyPage = () => {
  const toast = useToast();
  const [company, setCompany] = useState(null);
  const [hasRecruiterProfile, setHasRecruiterProfile] = useState(true);
  const [isNewCompany, setIsNewCompany] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    website: '',
    location: '',
    industry: '',
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    let isCancelled = false;

    const loadCompanyData = async () => {
      try {
        // First check recruiter profile existence
        try {
          await recruiterService.getProfile();
          if (isCancelled) return;
          setHasRecruiterProfile(true);
        } catch (profErr) {
          if (isCancelled) return;
          if (profErr.response?.status === 404) {
            setHasRecruiterProfile(false);
            setIsLoading(false);
            return;
          }
        }

        // Now load company
        const res = await companyService.getMyCompany();
        if (isCancelled) return;

        if (res.success && res.data) {
          setCompany(res.data);
          setFormData({
            name: res.data.name || '',
            description: res.data.description || '',
            website: res.data.website || '',
            location: res.data.location || '',
            industry: res.data.industry || '',
          });
          setIsNewCompany(false);
        }
      } catch (err) {
        if (isCancelled) return;
        if (err.response?.status === 404) {
          setIsNewCompany(true);
          setIsEditing(true);
        } else {
          setError(err.response?.data?.message || err.message || 'Failed to load company profile.');
        }
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    };

    loadCompanyData();
    return () => {
      isCancelled = true;
    };
  }, []);

  const validate = () => {
    const errors = {};
    if (!formData.name || !formData.name.trim()) {
      errors.name = 'Company name must not be blank';
    } else if (formData.name.trim().length > 200) {
      errors.name = 'Company name must not exceed 200 characters';
    }

    if (!formData.location || !formData.location.trim()) {
      errors.location = 'Location must not be blank';
    } else if (formData.location.trim().length > 150) {
      errors.location = 'Location must not exceed 150 characters';
    }

    if (!formData.industry || !formData.industry.trim()) {
      errors.industry = 'Industry must not be blank';
    } else if (formData.industry.trim().length > 100) {
      errors.industry = 'Industry must not exceed 100 characters';
    }

    if (formData.website && formData.website.trim()) {
      const urlPattern = /^https?:\/\/\S+$/i;
      if (!urlPattern.test(formData.website.trim())) {
        errors.website = 'Website must be a valid URL starting with http:// or https://';
      } else if (formData.website.trim().length > 255) {
        errors.website = 'Website must not exceed 255 characters';
      }
    }

    if (formData.description && formData.description.length > 2000) {
      errors.description = 'Description must not exceed 2000 characters';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage(null);
    setError(null);

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description?.trim() || null,
        website: formData.website?.trim() || null,
        location: formData.location.trim(),
        industry: formData.industry.trim(),
      };

      let res;
      if (isNewCompany) {
        res = await companyService.createCompany(payload);
      } else {
        res = await companyService.updateMyCompany(payload);
      }

      if (res.success && res.data) {
        setCompany(res.data);
        setIsNewCompany(false);
        setIsEditing(false);
        const msg = isNewCompany
          ? 'Company profile created successfully! It is now pending administrative verification.'
          : 'Company profile updated successfully!';
        setSuccessMessage(msg);
        toast.success(msg);
      }
    } catch (err) {
      const backendMessage = err.response?.data?.message;
      const validationData = err.response?.data?.data;
      if (validationData && typeof validationData === 'object') {
        setFormErrors(validationData);
      } else {
        const msg = backendMessage || err.message || 'Failed to save company profile.';
        setError(msg);
        toast.error(msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelEdit = () => {
    if (company) {
      setFormData({
        name: company.name || '',
        description: company.description || '',
        website: company.website || '',
        location: company.location || '',
        industry: company.industry || '',
      });
      setFormErrors({});
      setIsEditing(false);
    }
  };

  return (
    <DashboardLayout
      role="recruiter"
      title="Company Profile"
      breadcrumb="Recruiter Hub / Company Profile"
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Success Alert */}
        {successMessage && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={18} className="text-emerald-600 flex-shrink-0" />
              <span className="text-sm font-medium">{successMessage}</span>
            </div>
            <button
              onClick={() => setSuccessMessage(null)}
              className="text-emerald-600 hover:text-emerald-800 text-xs font-semibold"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2">
            <AlertCircle size={18} className="text-rose-600 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {isLoading ? (
          <LoadingSpinner center text="Loading organization details..." />
        ) : !hasRecruiterProfile ? (
          /* Recruiter Profile Pre-requisite Warning */
          <Card>
            <Card.Body>
              <EmptyState
                icon={<Building2 size={40} />}
                title="Recruiter Profile Required First"
                description="Before you can register or manage a company corporate profile, the backend requires an existing recruiter profile."
                action={
                  <Link to="/recruiter/profile">
                    <Button leftIcon={<ArrowRight size={16} />}>
                      Go to Recruiter Profile Setup
                    </Button>
                  </Link>
                }
              />
            </Card.Body>
          </Card>
        ) : isNewCompany && !isEditing ? (
          /* Empty Company State */
          <Card>
            <Card.Body>
              <EmptyState
                icon={<Building2 size={40} />}
                title="No Company Linked Yet"
                description="To post job openings and review candidate applications, register your company profile below."
                action={
                  <Button
                    onClick={() => setIsEditing(true)}
                    leftIcon={<Plus size={16} />}
                  >
                    Register Company Profile
                  </Button>
                }
              />
            </Card.Body>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Sidebar Summary Card */}
            <Card className="md:col-span-1">
              <Card.Body>
                <div className="flex flex-col items-center text-center">
                  <div className="w-20 h-20 rounded-2xl bg-slate-100 text-slate-700 font-bold text-2xl flex items-center justify-center mb-3 shadow-sm border border-slate-200">
                    <Building2 size={36} className="text-indigo-600" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-lg">
                    {company?.name || formData.name || 'New Organization'}
                  </h3>
                  <p className="text-xs text-slate-500 mb-3 flex items-center justify-center gap-1">
                    <MapPin size={13} />
                    {company?.location || formData.location || 'Location TBD'}
                  </p>

                  <div className="mb-4">
                    {company?.verified ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <ShieldCheck size={14} /> Verified Organization
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                        <Clock size={14} /> Pending Verification
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                    Verification status is governed exclusively by platform administrators.
                  </p>

                  {company?.website && (
                    <a
                      href={company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 hover:underline"
                    >
                      <Globe size={13} /> Visit Official Website <ExternalLink size={12} />
                    </a>
                  )}
                </div>
              </Card.Body>
            </Card>

            {/* Main Info / Edit Card */}
            <Card className="md:col-span-2">
              <Card.Header>
                <div className="flex items-center justify-between w-full">
                  <div>
                    <Card.Title>
                      {isNewCompany
                        ? 'Register Company Profile'
                        : isEditing
                        ? 'Edit Company Information'
                        : 'Company Overview'}
                    </Card.Title>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {isNewCompany
                        ? 'Supply corporate details to start publishing jobs'
                        : 'Manage details visible to applicants across job postings'}
                    </p>
                  </div>

                  {!isEditing && company && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                      leftIcon={<Edit3 size={15} />}
                    >
                      Edit Company
                    </Button>
                  )}
                </div>
              </Card.Header>

              <Card.Body>
                {isEditing ? (
                  /* Form */
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1 md:col-span-2">
                        <label className="text-xs font-semibold text-slate-700">
                          Company Name <span className="text-rose-500">*</span>
                        </label>
                        <Input
                          placeholder="e.g. Acme Corporation"
                          value={formData.name}
                          onChange={(e) => handleChange('name', e.target.value)}
                          error={formErrors.name}
                          leftIcon={<Building2 size={16} />}
                          required
                          maxLength={200}
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700">
                          Industry Sector <span className="text-rose-500">*</span>
                        </label>
                        <Input
                          placeholder="e.g. Software & Technology"
                          value={formData.industry}
                          onChange={(e) => handleChange('industry', e.target.value)}
                          error={formErrors.industry}
                          leftIcon={<Tag size={16} />}
                          required
                          maxLength={100}
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700">
                          Headquarters Location <span className="text-rose-500">*</span>
                        </label>
                        <Input
                          placeholder="e.g. San Francisco, CA / Bangalore"
                          value={formData.location}
                          onChange={(e) => handleChange('location', e.target.value)}
                          error={formErrors.location}
                          leftIcon={<MapPin size={16} />}
                          required
                          maxLength={150}
                        />
                      </div>

                      <div className="space-y-1 md:col-span-2">
                        <label className="text-xs font-semibold text-slate-700">
                          Official Website URL
                        </label>
                        <Input
                          placeholder="https://example.com"
                          value={formData.website}
                          onChange={(e) => handleChange('website', e.target.value)}
                          error={formErrors.website}
                          leftIcon={<Globe size={16} />}
                          maxLength={255}
                        />
                        <span className="text-[11px] text-slate-400">
                          Must begin with http:// or https://
                        </span>
                      </div>

                      <div className="space-y-1 md:col-span-2">
                        <label className="text-xs font-semibold text-slate-700">
                          Company Description & About
                        </label>
                        <textarea
                          rows={4}
                          className="w-full rounded-lg border border-slate-200 p-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                          placeholder="Brief description of your organization mission, culture, and products..."
                          value={formData.description}
                          onChange={(e) => handleChange('description', e.target.value)}
                          maxLength={2000}
                        />
                        {formErrors.description && (
                          <span className="text-xs text-rose-600 block">
                            {formErrors.description}
                          </span>
                        )}
                        <span className="text-[11px] text-slate-400 block text-right">
                          {formData.description.length} / 2000 characters
                        </span>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                      {!isNewCompany && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleCancelEdit}
                          disabled={isSubmitting}
                        >
                          Cancel
                        </Button>
                      )}
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        leftIcon={<Save size={16} />}
                      >
                        {isSubmitting
                          ? 'Saving...'
                          : isNewCompany
                          ? 'Register Company'
                          : 'Save Changes'}
                      </Button>
                    </div>
                  </form>
                ) : (
                  /* Read-Only Details */
                  <div className="space-y-5">
                    <div>
                      <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                        About Organization
                      </h4>
                      <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                        {company?.description || (
                          <span className="text-slate-400 italic">No description provided.</span>
                        )}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-3.5 rounded-xl border border-slate-100 bg-white">
                        <p className="text-xs text-slate-400 font-medium uppercase">Industry</p>
                        <p className="text-sm font-semibold text-slate-800 mt-0.5">
                          {company?.industry}
                        </p>
                      </div>

                      <div className="p-3.5 rounded-xl border border-slate-100 bg-white">
                        <p className="text-xs text-slate-400 font-medium uppercase">Location</p>
                        <p className="text-sm font-semibold text-slate-800 mt-0.5">
                          {company?.location}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </Card.Body>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default RecruiterCompanyPage;
