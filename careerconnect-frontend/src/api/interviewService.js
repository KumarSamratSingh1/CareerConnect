import apiClient from './apiClient';

/**
 * Service for Candidate Interviews
 * Endpoints: /api/v1/candidate/interviews
 */
export const interviewService = {
  /**
   * Get paginated interviews for authenticated candidate
   * @param {{ page?: number, size?: number, sort?: string }} params
   */
  async getMyInterviews(params = {}) {
    const response = await apiClient.get('/candidate/interviews', { params });
    return response.data;
  },

  /**
   * Get single interview details
   * @param {number|string} interviewId
   */
  async getMyInterview(interviewId) {
    const response = await apiClient.get(`/candidate/interviews/${interviewId}`);
    return response.data;
  },
};

export default interviewService;
