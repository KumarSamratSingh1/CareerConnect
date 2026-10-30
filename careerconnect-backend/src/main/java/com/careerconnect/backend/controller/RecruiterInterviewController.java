package com.careerconnect.backend.controller;

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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.careerconnect.backend.common.dto.ApiResponse;
import com.careerconnect.backend.common.dto.PageResponse;
import com.careerconnect.backend.common.enums.InterviewMode;
import com.careerconnect.backend.common.enums.InterviewStatus;
import com.careerconnect.backend.dto.request.ScheduleInterviewRequest;
import com.careerconnect.backend.dto.request.UpdateInterviewRequest;
import com.careerconnect.backend.dto.request.UpdateInterviewStatusRequest;
import com.careerconnect.backend.dto.response.InterviewResponse;
import com.careerconnect.backend.service.InterviewService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/recruiter")
@RequiredArgsConstructor
public class RecruiterInterviewController {

	private final InterviewService interviewService;

	@PostMapping("/applications/{applicationId}/interviews")
	public ResponseEntity<ApiResponse<InterviewResponse>> scheduleInterview(
			@PathVariable Long applicationId,
			@Valid @RequestBody ScheduleInterviewRequest request
	) {
		return ResponseEntity.status(HttpStatus.CREATED)
				.body(ApiResponse.success("Interview scheduled", interviewService.scheduleInterview(applicationId, request)));
	}

	@GetMapping("/interviews")
	public ResponseEntity<ApiResponse<PageResponse<InterviewResponse>>> getInterviews(
			@RequestParam(required = false) InterviewStatus status,
			@RequestParam(required = false) InterviewMode mode,
			@RequestParam(required = false) Long jobId,
			@PageableDefault(size = 10, sort = "scheduledDateTime", direction = Sort.Direction.ASC) Pageable pageable
	) {
		return ResponseEntity.ok(ApiResponse.success(interviewService.getRecruiterInterviews(status, mode, jobId, pageable)));
	}

	@GetMapping("/interviews/{interviewId}")
	public ResponseEntity<ApiResponse<InterviewResponse>> getInterview(@PathVariable Long interviewId) {
		return ResponseEntity.ok(ApiResponse.success(interviewService.getRecruiterInterview(interviewId)));
	}

	@PutMapping("/interviews/{interviewId}")
	public ResponseEntity<ApiResponse<InterviewResponse>> updateInterview(
			@PathVariable Long interviewId,
			@Valid @RequestBody UpdateInterviewRequest request
	) {
		return ResponseEntity.ok(ApiResponse.success("Interview updated", interviewService.updateInterview(interviewId, request)));
	}

	@PatchMapping("/interviews/{interviewId}/status")
	public ResponseEntity<ApiResponse<InterviewResponse>> updateInterviewStatus(
			@PathVariable Long interviewId,
			@Valid @RequestBody UpdateInterviewStatusRequest request
	) {
		return ResponseEntity.ok(ApiResponse.success(
				"Interview status updated", interviewService.updateInterviewStatus(interviewId, request)
		));
	}
}
