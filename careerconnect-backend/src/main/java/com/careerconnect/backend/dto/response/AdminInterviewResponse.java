package com.careerconnect.backend.dto.response;

import java.time.LocalDateTime;

import com.careerconnect.backend.common.enums.InterviewMode;
import com.careerconnect.backend.common.enums.InterviewStatus;

public record AdminInterviewResponse(
		Long id, AdminUserResponse candidate, JobSummaryResponse job, LocalDateTime scheduledDateTime,
		InterviewMode interviewMode, InterviewStatus status
) {
}
