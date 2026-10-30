package com.careerconnect.backend.controller;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.careerconnect.backend.common.dto.ApiResponse;
import com.careerconnect.backend.common.dto.PageResponse;
import com.careerconnect.backend.dto.request.UpdateApplicationStatusRequest;
import com.careerconnect.backend.dto.response.RecruiterApplicationResponse;
import com.careerconnect.backend.service.ApplicationService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/recruiter")
@RequiredArgsConstructor
public class RecruiterApplicationController {

	private final ApplicationService applicationService;

	@GetMapping("/jobs/{jobId}/applications")
	public ResponseEntity<ApiResponse<PageResponse<RecruiterApplicationResponse>>> getJobApplications(
			@PathVariable Long jobId,
			@PageableDefault(size = 10, sort = "appliedAt", direction = Sort.Direction.DESC) Pageable pageable
	) {
		return ResponseEntity.ok(ApiResponse.success(applicationService.getApplicationsForMyJob(jobId, pageable)));
	}

	@GetMapping("/applications/{applicationId}")
	public ResponseEntity<ApiResponse<RecruiterApplicationResponse>> getApplication(@PathVariable Long applicationId) {
		return ResponseEntity.ok(ApiResponse.success(applicationService.getRecruiterApplication(applicationId)));
	}

	@PatchMapping("/applications/{applicationId}/status")
	public ResponseEntity<ApiResponse<RecruiterApplicationResponse>> updateApplicationStatus(
			@PathVariable Long applicationId,
			@Valid @RequestBody UpdateApplicationStatusRequest request
	) {
		return ResponseEntity.ok(ApiResponse.success(
				"Application status updated", applicationService.updateApplicationStatus(applicationId, request)
		));
	}
}
