package com.careerconnect.backend.dto.response;

import java.time.LocalDate;

public record ExperienceResponse(
		Long id,
		String companyName,
		String jobTitle,
		String description,
		LocalDate startDate,
		LocalDate endDate,
		Boolean currentlyWorking
) {
}
