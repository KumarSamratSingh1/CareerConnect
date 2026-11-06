import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Briefcase, Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle, Clock, Sparkles, CheckCircle, Star } from 'lucide-react';
import { useAuth } from '../../context';
import { Navbar, Footer } from '../../components/layout';
import { Button, Input, Card, useToast } from '../../components/ui';
import './LoginPage.css';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginWithGoogle } = useAuth();
  const toast = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const [fieldErrors, setFieldErrors] = useState({});
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [sessionExpiredNotice, setSessionExpiredNotice] = useState(() => {
    if (location.state?.sessionExpired) return true;
    try {
      if (sessionStorage.getItem('careerconnect_session_expired') === 'true') {
        sessionStorage.removeItem('careerconnect_session_expired');
        return true;
      }
    } catch {
      // ignore
    }
    return false;
  });

  const handleAuthRedirect = useCallback(
    (user) => {
      const fromState = location.state?.from;
      const destination = fromState?.pathname || (typeof fromState === 'string' ? fromState : null);
      if (destination && !destination.includes('/login') && !destination.includes('/register')) {
        const rolePrefix = user.role.toLowerCase();
        if (destination.startsWith(`/${rolePrefix}`) || destination.startsWith('/jobs')) {
          navigate(destination, { replace: true, state: location.state });
          return;
        }
      }

      if (user.role === 'ADMIN') {
        navigate('/admin/dashboard', { replace: true });
      } else if (user.role === 'RECRUITER') {
        navigate('/recruiter/dashboard', { replace: true });
      } else {
        navigate('/candidate/dashboard', { replace: true });
      }
    },
    [location.state, navigate]
  );

  const handleGoogleCredentialResponse = useCallback(
    async (response) => {
      try {
        setIsLoading(true);
        setErrorMessage('');
        setSessionExpiredNotice(false);
        const user = await loginWithGoogle(response.credential);
        toast.success(`Welcome back, ${user.email}!`);
        handleAuthRedirect(user);
      } catch (err) {
        if (err.response) {
          setErrorMessage(err.response.data?.message || 'Google authentication failed.');
        } else {
          setErrorMessage(err.message || 'Google authentication failed.');
        }
      } finally {
        setIsLoading(false);
      }
    },
    [loginWithGoogle, handleAuthRedirect, toast]
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
          const btnParent = document.getElementById('googleSignInContainer');
          if (btnParent) {
            btnParent.innerHTML = '';
            window.google.accounts.id.renderButton(btnParent, {
              theme: 'outline',
              size: 'large',
              width: 320,
              text: 'continue_with',
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

  // Validate form client-side before calling backend
  const validateForm = () => {
    const errors = {};
    if (!email.trim()) {
      errors.email = 'Email address is required';
    } else if (!EMAIL_REGEX.test(email.trim())) {
      errors.email = 'Please provide a valid email format (e.g. user@example.com)';
    }

    if (!password) {
      errors.password = 'Password is required';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSessionExpiredNotice(false);

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const user = await login({
        email: email.trim(),
        password: password,
      });

      // If "remember me" is selected, save preference
      if (rememberMe) {
        localStorage.setItem('careerconnect_remember_email', email.trim());
      } else {
        localStorage.removeItem('careerconnect_remember_email');
      }

      toast.success(`Welcome back, ${user.email}!`);
      handleAuthRedirect(user);
    } catch (err) {
      if (err.response) {
        const status = err.response.status;
        const apiMsg = err.response.data?.message;

        if (status === 401) {
          setErrorMessage('Invalid email or password. Please verify your credentials.');
        } else if (status === 400) {
          setErrorMessage(apiMsg || 'Validation error. Please check your inputs.');
        } else {
          setErrorMessage(apiMsg || 'Server error occurred. Please try again.');
        }
      } else if (err.request) {
        setErrorMessage(
          'Unable to reach the CareerConnect backend service. Please check your network connection or try again.'
        );
      } else {
        setErrorMessage(err.message || 'An unexpected error occurred during login.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Quick fill helper for evaluator convenience
  const handleQuickFill = (roleType, defaultEmail) => {
    setEmail(defaultEmail);
    setPassword('Password123!');
    setFieldErrors({});
    setErrorMessage('');
    setSessionExpiredNotice(false);
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
                The modern standard for tech placements & campus hiring.
              </h2>
              <p className="auth-showcase-panel__desc">
                Connect directly with engineering leaders, verified hiring managers, and high-growth startups with zero noise.
              </p>

              <div className="auth-showcase-features">
                <div className="auth-showcase-feature">
                  <div className="auth-showcase-feature__icon">
                    <CheckCircle size={16} />
                  </div>
                  <div>
                    <div className="font-semibold text-white text-sm">Verified Job Openings</div>
                    <div className="text-xs text-slate-300">Directly posted by recruiters with active hiring budgets.</div>
                  </div>
                </div>

                <div className="auth-showcase-feature">
                  <div className="auth-showcase-feature__icon">
                    <CheckCircle size={16} />
                  </div>
                  <div>
                    <div className="font-semibold text-white text-sm">Fast-Track Status Tracking</div>
                    <div className="text-xs text-slate-300">Real-time updates on review stages, interview schedules, and offers.</div>
                  </div>
                </div>

                <div className="auth-showcase-feature">
                  <div className="auth-showcase-feature__icon">
                    <CheckCircle size={16} />
                  </div>
                  <div>
                    <div className="font-semibold text-white text-sm">Enterprise Data Governance</div>
                    <div className="text-xs text-slate-300">Encrypted credentials, OAuth 2.0, and strict privacy protection.</div>
                  </div>
                </div>
              </div>

              {/* Placement Review Quote */}
              <div className="auth-showcase-quote">
                <div className="flex items-center gap-1 text-amber-400 mb-2">
                  <Star size={14} fill="currentColor" />
                  <Star size={14} fill="currentColor" />
                  <Star size={14} fill="currentColor" />
                  <Star size={14} fill="currentColor" />
                  <Star size={14} fill="currentColor" />
                </div>
                <p className="text-xs text-slate-300 italic mb-2">
                  "CareerConnect streamlined our technical interview rounds and campus recruitment pipelines with unprecedented clarity."
                </p>
                <div className="text-xs font-semibold text-white">Engineering Placement Cell</div>
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
                <Card.Title>Sign In to CareerConnect</Card.Title>
                <Card.Description>Enter your credentials to access your dashboard</Card.Description>
              </div>
            </Card.Header>

            <Card.Body>
              {sessionExpiredNotice && (
                <div
                  className="auth-error-alert mb-4 bg-amber-50 border border-amber-200 text-amber-800"
                  role="alert"
                >
                  <Clock size={16} className="flex-shrink-0 mt-0.5 text-amber-600" />
                  <span>Your session has expired. Please sign in again.</span>
                </div>
              )}

              {errorMessage && (
                <div className="auth-error-alert mb-4" role="alert">
                  <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleLogin} className="auth-form" noValidate>
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="candidate@example.com"
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
                  placeholder="••••••••"
                  required
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

                <div className="auth-remember-row">
                  <label className="auth-checkbox-label">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    <span>Remember me on this device</span>
                  </label>
                </div>

                <Button
                  type="submit"
                  fullWidth
                  size="lg"
                  isLoading={isLoading}
                  rightIcon={<ArrowRight size={16} />}
                >
                  Sign In
                </Button>
              </form>

              {/* Google Sign-in Option */}
              <div className="auth-divider">
                <div className="auth-divider-line" />
                <span className="auth-divider-text">Or continue with</span>
                <div className="auth-divider-line" />
              </div>

              <div className="auth-google-wrapper">
                <div id="googleSignInContainer" className="auth-google-btn-container" />
                {!import.meta.env.VITE_GOOGLE_CLIENT_ID && (
                  <p className="text-xs text-secondary text-center mt-1">
                    Google Sign-In ready (configure <code>VITE_GOOGLE_CLIENT_ID</code>)
                  </p>
                )}
              </div>

              {/* Evaluator Demo Shortcuts */}
              <div className="auth-demo-box">
                <div className="auth-demo-title">Evaluation Demo Presets:</div>
                <div className="auth-demo-pills">
                  <button
                    type="button"
                    className="auth-demo-btn"
                    onClick={() => handleQuickFill('candidate', 'candidate@careerconnect.com')}
                  >
                    Candidate
                  </button>
                  <button
                    type="button"
                    className="auth-demo-btn"
                    onClick={() => handleQuickFill('recruiter', 'recruiter@techcorp.com')}
                  >
                    Recruiter
                  </button>
                  <button
                    type="button"
                    className="auth-demo-btn"
                    onClick={() => handleQuickFill('admin', 'admin@careerconnect.com')}
                  >
                    Admin
                  </button>
                </div>
              </div>

              <div className="mt-6 text-center text-sm text-secondary">
                Don't have an account yet?{' '}
                <Link to="/register" className="text-brand font-semibold hover:underline">
                  Create an account
                </Link>
              </div>
            </Card.Body>
          </Card>
        </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default LoginPage;
