package com.careerconnect.backend.dto.response.resume;

public record ExtractedSocialLinksDto(
		ExtractedField<String> linkedIn,
		ExtractedField<String> gitHub,
		ExtractedField<String> portfolio
) {
}
