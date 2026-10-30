package com.careerconnect.backend.dto.response;

import java.time.LocalDateTime;
import java.util.List;

import com.careerconnect.backend.common.enums.ApplicationStatus;

public record RecruiterApplicationResponse(
		Long id,
		JobSummaryResponse job,
		CandidateProfileResponse candidate,
		ApplicationStatus status,
		String coverLetter,
		LocalDateTime appliedAt,
		LocalDateTime updatedAt,
		List<ApplicationStatusHistoryResponse> statusHistory
) {
}
