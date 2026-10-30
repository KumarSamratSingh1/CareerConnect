package com.careerconnect.backend.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class LoginRequest {

	@NotBlank(message = "email must not be blank")
	@Email(message = "email must be a valid email")
	private String email;

	@NotBlank(message = "password must not be blank")
	private String password;
}
