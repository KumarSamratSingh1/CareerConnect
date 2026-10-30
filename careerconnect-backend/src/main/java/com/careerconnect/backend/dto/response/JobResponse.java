package com.careerconnect.backend.dto.response;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import com.careerconnect.backend.common.enums.EmploymentType;
import com.careerconnect.backend.common.enums.JobStatus;
import com.careerconnect.backend.common.enums.JobType;

public record JobResponse(
		Long id,
		String title,
		String description,
		JobCompanyResponse company,
		String location,
		JobType jobType,
		EmploymentType employmentType,
		Integer minSalary,
		Integer maxSalary,
		List<SkillResponse> requiredSkills,
		Integer minExperience,
		String duration,
		LocalDate applicationDeadline,
		JobStatus status,
		LocalDateTime createdAt,
		LocalDateTime updatedAt
) {
}
