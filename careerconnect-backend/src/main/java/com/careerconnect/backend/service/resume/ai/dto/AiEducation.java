package com.careerconnect.backend.service.resume.ai.dto;

public record AiEducation(
		String institution,
		String degree,
		String fieldOfStudy,
		String rawDateRange,
		Boolean currentlyStudying
) {
}
