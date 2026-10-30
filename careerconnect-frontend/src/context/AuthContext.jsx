import { useState, useEffect, useCallback } from 'react';
import { AuthContext } from './AuthContextInstance';
import authService from '../api/authService';

const TOKEN_KEY = 'careerconnect_token';
const USER_KEY = 'careerconnect_user';

const getInitialAuthState = () => {
  try {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    const storedUser = localStorage.getItem(USER_KEY);

    if (storedToken && storedUser) {
      return {
        token: storedToken,
        user: JSON.parse(storedUser),
      };
    }
  } catch {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
  return {
    token: null,
    user: null,
  };
};

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState(getInitialAuthState);

  /**
   * Clear session and credentials
   */
  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setAuth({ token: null, user: null });
  }, []);

  // Listen for global auth expiration events from apiClient
  useEffect(() => {
    const handleAuthExpired = () => {
      logout();
    };

    window.addEventListener('careerconnect_auth_expired', handleAuthExpired);
    return () => {
      window.removeEventListener('careerconnect_auth_expired', handleAuthExpired);
    };
  }, [logout]);

  /**
   * Log in user and persist credentials in localStorage
   */
  const login = async (credentials) => {
    const authData = await authService.login(credentials);
    if (authData && authData.token) {
      const userData = {
        email: authData.email,
        role: authData.role,
      };
      localStorage.setItem(TOKEN_KEY, authData.token);
      localStorage.setItem(USER_KEY, JSON.stringify(userData));
      setAuth({ token: authData.token, user: userData });
      return userData;
    }
    throw new Error('Authentication succeeded but no token was returned.');
  };

  /**
   * Register new candidate or recruiter account
   */
  const register = async (userData) => {
    const authData = await authService.register(userData);
    if (authData && authData.token) {
      const profileData = {
        email: authData.email,
        role: authData.role,
      };
      localStorage.setItem(TOKEN_KEY, authData.token);
      localStorage.setItem(USER_KEY, JSON.stringify(profileData));
      setAuth({ token: authData.token, user: profileData });
      return profileData;
    }
    return authData;
  };

  /**
   * Log in user with Google ID token
   */
  const loginWithGoogle = async (idToken) => {
    const authData = await authService.googleLogin(idToken);
    if (authData && authData.token) {
      const userData = {
        email: authData.email,
        role: authData.role,
      };
      localStorage.setItem(TOKEN_KEY, authData.token);
      localStorage.setItem(USER_KEY, JSON.stringify(userData));
      setAuth({ token: authData.token, user: userData });
      return userData;
    }
    throw new Error('Google authentication succeeded but no token was returned.');
  };

  const value = {
    token: auth.token,
    user: auth.user,
    role: auth.user?.role || null,
    isAuthenticated: Boolean(auth.token && auth.user),
    isLoading: false,
    login,
    register,
    loginWithGoogle,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
