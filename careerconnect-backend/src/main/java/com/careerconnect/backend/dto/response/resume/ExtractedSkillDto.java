package com.careerconnect.backend.dto.response.resume;

public record ExtractedSkillDto(
		String name,
		String category,
		double confidence
) {
}
