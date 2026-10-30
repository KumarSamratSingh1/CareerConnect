package com.careerconnect.backend.controller;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.careerconnect.backend.common.dto.ApiResponse;
import com.careerconnect.backend.common.dto.PageResponse;
import com.careerconnect.backend.dto.request.CreateJobRequest;
import com.careerconnect.backend.dto.request.UpdateJobRequest;
import com.careerconnect.backend.dto.response.JobResponse;
import com.careerconnect.backend.service.JobService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/recruiter/jobs")
@RequiredArgsConstructor
public class RecruiterJobController {

	private final JobService jobService;

	@PostMapping
	public ResponseEntity<ApiResponse<JobResponse>> createJob(@Valid @RequestBody CreateJobRequest request) {
		return ResponseEntity.status(HttpStatus.CREATED)
				.body(ApiResponse.success("Job created", jobService.createJob(request)));
	}

	@PutMapping("/{jobId}")
	public ResponseEntity<ApiResponse<JobResponse>> updateJob(
			@PathVariable Long jobId,
			@Valid @RequestBody UpdateJobRequest request
	) {
		return ResponseEntity.ok(ApiResponse.success("Job updated", jobService.updateMyJob(jobId, request)));
	}

	@PatchMapping("/{jobId}/close")
	public ResponseEntity<ApiResponse<JobResponse>> closeJob(@PathVariable Long jobId) {
		return ResponseEntity.ok(ApiResponse.success("Job closed", jobService.closeMyJob(jobId)));
	}

	@GetMapping
	public ResponseEntity<ApiResponse<PageResponse<JobResponse>>> getMyJobs(
			@PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
	) {
		return ResponseEntity.ok(ApiResponse.success(jobService.getMyJobs(pageable)));
	}
}
