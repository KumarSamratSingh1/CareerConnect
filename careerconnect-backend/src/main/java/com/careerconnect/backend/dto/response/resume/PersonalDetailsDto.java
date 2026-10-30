package com.careerconnect.backend.dto.response.resume;

public record PersonalDetailsDto(
		ExtractedField<String> fullName,
		ExtractedField<String> email,
		ExtractedField<String> phone,
		ExtractedField<String> location
) {
}
