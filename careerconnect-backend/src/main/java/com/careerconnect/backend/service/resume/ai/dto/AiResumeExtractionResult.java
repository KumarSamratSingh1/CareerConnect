package com.careerconnect.backend.service.resume.ai.dto;

import java.util.List;

public record AiResumeExtractionResult(
		AiPersonalDetails personalDetails,
		String professionalSummary,
		List<AiSkill> skills,
		List<AiEducation> educations,
		List<AiExperience> experiences,
		List<AiProject> projects,
		List<AiCertification> certifications,
		AiSocialLinks socialLinks
) {
}
