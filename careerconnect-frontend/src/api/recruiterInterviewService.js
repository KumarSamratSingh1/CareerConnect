import apiClient from './apiClient';

/**
 * Service for Recruiter Interview Management.
 * Endpoints: /api/v1/recruiter/interviews and /api/v1/recruiter/applications/{applicationId}/interviews
 */
export const recruiterInterviewService = {
  /**
   * Get paginated interviews for current recruiter.
   * @param {{ status?: string, mode?: string, jobId?: number|string, page?: number, size?: number, sort?: string }} params
   */
  async getInterviews(params = {}) {
    const response = await apiClient.get('/recruiter/interviews', { params });
    return response.data;
  },

  /**
   * Get single interview details.
   * @param {number|string} interviewId
   */
  async getInterview(interviewId) {
    const response = await apiClient.get(`/recruiter/interviews/${interviewId}`);
    return response.data;
  },

  /**
   * Schedule a new interview for a shortlisted application.
   * @param {number|string} applicationId
   * @param {{
   *   scheduledDateTime: string,
   *   interviewMode: 'ONLINE' | 'OFFLINE' | 'PHONE',
   *   meetingLink?: string,
   *   location?: string,
   *   notes?: string
   * }} data
   */
  async scheduleInterview(applicationId, data) {
    const response = await apiClient.post(`/recruiter/applications/${applicationId}/interviews`, data);
    return response.data;
  },

  /**
   * Reschedule or update details of an existing SCHEDULED interview.
   * @param {number|string} interviewId
   * @param {{
   *   scheduledDateTime: string,
   *   interviewMode: 'ONLINE' | 'OFFLINE' | 'PHONE',
   *   meetingLink?: string,
   *   location?: string,
   *   notes?: string
   * }} data
   */
  async updateInterview(interviewId, data) {
    const response = await apiClient.put(`/recruiter/interviews/${interviewId}`, data);
    return response.data;
  },

  /**
   * Update interview status (SCHEDULED -> COMPLETED | CANCELLED).
   * @param {number|string} interviewId
   * @param {'COMPLETED' | 'CANCELLED'} status
   */
  async updateInterviewStatus(interviewId, status) {
    const response = await apiClient.patch(`/recruiter/interviews/${interviewId}/status`, {
      status,
    });
    return response.data;
  },
};

export default recruiterInterviewService;
