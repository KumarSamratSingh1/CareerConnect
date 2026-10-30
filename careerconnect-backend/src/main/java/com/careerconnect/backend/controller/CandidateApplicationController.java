package com.careerconnect.backend.controller;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.careerconnect.backend.common.dto.ApiResponse;
import com.careerconnect.backend.common.dto.PageResponse;
import com.careerconnect.backend.dto.request.ApplyJobRequest;
import com.careerconnect.backend.dto.response.ApplicationResponse;
import com.careerconnect.backend.service.ApplicationService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/candidate")
@RequiredArgsConstructor
public class CandidateApplicationController {

	private final ApplicationService applicationService;

	@PostMapping("/jobs/{jobId}/apply")
	public ResponseEntity<ApiResponse<ApplicationResponse>> applyForJob(
			@PathVariable Long jobId,
			@Valid @RequestBody ApplyJobRequest request
	) {
		return ResponseEntity.status(HttpStatus.CREATED)
				.body(ApiResponse.success("Application submitted", applicationService.applyForJob(jobId, request)));
	}

	@GetMapping("/applications")
	public ResponseEntity<ApiResponse<PageResponse<ApplicationResponse>>> getMyApplications(
			@PageableDefault(size = 10, sort = "appliedAt", direction = Sort.Direction.DESC) Pageable pageable
	) {
		return ResponseEntity.ok(ApiResponse.success(applicationService.getMyApplications(pageable)));
	}

	@GetMapping("/applications/{applicationId}")
	public ResponseEntity<ApiResponse<ApplicationResponse>> getMyApplication(@PathVariable Long applicationId) {
		return ResponseEntity.ok(ApiResponse.success(applicationService.getMyApplication(applicationId)));
	}
}
