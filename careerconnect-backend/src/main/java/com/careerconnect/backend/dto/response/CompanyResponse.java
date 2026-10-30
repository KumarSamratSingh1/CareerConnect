package com.careerconnect.backend.dto.response;

import java.time.LocalDateTime;

public record CompanyResponse(
		Long id,
		String name,
		String description,
		String website,
		String location,
		String industry,
		Boolean verified,
		LocalDateTime createdAt,
		LocalDateTime updatedAt
) {
}
