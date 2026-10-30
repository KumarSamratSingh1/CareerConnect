package com.careerconnect.backend.dto.response;

import java.time.LocalDateTime;

import com.careerconnect.backend.common.enums.InterviewMode;
import com.careerconnect.backend.common.enums.InterviewStatus;

public record InterviewResponse(
		Long id,
		JobSummaryResponse job,
		LocalDateTime scheduledDateTime,
		InterviewMode interviewMode,
		String meetingLink,
		String location,
		InterviewStatus status,
		String notes,
		LocalDateTime createdAt,
		LocalDateTime updatedAt
) {
}
