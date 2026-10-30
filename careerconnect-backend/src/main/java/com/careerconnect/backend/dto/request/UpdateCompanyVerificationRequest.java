package com.careerconnect.backend.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class UpdateCompanyVerificationRequest {

	@NotNull(message = "verified must not be null")
	private Boolean verified;
}
