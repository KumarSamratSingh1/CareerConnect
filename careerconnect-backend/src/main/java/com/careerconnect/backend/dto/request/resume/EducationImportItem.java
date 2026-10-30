package com.careerconnect.backend.dto.request.resume;

import java.time.LocalDate;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class EducationImportItem {

	@NotNull(message = "selected flag is required")
	private Boolean selected;

	@Size(max = 200, message = "institution must not exceed 200 characters")
	private String institution;

	@Size(max = 150, message = "degree must not exceed 150 characters")
	private String degree;

	@Size(max = 150, message = "fieldOfStudy must not exceed 150 characters")
	private String fieldOfStudy;

	private LocalDate startDate;

	private LocalDate endDate;

	private Boolean currentlyStudying;
}
