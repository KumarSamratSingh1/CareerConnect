package com.careerconnect.backend.dto.response.resume;

public record ExtractedCertificationDto(
		ExtractedField<String> name,
		ExtractedField<String> issuingOrganization
) {
}
