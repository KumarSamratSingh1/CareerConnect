package com.careerconnect.backend.service.resume.ai.dto;

public record AiExperience(
		String companyName,
		String jobTitle,
		String description,
		String rawDateRange,
		Boolean currentlyWorking
) {
}
