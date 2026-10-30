import apiClient from './apiClient';

/**
 * Service for Company Profile management.
 * Endpoints: /api/v1/recruiter/company
 */
export const companyService = {
  /**
   * Fetch recruiter's company profile.
   * Throws 404 if not created yet.
   * @returns {Promise<{ success: boolean, message: string, data: { id: number, name: string, description: string, website: string, location: string, industry: string, verified: boolean, createdAt: string, updatedAt: string } }>}
   */
  async getMyCompany() {
    const response = await apiClient.get('/recruiter/company');
    return response.data;
  },

  /**
   * Create company profile (recruiter can only have one company).
   * @param {{ name: string, description?: string, website?: string, location: string, industry: string }} data
   */
  async createCompany(data) {
    const response = await apiClient.post('/recruiter/company', data);
    return response.data;
  },

  /**
   * Update existing company profile.
   * Note: 'verified' status is read-only and managed strictly by admins.
   * @param {{ name: string, description?: string, website?: string, location: string, industry: string }} data
   */
  async updateMyCompany(data) {
    const response = await apiClient.put('/recruiter/company', data);
    return response.data;
  },
};

export default companyService;
