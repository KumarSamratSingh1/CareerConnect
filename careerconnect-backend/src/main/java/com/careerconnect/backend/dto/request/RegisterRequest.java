package com.careerconnect.backend.dto.request;

import com.careerconnect.backend.common.enums.Role;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class RegisterRequest {

	@NotBlank(message = "email must not be blank")
	@Email(message = "email must be a valid email")
	private String email;

	@NotBlank(message = "password must not be blank")
	@Size(min = 8, message = "password must be at least 8 characters")
	private String password;

	@NotNull(message = "role must not be null")
	private Role role;
}
