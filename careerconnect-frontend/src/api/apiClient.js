import axios from 'axios';

/**
 * Standard Axios Client for CareerConnect REST API.
 * Base URL: http://localhost:8080/api/v1
 */
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 15000,
});

// Request Interceptor: Attach JWT Token when available
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('careerconnect_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Centralized error handling & token expiration detection
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // If a request fails with 401 Unauthorized (e.g. token expired), notify the auth context
    if (error.response && error.response.status === 401) {
      // Don't trigger auto-logout on auth requests themselves
      const requestUrl = error.config?.url || '';
      const isAuthEndpoint =
        requestUrl.includes('/auth/login') ||
        requestUrl.includes('/auth/register') ||
        requestUrl.includes('/auth/google');

      if (!isAuthEndpoint) {
        try {
          sessionStorage.setItem('careerconnect_session_expired', 'true');
        } catch {
          // ignore storage error
        }
        window.dispatchEvent(new Event('careerconnect_auth_expired'));
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
