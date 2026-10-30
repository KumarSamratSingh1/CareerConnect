package com.careerconnect.backend.dto.request;

import com.careerconnect.backend.common.enums.InterviewStatus;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class UpdateInterviewStatusRequest {

	@NotNull(message = "status must not be null")
	private InterviewStatus status;
}
