package com.careerconnect.backend.dto.response.resume;

import java.time.LocalDate;

public record ExtractedExperienceDto(
		ExtractedField<String> companyName,
		ExtractedField<String> jobTitle,
		ExtractedField<String> description,
		ExtractedField<LocalDate> startDate,
		ExtractedField<LocalDate> endDate,
		String rawDateRange,
		ExtractedField<Boolean> currentlyWorking
) {
}
