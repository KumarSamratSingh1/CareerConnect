import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Briefcase,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  CheckCircle,
  Building,
  Sparkles,
  Star
} from 'lucide-react';
import { useAuth } from '../../context';
import { Navbar, Footer } from '../../components/layout';
import { Button, Input, Card, Badge } from '../../components/ui';
import './LoginPage.css';
import './RegisterPage.css';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const RegisterPage = () => {
  const navigate = useNavigate();
  const { register, loginWithGoogle } = useAuth();

  const [role, setRole] = useState('CANDIDATE');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [fieldErrors, setFieldErrors] = useState({});
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  const handleGoogleCredentialResponse = useCallback(
    async (response) => {
      try {
        setIsLoading(true);
        setErrorMessage('');
        const user = await loginWithGoogle(response.credential);
        if (user.role === 'ADMIN') {
          navigate('/admin/dashboard', { replace: true });
        } else if (user.role === 'RECRUITER') {
          navigate('/recruiter/dashboard', { replace: true });
        } else {
          navigate('/candidate/dashboard', { replace: true });
        }
      } catch (err) {
        if (err.response) {
          setErrorMessage(err.response.data?.message || 'Google registration failed.');
        } else {
          setErrorMessage(err.message || 'Google registration failed.');
        }
      } finally {
        setIsLoading(false);
      }
    },
    [loginWithGoogle, navigate]
  );

  useEffect(() => {
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!googleClientId) return;

    let checkInterval = null;

    const renderGoogleBtn = () => {
      if (window.google?.accounts?.id) {
        try {
          window.google.accounts.id.initialize({
            client_id: googleClientId,
            callback: handleGoogleCredentialResponse,
          });
          const btnParent = document.getElementById('googleSignUpContainer');
          if (btnParent) {
            btnParent.innerHTML = '';
            window.google.accounts.id.renderButton(btnParent, {
              theme: 'outline',
              size: 'large',
              width: 320,
              text: 'signup_with',
              shape: 'rectangular',
            });
          }
        } catch {
          // GSI handled gracefully
        }
      }
    };

    if (window.google?.accounts?.id) {
      renderGoogleBtn();
    } else {
      checkInterval = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(checkInterval);
          renderGoogleBtn();
        }
      }, 250);
    }

    return () => {
      if (checkInterval) clearInterval(checkInterval);
    };
  }, [handleGoogleCredentialResponse]);


  const validateForm = () => {
    const errors = {};

    if (!name.trim()) {
      errors.name = 'Full name is required';
    }

    if (!email.trim()) {
      errors.email = 'Email address is required';
    } else if (!EMAIL_REGEX.test(email.trim())) {
      errors.email = 'Please provide a valid email format';
    }

    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters long';
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Confirm your password';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      await register({
        email: email.trim(),
        password: password,
        role: role,
      });

      // Show success screen
      setRegistrationSuccess(true);
    } catch (err) {
      if (err.response) {
        const status = err.response.status;
        const apiMsg = err.response.data?.message;

        if (status === 409) {
          setErrorMessage('An account with this email address already exists. Please log in.');
        } else if (status === 400) {
          setErrorMessage(apiMsg || 'Invalid registration details. Please verify your inputs.');
        } else {
          setErrorMessage(apiMsg || 'Registration failed. Please try again.');
        }
      } else if (err.request) {
        setErrorMessage(
          'Unable to reach CareerConnect backend server. Please verify the Spring Boot service is running on http://localhost:8080.'
        );
      } else {
        setErrorMessage(err.message || 'An unexpected error occurred.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoToDashboard = () => {
    if (role === 'RECRUITER') {
      navigate('/recruiter/dashboard', { replace: true });
    } else {
      navigate('/candidate/dashboard', { replace: true });
    }
  };

  return (
    <div className="auth-page">
      <Navbar />

      <main className="auth-page__main">
        <div className="auth-split-container">
          {/* Left Brand Showcase Panel (Desktop) */}
          <div className="auth-showcase-panel">
            <div className="auth-showcase-panel__ambient" aria-hidden="true" />
            <div className="auth-showcase-panel__content">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold mb-6">
                <Sparkles size={14} /> Official Recruitment Platform
              </div>
              <h2 className="auth-showcase-panel__title">
                Start your journey with premier technology employers.
              </h2>
              <p className="auth-showcase-panel__desc">
                Whether you're a graduating engineer looking for your first big role or a talent team scaling headcount, CareerConnect delivers precision matching.
              </p>

              <div className="auth-showcase-features">
                <div className="auth-showcase-feature">
                  <div className="auth-showcase-feature__icon">
                    <CheckCircle size={16} />
                  </div>
                  <div>
                    <div className="font-semibold text-white text-sm">For Candidates & Students</div>
                    <div className="text-xs text-slate-300">1-click applications, saved bookmarks, and direct interview notifications.</div>
                  </div>
                </div>

                <div className="auth-showcase-feature">
                  <div className="auth-showcase-feature__icon">
                    <CheckCircle size={16} />
                  </div>
                  <div>
                    <div className="font-semibold text-white text-sm">For Recruiters & Companies</div>
                    <div className="text-xs text-slate-300">Post jobs, review qualified applicants, schedule rounds, and hire top talent.</div>
                  </div>
                </div>

                <div className="auth-showcase-feature">
                  <div className="auth-showcase-feature__icon">
                    <CheckCircle size={16} />
                  </div>
                  <div>
                    <div className="font-semibold text-white text-sm">Verified Credentials & Security</div>
                    <div className="text-xs text-slate-300">Instant Google OAuth 2.0 integration and encrypted session management.</div>
                  </div>
                </div>
              </div>

              {/* Trust Badge */}
              <div className="auth-showcase-quote">
                <div className="flex items-center gap-1 text-amber-400 mb-2">
                  <Star size={14} fill="currentColor" />
                  <Star size={14} fill="currentColor" />
                  <Star size={14} fill="currentColor" />
                  <Star size={14} fill="currentColor" />
                  <Star size={14} fill="currentColor" />
                </div>
                <p className="text-xs text-slate-300 italic mb-2">
                  "Over 12,500 active tech roles and internships from top verified technology teams across India."
                </p>
                <div className="text-xs font-semibold text-white">CareerConnect Network</div>
              </div>
            </div>
          </div>

          <div className="auth-card-wrap">
          <Card>
            <Card.Header>
              <div className="text-center w-full">
                <div className="auth-header-icon">
                  <Briefcase size={22} />
                </div>
                <Card.Title>
                  {registrationSuccess ? 'Account Created!' : 'Create CareerConnect Account'}
                </Card.Title>
                <Card.Description>
                  {registrationSuccess
                    ? 'Your account has been registered and verified successfully.'
                    : 'Join top candidates and hiring teams today'}
                </Card.Description>
              </div>
            </Card.Header>

            <Card.Body>
              {registrationSuccess ? (
                <div className="register-success-card">
                  <div className="register-success-icon">
                    <CheckCircle size={32} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1">
                    Welcome to CareerConnect
                  </h3>
                  <p className="text-sm text-secondary mb-4 leading-relaxed">
                    You have successfully registered as a{' '}
                    <Badge variant="primary">{role}</Badge>. Your session is active and your
                    portal is ready.
                  </p>
                  <Button
                    variant="primary"
                    fullWidth
                    size="lg"
                    onClick={handleGoToDashboard}
                    rightIcon={<ArrowRight size={16} />}
                  >
                    Enter {role === 'RECRUITER' ? 'Recruiter Hub' : 'Candidate Portal'}
                  </Button>
                </div>
              ) : (
                <>
                  {errorMessage && (
                    <div className="auth-error-alert mb-4" role="alert">
                      <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  {/* Role Selector Tabs */}
                  <div className="mb-2">
                    <label className="input-label mb-2">Select Your Account Type</label>
                    <div className="register-role-selector">
                      <div
                        className={`register-role-option ${role === 'CANDIDATE' ? 'active' : ''}`}
                        onClick={() => setRole('CANDIDATE')}
                        role="button"
                        tabIndex={0}
                        aria-pressed={role === 'CANDIDATE'}
                      >
                        <User size={20} className={role === 'CANDIDATE' ? 'text-brand' : 'text-muted'} />
                        <span className="register-role-option__title">Candidate</span>
                        <span className="register-role-option__desc">Job Seeker / Student</span>
                      </div>

                      <div
                        className={`register-role-option ${role === 'RECRUITER' ? 'active' : ''}`}
                        onClick={() => setRole('RECRUITER')}
                        role="button"
                        tabIndex={0}
                        aria-pressed={role === 'RECRUITER'}
                      >
                        <Building size={20} className={role === 'RECRUITER' ? 'text-brand' : 'text-muted'} />
                        <span className="register-role-option__title">Recruiter</span>
                        <span className="register-role-option__desc">Employer / Talent Team</span>
                      </div>
                    </div>
                  </div>

                  <form onSubmit={handleRegister} className="auth-form" noValidate>
                    <Input
                      label="Full Name"
                      placeholder="e.g. Alex Johnson"
                      required
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: null }));
                      }}
                      error={fieldErrors.name}
                      leftIcon={<User size={16} />}
                    />

                    <Input
                      label="Email Address"
                      type="email"
                      placeholder="alex.johnson@example.com"
                      required
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: null }));
                      }}
                      error={fieldErrors.email}
                      leftIcon={<Mail size={16} />}
                    />

                    <Input
                      label="Password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="At least 8 characters"
                      required
                      helperText="Must be at least 8 characters long"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: null }));
                      }}
                      error={fieldErrors.password}
                      leftIcon={<Lock size={16} />}
                      rightIcon={
                        <button
                          type="button"
                          className="auth-password-toggle"
                          onClick={() => setShowPassword((prev) => !prev)}
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      }
                    />

                    <Input
                      label="Confirm Password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Repeat your password"
                      required
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (fieldErrors.confirmPassword) setFieldErrors((prev) => ({ ...prev, confirmPassword: null }));
                      }}
                      error={fieldErrors.confirmPassword}
                      leftIcon={<Lock size={16} />}
                      rightIcon={
                        <button
                          type="button"
                          className="auth-password-toggle"
                          onClick={() => setShowConfirmPassword((prev) => !prev)}
                          aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                        >
                          {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      }
                    />

                    <Button
                      type="submit"
                      fullWidth
                      size="lg"
                      isLoading={isLoading}
                      rightIcon={<ArrowRight size={16} />}
                    >
                      Create {role === 'RECRUITER' ? 'Recruiter' : 'Candidate'} Account
                    </Button>
                  </form>

                  {/* Google Sign-up Option */}
                  <div className="auth-divider">
                    <div className="auth-divider-line" />
                    <span className="auth-divider-text">Or sign up with</span>
                    <div className="auth-divider-line" />
                  </div>

                  <div className="auth-google-wrapper">
                    <div id="googleSignUpContainer" className="auth-google-btn-container" />
                    {!import.meta.env.VITE_GOOGLE_CLIENT_ID && (
                      <p className="text-xs text-secondary text-center mt-1">
                        Google Sign-Up ready (configure <code>VITE_GOOGLE_CLIENT_ID</code>)
                      </p>
                    )}
                  </div>

                  <div className="mt-6 text-center text-sm text-secondary">
                    Already have an account?{' '}
                    <Link to="/login" className="text-brand font-semibold hover:underline">
                      Sign In
                    </Link>
                  </div>
                </>
              )}
            </Card.Body>
          </Card>
        </div>
      </div>
      </main>

      <Footer />
    </div>
  );
};

export default RegisterPage;
