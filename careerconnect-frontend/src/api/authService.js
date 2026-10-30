import apiClient from './apiClient';

/**
 * Authentication Service connecting to CareerConnect backend authentication endpoints:
 * - POST /api/v1/auth/login
 * - POST /api/v1/auth/register
 */
export const authService = {
  /**
   * Log in user with email and password
   * @param {Object} credentials - { email, password }
   * @returns {Promise<Object>} AuthResponse data { token, tokenType, email, role }
   */
  async login({ email, password }) {
    const normalizedEmail = email ? email.trim().toLowerCase() : '';
    const response = await apiClient.post('/auth/login', {
      email: normalizedEmail,
      password: password,
    });
    // Backend returns ApiResponse<AuthResponse>: { success, message, data: { token, tokenType, email, role } }
    return response.data?.data;
  },

  /**
   * Register a new user with email, password, and role
   * @param {Object} userData - { email, password, role }
   * @returns {Promise<Object>} AuthResponse data { token, tokenType, email, role }
   */
  async register({ email, password, role }) {
    const normalizedEmail = email ? email.trim().toLowerCase() : '';
    const response = await apiClient.post('/auth/register', {
      email: normalizedEmail,
      password: password,
      role: role,
    });
    return response.data?.data;
  },

  /**
   * Authenticate with Google ID token
   * @param {string} idToken - Google ID token or credential
   * @returns {Promise<Object>} AuthResponse data { token, tokenType, email, role }
   */
  async googleLogin(idToken) {
    const response = await apiClient.post('/auth/google', {
      idToken,
      credential: idToken,
    });
    return response.data?.data;
  },
};

export default authService;
