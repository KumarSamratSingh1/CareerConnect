package com.careerconnect.backend.service.resume.ai.dto;

import java.util.List;

public record AiProject(
		String title,
		String description,
		List<String> technologies
) {
}
