package com.careerconnect.backend.dto.request;

import com.careerconnect.backend.common.enums.ApplicationStatus;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class UpdateApplicationStatusRequest {

	@NotNull(message = "status must not be null")
	private ApplicationStatus status;
}
