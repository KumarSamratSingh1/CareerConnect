package com.careerconnect.backend.dto.response;

import java.time.LocalDate;

import com.careerconnect.backend.common.enums.EmploymentType;
import com.careerconnect.backend.common.enums.JobStatus;
import com.careerconnect.backend.common.enums.JobType;

public record JobSummaryResponse(
		Long id,
		String title,
		JobCompanyResponse company,
		String location,
		JobType jobType,
		EmploymentType employmentType,
		JobStatus status,
		LocalDate applicationDeadline
) {
}
