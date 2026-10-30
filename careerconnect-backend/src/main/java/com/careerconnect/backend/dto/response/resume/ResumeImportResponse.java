package com.careerconnect.backend.dto.response.resume;

import java.util.List;

public record ResumeImportResponse(
		ImportSectionSummary personalDetails,
		ImportSectionSummary educations,
		ImportSectionSummary experiences,
		ImportSectionSummary skills,
		ImportSectionSummary projects,
		ImportSectionSummary certifications,
		ImportSectionSummary socialLinks,
		List<ImportRecordError> errors
) {
}
