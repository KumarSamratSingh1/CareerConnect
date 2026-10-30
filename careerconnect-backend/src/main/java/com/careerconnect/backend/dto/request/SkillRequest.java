package com.careerconnect.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class SkillRequest {

	@NotBlank(message = "name must not be blank")
	@Size(max = 100, message = "name must not exceed 100 characters")
	private String name;
}
