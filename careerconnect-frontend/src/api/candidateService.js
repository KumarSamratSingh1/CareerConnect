import apiClient from './apiClient';

/**
 * Service for Candidate Profile and sub-resources (Educations, Experiences, Skills)
 * Endpoints: /api/v1/candidate/*
 */
export const candidateService = {
  /**
   * Fetch candidate profile
   */
  async getProfile() {
    const response = await apiClient.get('/candidate/profile');
    return response.data;
  },

  /**
   * Create candidate profile (initial)
   * @param {{ fullName: string, phone?: string, resumeUrl?: string }} data
   */
  async createProfile(data) {
    const response = await apiClient.post('/candidate/profile', data);
    return response.data;
  },

  /**
   * Update candidate basic profile
   * @param {{ fullName: string, phone?: string, resumeUrl?: string }} data
   */
  async updateProfile(data) {
    const response = await apiClient.put('/candidate/profile', data);
    return response.data;
  },

  // --- Educations ---

  /**
   * Get all educations for current candidate
   */
  async getEducations() {
    const response = await apiClient.get('/candidate/educations');
    return response.data;
  },

  /**
   * Add education
   * @param {{ institution: string, degree: string, fieldOfStudy?: string, startDate?: string, endDate?: string, currentlyStudying: boolean }} data
   */
  async addEducation(data) {
    const response = await apiClient.post('/candidate/educations', data);
    return response.data;
  },

  /**
   * Update education
   * @param {number|string} educationId
   * @param {object} data
   */
  async updateEducation(educationId, data) {
    const response = await apiClient.put(`/candidate/educations/${educationId}`, data);
    return response.data;
  },

  /**
   * Delete education
   * @param {number|string} educationId
   */
  async deleteEducation(educationId) {
    const response = await apiClient.delete(`/candidate/educations/${educationId}`);
    return response.data;
  },

  // --- Experiences ---

  /**
   * Get all experiences for current candidate
   */
  async getExperiences() {
    const response = await apiClient.get('/candidate/experiences');
    return response.data;
  },

  /**
   * Add experience
   * @param {{ companyName: string, jobTitle: string, description?: string, startDate?: string, endDate?: string, currentlyWorking: boolean }} data
   */
  async addExperience(data) {
    const response = await apiClient.post('/candidate/experiences', data);
    return response.data;
  },

  /**
   * Update experience
   * @param {number|string} experienceId
   * @param {object} data
   */
  async updateExperience(experienceId, data) {
    const response = await apiClient.put(`/candidate/experiences/${experienceId}`, data);
    return response.data;
  },

  /**
   * Delete experience
   * @param {number|string} experienceId
   */
  async deleteExperience(experienceId) {
    const response = await apiClient.delete(`/candidate/experiences/${experienceId}`);
    return response.data;
  },

  // --- Skills ---

  /**
   * Get all skills for current candidate
   */
  async getSkills() {
    const response = await apiClient.get('/candidate/skills');
    return response.data;
  },

  /**
   * Add a skill
   * @param {{ name: string }} data
   */
  async addSkill(data) {
    const response = await apiClient.post('/candidate/skills', data);
    return response.data;
  },

  /**
   * Remove a skill
   * @param {number|string} skillId
   */
  async removeSkill(skillId) {
    const response = await apiClient.delete(`/candidate/skills/${skillId}`);
    return response.data;
  },
};

export default candidateService;
