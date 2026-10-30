import apiClient from './apiClient';

/**
 * Service for Candidate Applications
 * Endpoints: /api/v1/candidate/applications and /api/v1/candidate/jobs/{jobId}/apply
 */
export const applicationService = {
  /**
   * Get paginated applications for authenticated candidate
   * @param {{ page?: number, size?: number, sort?: string }} params
   */
  async getMyApplications(params = {}) {
    const response = await apiClient.get('/candidate/applications', { params });
    return response.data;
  },

  /**
   * Get single application details with status history
   * @param {number|string} applicationId
   */
  async getMyApplication(applicationId) {
    const response = await apiClient.get(`/candidate/applications/${applicationId}`);
    return response.data;
  },

  /**
   * Apply for a job as candidate
   * @param {number|string} jobId
   * @param {{ coverLetter?: string }} data
   */
  async applyForJob(jobId, data = {}) {
    const response = await apiClient.post(`/candidate/jobs/${jobId}/apply`, data);
    return response.data;
  },
};

export default applicationService;
