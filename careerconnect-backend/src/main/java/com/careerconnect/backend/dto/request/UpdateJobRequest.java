package com.careerconnect.backend.dto.request;

import java.time.LocalDate;
import java.util.List;

import com.careerconnect.backend.common.enums.EmploymentType;
import com.careerconnect.backend.common.enums.JobType;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class UpdateJobRequest {

	@NotBlank(message = "title must not be blank")
	@Size(max = 200, message = "title must not exceed 200 characters")
	private String title;

	@NotBlank(message = "description must not be blank")
	@Size(max = 5000, message = "description must not exceed 5000 characters")
	private String description;

	@NotBlank(message = "location must not be blank")
	@Size(max = 150, message = "location must not exceed 150 characters")
	private String location;

	@NotNull(message = "jobType must not be null")
	private JobType jobType;

	@NotNull(message = "employmentType must not be null")
	private EmploymentType employmentType;

	@PositiveOrZero(message = "minSalary must not be negative")
	private Integer minSalary;

	@PositiveOrZero(message = "maxSalary must not be negative")
	private Integer maxSalary;

	@PositiveOrZero(message = "minExperience must not be negative")
	private Integer minExperience;

	private LocalDate applicationDeadline;

	@Size(max = 50, message = "duration must not exceed 50 characters")
	private String duration;

	private List<@NotBlank(message = "required skill must not be blank") @Size(max = 100, message = "required skill must not exceed 100 characters") String> requiredSkills;
}
