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
public class ExperienceImportItem {

	@NotNull(message = "selected flag is required")
	private Boolean selected;

	@Size(max = 200, message = "companyName must not exceed 200 characters")
	private String companyName;

	@Size(max = 150, message = "jobTitle must not exceed 150 characters")
	private String jobTitle;

	@Size(max = 2000, message = "description must not exceed 2000 characters")
	private String description;

	private LocalDate startDate;

	private LocalDate endDate;

	private Boolean currentlyWorking;
}
