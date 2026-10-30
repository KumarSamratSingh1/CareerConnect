package com.careerconnect.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class RecruiterProfileRequest {

	@NotBlank(message = "fullName must not be blank")
	@Size(max = 150, message = "fullName must not exceed 150 characters")
	private String fullName;

	@Size(max = 20, message = "phone must not exceed 20 characters")
	private String phone;

	@Size(max = 150, message = "designation must not exceed 150 characters")
	private String designation;
}
