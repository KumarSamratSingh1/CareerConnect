import apiClient from './apiClient';

/**
 * Service for Candidate Resume Intelligence:
 * - Parsing PDF/DOCX resumes into draft representations
 * - Reviewing and importing approved fields into candidate profiles
 */
export const resumeService = {
  /**
   * Parse uploaded resume file (PDF or DOCX, max 10MB)
   * @param {File} file
   * @returns {Promise<import('./types').ApiResponse<ResumeDraftResponse>>}
   */
  async parseResume(file) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post('/candidate/resume/parse', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 30000, // Parsing multi-page PDFs can take longer
    });
    return response.data;
  },

  /**
   * Import approved, candidate-edited resume sections into profile
   * @param {object} payload - ResumeImportRequest payload
   * @returns {Promise<import('./types').ApiResponse<ResumeImportResponse>>}
   */
  async importResume(payload) {
    const response = await apiClient.post('/candidate/resume/import', payload);
    return response.data;
  },
};

export default resumeService;
