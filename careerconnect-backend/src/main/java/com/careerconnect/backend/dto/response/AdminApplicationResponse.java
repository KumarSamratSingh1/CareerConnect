package com.careerconnect.backend.dto.response;

import java.time.LocalDateTime;
import java.util.List;

import com.careerconnect.backend.common.enums.ApplicationStatus;

public record AdminApplicationResponse(
		Long id, AdminUserResponse candidate, JobSummaryResponse job, ApplicationStatus status,
		LocalDateTime appliedAt, List<ApplicationStatusHistoryResponse> statusHistory
) {
}
