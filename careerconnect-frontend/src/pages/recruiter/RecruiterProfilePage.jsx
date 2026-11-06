import { useState, useEffect } from 'react';
import { User, Phone, Briefcase, Mail, CheckCircle2, AlertCircle, Edit3, Save, Plus } from 'lucide-react';
import { DashboardLayout } from '../../components/layout';
import { Card, Button, Input, LoadingSpinner, EmptyState, useToast } from '../../components/ui';
import { useAuth } from '../../context';
import { recruiterService } from '../../api';

export const RecruiterProfilePage = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [profile, setProfile] = useState(null);
  const [isNewProfile, setIsNewProfile] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    designation: '',
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    let isCancelled = false;

    const fetchProfile = async () => {
      try {
        const res = await recruiterService.getProfile();
        if (isCancelled) return;

        if (res.success && res.data) {
          setProfile(res.data);
          setFormData({
            fullName: res.data.fullName || '',
            phone: res.data.phone || '',
            designation: res.data.designation || '',
          });
          setIsNewProfile(false);
        }
      } catch (err) {
        if (isCancelled) return;
        // HTTP 404 indicates candidate/recruiter hasn't created a profile yet
        if (err.response?.status === 404) {
          setIsNewProfile(true);
          setIsEditing(true);
        } else {
          setError(err.response?.data?.message || err.message || 'Failed to load profile.');
        }
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    };

    fetchProfile();
    return () => {
      isCancelled = true;
    };
  }, []);

  const validate = () => {
    const errors = {};
    if (!formData.fullName || !formData.fullName.trim()) {
      errors.fullName = 'Full name must not be blank';
    } else if (formData.fullName.trim().length > 150) {
      errors.fullName = 'Full name must not exceed 150 characters';
    }

    if (formData.phone && formData.phone.trim().length > 20) {
      errors.phone = 'Phone must not exceed 20 characters';
    }

    if (formData.designation && formData.designation.trim().length > 150) {
      errors.designation = 'Designation must not exceed 150 characters';
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
        fullName: formData.fullName.trim(),
        phone: formData.phone?.trim() || null,
        designation: formData.designation?.trim() || null,
      };

      let res;
      if (isNewProfile) {
        res = await recruiterService.createProfile(payload);
      } else {
        res = await recruiterService.updateProfile(payload);
      }

      if (res.success && res.data) {
        setProfile(res.data);
        setIsNewProfile(false);
        setIsEditing(false);
        const msg = isNewProfile
          ? 'Recruiter profile created successfully!'
          : 'Recruiter profile updated successfully!';
        setSuccessMessage(msg);
        toast.success(msg);
      }
    } catch (err) {
      const backendMessage = err.response?.data?.message;
      const validationData = err.response?.data?.data;
      if (validationData && typeof validationData === 'object') {
        setFormErrors(validationData);
      } else {
        const msg = backendMessage || err.message || 'Failed to save recruiter profile.';
        setError(msg);
        toast.error(msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelEdit = () => {
    if (profile) {
      setFormData({
        fullName: profile.fullName || '',
        phone: profile.phone || '',
        designation: profile.designation || '',
      });
      setFormErrors({});
      setIsEditing(false);
    }
  };

  return (
    <DashboardLayout
      role="recruiter"
      title="Recruiter Profile"
      breadcrumb="Recruiter Hub / Profile"
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
          <LoadingSpinner center text="Loading recruiter profile..." />
        ) : isNewProfile && !isEditing ? (
          /* Empty Setup State */
          <Card>
            <Card.Body>
              <EmptyState
                icon={<User size={40} />}
                title="No Recruiter Profile Configured"
                description="Before linking your corporate profile and publishing vacancies, please set up your recruiter professional credentials."
                action={
                  <Button
                    onClick={() => setIsEditing(true)}
                    leftIcon={<Plus size={16} />}
                  >
                    Create Recruiter Profile
                  </Button>
                }
              />
            </Card.Body>
          </Card>
        ) : (
          <Card>
            <Card.Header>
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-lg">
                    {profile?.fullName ? profile.fullName.charAt(0).toUpperCase() : 'R'}
                  </div>
                  <div>
                    <Card.Title>
                      {isNewProfile
                        ? 'Set Up Recruiter Profile'
                        : isEditing
                        ? 'Edit Recruiter Profile'
                        : profile?.fullName || 'Recruiter Profile'}
                    </Card.Title>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {isNewProfile
                        ? 'Create your recruiter contact information'
                        : 'Official recruitment credentials for your organization'}
                    </p>
                  </div>
                </div>

                {!isEditing && profile && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    leftIcon={<Edit3 size={15} />}
                  >
                    Edit Profile
                  </Button>
                )}
              </div>
            </Card.Header>

            <Card.Body>
              {isEditing ? (
                /* Edit / Create Form */
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1 md:col-span-2">
                      <label className="text-xs font-semibold text-slate-700">
                        Full Name <span className="text-rose-500">*</span>
                      </label>
                      <Input
                        placeholder="e.g. Sarah Jenkins"
                        value={formData.fullName}
                        onChange={(e) => handleChange('fullName', e.target.value)}
                        error={formErrors.fullName}
                        leftIcon={<User size={16} />}
                        required
                        maxLength={150}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700">
                        Designation / Role Title
                      </label>
                      <Input
                        placeholder="e.g. Senior Talent Acquisition Specialist"
                        value={formData.designation}
                        onChange={(e) => handleChange('designation', e.target.value)}
                        error={formErrors.designation}
                        leftIcon={<Briefcase size={16} />}
                        maxLength={150}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700">
                        Phone Number
                      </label>
                      <Input
                        placeholder="e.g. +1 555-019-2834"
                        value={formData.phone}
                        onChange={(e) => handleChange('phone', e.target.value)}
                        error={formErrors.phone}
                        leftIcon={<Phone size={16} />}
                        maxLength={20}
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                    {!isNewProfile && (
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
                        : isNewProfile
                        ? 'Create Profile'
                        : 'Save Changes'}
                    </Button>
                  </div>
                </form>
              ) : (
                /* Read-Only Profile View */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-2">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                    <User size={18} className="text-slate-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                        Full Name
                      </p>
                      <p className="text-sm font-semibold text-slate-800 mt-1">
                        {profile?.fullName}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                    <Briefcase size={18} className="text-slate-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                        Designation
                      </p>
                      <p className="text-sm font-semibold text-slate-800 mt-1">
                        {profile?.designation || (
                          <span className="text-slate-400 italic">Not specified</span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                    <Mail size={18} className="text-slate-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                        Email Account
                      </p>
                      <p className="text-sm font-semibold text-slate-800 mt-1">
                        {user?.email || 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                    <Phone size={18} className="text-slate-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                        Phone Number
                      </p>
                      <p className="text-sm font-semibold text-slate-800 mt-1">
                        {profile?.phone || (
                          <span className="text-slate-400 italic">Not specified</span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default RecruiterProfilePage;
