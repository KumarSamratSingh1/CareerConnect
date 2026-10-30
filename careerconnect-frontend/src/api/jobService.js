import apiClient from './apiClient';

/**
 * Service for Public Jobs Search & Retrieval
 * Endpoints: /api/v1/jobs
 */
export const jobService = {
  /**
   * Get public jobs with filters and pagination
   * @param {{ keyword?: string, location?: string, jobType?: string, employmentType?: string, page?: number, size?: number, sort?: string }} params
   */
  async getPublicJobs(params = {}) {
    const response = await apiClient.get('/jobs', { params });
    return response.data;
  },

  /**
   * Get single job details
   * @param {number|string} jobId
   */
  async getPublicJob(jobId) {
    const response = await apiClient.get(`/jobs/${jobId}`);
    return response.data;
  },
};

export default jobService;
