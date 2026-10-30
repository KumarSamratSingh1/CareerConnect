package com.careerconnect.backend.dto.request.resume;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class SkillImportItem {

	@NotNull(message = "selected flag is required")
	private Boolean selected;

	@NotBlank(message = "skill name must not be blank")
	@Size(max = 100, message = "skill name must not exceed 100 characters")
	private String name;
}
