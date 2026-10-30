package com.careerconnect.backend.controller;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.careerconnect.backend.common.dto.ApiResponse;
import com.careerconnect.backend.common.dto.PageResponse;
import com.careerconnect.backend.dto.response.InterviewResponse;
import com.careerconnect.backend.service.InterviewService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/candidate/interviews")
@RequiredArgsConstructor
public class CandidateInterviewController {

	private final InterviewService interviewService;

	@GetMapping
	public ResponseEntity<ApiResponse<PageResponse<InterviewResponse>>> getMyInterviews(
			@PageableDefault(size = 10, sort = "scheduledDateTime", direction = Sort.Direction.ASC) Pageable pageable
	) {
		return ResponseEntity.ok(ApiResponse.success(interviewService.getCandidateInterviews(pageable)));
	}

	@GetMapping("/{interviewId}")
	public ResponseEntity<ApiResponse<InterviewResponse>> getMyInterview(@PathVariable Long interviewId) {
		return ResponseEntity.ok(ApiResponse.success(interviewService.getCandidateInterview(interviewId)));
	}
}
