package com.careerconnect.backend.dto.response.resume;

import java.time.LocalDate;

public record ExtractedEducationDto(
		ExtractedField<String> institution,
		ExtractedField<String> degree,
		ExtractedField<String> fieldOfStudy,
		ExtractedField<LocalDate> startDate,
		ExtractedField<LocalDate> endDate,
		String rawDateRange,
		ExtractedField<Boolean> currentlyStudying
) {
}
