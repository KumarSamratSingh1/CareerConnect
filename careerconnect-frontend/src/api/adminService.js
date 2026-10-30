import apiClient from './apiClient';

/**
 * Clean service layer for Admin Governance & Oversight.
 * Base URL: /api/v1/admin
 */
export const adminService = {
  // ==================== DASHBOARD ====================
  /**
   * Fetch complete platform statistics.
   * @returns {Promise<{ success: boolean, message: string, data: import('./types').DashboardResponse }>}
   */
  async getDashboard() {
    const response = await apiClient.get('/admin/dashboard');
    return response.data;
  },

  // ==================== USERS ====================
  /**
   * Fetch paginated users with optional role, enabled, keyword filters.
   * @param {{ role?: 'CANDIDATE'|'RECRUITER'|'ADMIN', enabled?: boolean, keyword?: string, page?: number, size?: number, sort?: string }} params
   */
  async getUsers(params = {}) {
    const response = await apiClient.get('/admin/users', { params });
    return response.data;
  },

  /**
   * Fetch single user by ID.
   * @param {number|string} userId
   */
  async getUser(userId) {
    const response = await apiClient.get(`/admin/users/${userId}`);
    return response.data;
  },

  /**
   * Enable or disable a user account.
   * @param {number|string} userId
   * @param {boolean} enabled
   */
  async updateUserEnabled(userId, enabled) {
    const response = await apiClient.patch(`/admin/users/${userId}/enabled`, { enabled });
    return response.data;
  },

  // ==================== COMPANIES ====================
  /**
   * Fetch paginated companies with optional verified status and keyword filters.
   * @param {{ verified?: boolean, keyword?: string, page?: number, size?: number, sort?: string }} params
   */
  async getCompanies(params = {}) {
    const response = await apiClient.get('/admin/companies', { params });
    return response.data;
  },

  /**
   * Fetch single company by ID.
   * @param {number|string} companyId
   */
  async getCompany(companyId) {
    const response = await apiClient.get(`/admin/companies/${companyId}`);
    return response.data;
  },

  /**
   * Update company verification status.
   * @param {number|string} companyId
   * @param {boolean} verified
   */
  async updateCompanyVerification(companyId, verified) {
    const response = await apiClient.patch(`/admin/companies/${companyId}/verification`, { verified });
    return response.data;
  },

  // ==================== JOBS ====================
  /**
   * Fetch paginated jobs with status, jobType, keyword filters.
   * @param {{ status?: 'OPEN'|'CLOSED', jobType?: 'JOB'|'INTERNSHIP', keyword?: string, page?: number, size?: number, sort?: string }} params
   */
  async getJobs(params = {}) {
    const response = await apiClient.get('/admin/jobs', { params });
    return response.data;
  },

  /**
   * Fetch single job by ID.
   * @param {number|string} jobId
   */
  async getJob(jobId) {
    const response = await apiClient.get(`/admin/jobs/${jobId}`);
    return response.data;
  },

  /**
   * Force close an active job posting.
   * @param {number|string} jobId
   */
  async closeJob(jobId) {
    const response = await apiClient.patch(`/admin/jobs/${jobId}/close`);
    return response.data;
  },

  // ==================== APPLICATIONS ====================
  /**
   * Fetch paginated platform applications (Read-only audit).
   * @param {{ status?: string, jobId?: number|string, page?: number, size?: number, sort?: string }} params
   */
  async getApplications(params = {}) {
    const response = await apiClient.get('/admin/applications', { params });
    return response.data;
  },

  /**
   * Fetch single application audit details.
   * @param {number|string} applicationId
   */
  async getApplication(applicationId) {
    const response = await apiClient.get(`/admin/applications/${applicationId}`);
    return response.data;
  },

  // ==================== INTERVIEWS ====================
  /**
   * Fetch paginated platform interviews (Read-only audit).
   * @param {{ status?: string, mode?: string, jobId?: number|string, page?: number, size?: number, sort?: string }} params
   */
  async getInterviews(params = {}) {
    const response = await apiClient.get('/admin/interviews', { params });
    return response.data;
  },

  /**
   * Fetch single interview audit details.
   * @param {number|string} interviewId
   */
  async getInterview(interviewId) {
    const response = await apiClient.get(`/admin/interviews/${interviewId}`);
    return response.data;
  },
};

export default adminService;
