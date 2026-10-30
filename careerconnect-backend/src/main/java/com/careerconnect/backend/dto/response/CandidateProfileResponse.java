package com.careerconnect.backend.dto.response;

import java.util.List;

public record CandidateProfileResponse(
		Long id,
		String fullName,
		String phone,
		String resumeUrl,
		List<EducationResponse> educations,
		List<ExperienceResponse> experiences,
		List<SkillResponse> skills,
		String linkedInUrl,
		String gitHubUrl,
		String portfolioUrl
) {
	public CandidateProfileResponse(
			Long id,
			String fullName,
			String phone,
			String resumeUrl,
			List<EducationResponse> educations,
			List<ExperienceResponse> experiences,
			List<SkillResponse> skills
	) {
		this(id, fullName, phone, resumeUrl, educations, experiences, skills, null, null, null);
	}
}
