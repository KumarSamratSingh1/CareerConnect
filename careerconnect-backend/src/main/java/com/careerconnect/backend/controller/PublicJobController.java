package com.careerconnect.backend.controller;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.careerconnect.backend.common.dto.ApiResponse;
import com.careerconnect.backend.common.dto.PageResponse;
import com.careerconnect.backend.common.enums.EmploymentType;
import com.careerconnect.backend.common.enums.JobType;
import com.careerconnect.backend.dto.response.JobResponse;
import com.careerconnect.backend.service.JobService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/jobs")
@RequiredArgsConstructor
public class PublicJobController {

	private final JobService jobService;

	@GetMapping
	public ResponseEntity<ApiResponse<PageResponse<JobResponse>>> getJobs(
			@RequestParam(required = false) String keyword,
			@RequestParam(required = false) String location,
			@RequestParam(required = false) JobType jobType,
			@RequestParam(required = false) EmploymentType employmentType,
			@PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
	) {
		return ResponseEntity.ok(ApiResponse.success(
				jobService.getPublicJobs(keyword, location, jobType, employmentType, pageable)
		));
	}

	@GetMapping("/{jobId}")
	public ResponseEntity<ApiResponse<JobResponse>> getJob(@PathVariable Long jobId) {
		return ResponseEntity.ok(ApiResponse.success(jobService.getPublicJob(jobId)));
	}
}
