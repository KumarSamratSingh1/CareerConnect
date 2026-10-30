package com.careerconnect.backend.dto.response;

import java.time.LocalDateTime;
import java.util.List;

import com.careerconnect.backend.common.enums.ApplicationStatus;

public record ApplicationResponse(
		Long id,
		JobSummaryResponse job,
		ApplicationStatus status,
		String coverLetter,
		LocalDateTime appliedAt,
		LocalDateTime updatedAt,
		List<ApplicationStatusHistoryResponse> statusHistory
) {
}
