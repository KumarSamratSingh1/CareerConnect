import apiClient from './apiClient';

/**
 * Service for Candidate Saved Jobs (Bookmarks)
 * Endpoints: /api/v1/candidate/jobs/{jobId}/save and /api/v1/candidate/jobs/saved
 */
export const savedJobService = {
  /**
   * Get paginated saved jobs for authenticated candidate
   * @param {{ page?: number, size?: number, sort?: string }} params
   */
  async getMySavedJobs(params = {}) {
    const response = await apiClient.get('/candidate/jobs/saved', { params });
    return response.data;
  },

  /**
   * Save / bookmark a job
   * @param {number|string} jobId
   */
  async saveJob(jobId) {
    const response = await apiClient.post(`/candidate/jobs/${jobId}/save`);
    return response.data;
  },

  /**
   * Remove a saved job using jobId
   * @param {number|string} jobId
   */
  async removeSavedJob(jobId) {
    const response = await apiClient.delete(`/candidate/jobs/${jobId}/save`);
    return response.data;
  },
};

export default savedJobService;
