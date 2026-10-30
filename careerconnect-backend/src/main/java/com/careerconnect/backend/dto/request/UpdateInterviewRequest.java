package com.careerconnect.backend.dto.request;

import java.time.LocalDateTime;

import com.careerconnect.backend.common.enums.InterviewMode;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class UpdateInterviewRequest {

	@NotNull(message = "scheduledDateTime must not be null")
	private LocalDateTime scheduledDateTime;

	@NotNull(message = "interviewMode must not be null")
	private InterviewMode interviewMode;

	@Size(max = 500, message = "meetingLink must not exceed 500 characters")
	private String meetingLink;

	@Size(max = 255, message = "location must not exceed 255 characters")
	private String location;

	@Size(max = 2000, message = "notes must not exceed 2000 characters")
	private String notes;
}
