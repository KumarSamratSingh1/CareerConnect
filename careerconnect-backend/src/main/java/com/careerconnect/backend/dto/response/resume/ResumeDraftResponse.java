package com.careerconnect.backend.dto.response.resume;

import java.util.List;

public record ResumeDraftResponse(
		PersonalDetailsDto personalDetails,
		ExtractedField<String> professionalSummary,
		List<ExtractedSkillDto> skills,
		List<ExtractedEducationDto> educations,
		List<ExtractedExperienceDto> experiences,
		List<ExtractedProjectDto> projects,
		List<ExtractedCertificationDto> certifications,
		ExtractedSocialLinksDto socialLinks,
		List<String> warnings,
		ExtractionMetadataDto extractionMetadata
) {
}
