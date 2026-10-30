import apiClient from './apiClient';

/**
 * Service for Recruiter Application Review and Status Management.
 * Endpoints: /api/v1/recruiter/jobs/{jobId}/applications and /api/v1/recruiter/applications/{applicationId}*
 */
export const recruiterApplicationService = {
  /**
   * Get paginated applications submitted for a specific job posted by the recruiter.
   * @param {number|string} jobId
   * @param {{ page?: number, size?: number, sort?: string }} params
   */
  async getJobApplications(jobId, params = {}) {
    const response = await apiClient.get(`/recruiter/jobs/${jobId}/applications`, { params });
    return response.data;
  },

  /**
   * Get single application details including candidate profile, resumeUrl, educations, experiences, skills, and status history.
   * @param {number|string} applicationId
   */
  async getApplication(applicationId) {
    const response = await apiClient.get(`/recruiter/applications/${applicationId}`);
    return response.data;
  },

  /**
   * Advance or update application status.
   * Allowed transitions strictly enforced by backend:
   *   APPLIED -> UNDER_REVIEW | REJECTED
   *   UNDER_REVIEW -> SHORTLISTED | REJECTED
   *   SHORTLISTED -> INTERVIEW_SCHEDULED | SELECTED | REJECTED
   *   INTERVIEW_SCHEDULED -> SELECTED | REJECTED
   * @param {number|string} applicationId
   * @param {'APPLIED' | 'UNDER_REVIEW' | 'SHORTLISTED' | 'INTERVIEW_SCHEDULED' | 'SELECTED' | 'REJECTED'} status
   */
  async updateApplicationStatus(applicationId, status) {
    const response = await apiClient.patch(`/recruiter/applications/${applicationId}/status`, {
      status,
    });
    return response.data;
  },
};

export default recruiterApplicationService;
