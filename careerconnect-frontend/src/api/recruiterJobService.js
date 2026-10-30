import apiClient from './apiClient';

/**
 * Service for Recruiter Job Management.
 * Endpoints: /api/v1/recruiter/jobs
 */
export const recruiterJobService = {
  /**
   * Get paginated jobs posted by the authenticated recruiter's company.
   * @param {{ page?: number, size?: number, sort?: string }} params
   * @returns {Promise<{ success: boolean, message: string, data: { content: Array<any>, page: number, size: number, totalElements: number, totalPages: number, last: boolean } }>}
   */
  async getMyJobs(params = {}) {
    const response = await apiClient.get('/recruiter/jobs', { params });
    return response.data;
  },

  /**
   * Post a new job or internship.
   * @param {{
   *   title: string,
   *   description: string,
   *   location: string,
   *   jobType: 'JOB' | 'INTERNSHIP',
   *   employmentType: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP',
   *   minSalary?: number,
   *   maxSalary?: number,
   *   minExperience?: number,
   *   applicationDeadline?: string,
   *   duration?: string,
   *   requiredSkills?: string[]
   * }} data
   */
  async createJob(data) {
    const response = await apiClient.post('/recruiter/jobs', data);
    return response.data;
  },

  /**
   * Update an existing job owned by the recruiter.
   * @param {number|string} jobId
   * @param {object} data
   */
  async updateJob(jobId, data) {
    const response = await apiClient.put(`/recruiter/jobs/${jobId}`, data);
    return response.data;
  },

  /**
   * Close a job (OPEN -> CLOSED).
   * @param {number|string} jobId
   */
  async closeJob(jobId) {
    const response = await apiClient.patch(`/recruiter/jobs/${jobId}/close`);
    return response.data;
  },
};

export default recruiterJobService;
