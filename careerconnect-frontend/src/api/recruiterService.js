import apiClient from './apiClient';

/**
 * Service for Recruiter Profile operations.
 * Endpoints: /api/v1/recruiter/profile
 */
export const recruiterService = {
  /**
   * Fetch current authenticated recruiter's profile.
   * Throws 404 if not created yet.
   * @returns {Promise<{ success: boolean, message: string, data: { id: number, fullName: string, phone: string, designation: string } }>}
   */
  async getProfile() {
    const response = await apiClient.get('/recruiter/profile');
    return response.data;
  },

  /**
   * Create recruiter profile for first-time onboarding.
   * @param {{ fullName: string, phone?: string, designation?: string }} data
   */
  async createProfile(data) {
    const response = await apiClient.post('/recruiter/profile', data);
    return response.data;
  },

  /**
   * Update existing recruiter profile.
   * @param {{ fullName: string, phone?: string, designation?: string }} data
   */
  async updateProfile(data) {
    const response = await apiClient.put('/recruiter/profile', data);
    return response.data;
  },
};

export default recruiterService;
