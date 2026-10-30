package com.careerconnect.backend.dto.response.resume;

import java.time.LocalDateTime;

public record ExtractionMetadataDto(
		String fileName,
		String fileType,
		long fileSizeBytes,
		int characterCount,
		String extractionMethod,
		LocalDateTime processedAt
) {
}
