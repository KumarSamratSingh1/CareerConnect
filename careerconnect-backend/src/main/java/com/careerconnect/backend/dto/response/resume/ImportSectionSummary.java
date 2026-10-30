package com.careerconnect.backend.dto.response.resume;

public record ImportSectionSummary(
		int requested,
		int imported,
		int skipped
) {
}
