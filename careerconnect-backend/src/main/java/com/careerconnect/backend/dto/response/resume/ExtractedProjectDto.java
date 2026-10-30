package com.careerconnect.backend.dto.response.resume;

import java.util.List;

public record ExtractedProjectDto(
		ExtractedField<String> title,
		ExtractedField<String> description,
		List<String> technologies
) {
}
