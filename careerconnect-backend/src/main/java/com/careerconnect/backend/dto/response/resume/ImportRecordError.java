package com.careerconnect.backend.dto.response.resume;

public record ImportRecordError(
		String section,
		int index,
		String reason
) {
}
