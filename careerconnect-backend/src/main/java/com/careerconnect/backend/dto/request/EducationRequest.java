package com.careerconnect.backend.dto.request;

import java.time.LocalDate;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class EducationRequest {

	@NotBlank(message = "institution must not be blank")
	@Size(max = 200, message = "institution must not exceed 200 characters")
	private String institution;

	@NotBlank(message = "degree must not be blank")
	@Size(max = 150, message = "degree must not exceed 150 characters")
	private String degree;

	@Size(max = 150, message = "fieldOfStudy must not exceed 150 characters")
	private String fieldOfStudy;

	private LocalDate startDate;
	private LocalDate endDate;

	@NotNull(message = "currentlyStudying must not be null")
	private Boolean currentlyStudying;
}
