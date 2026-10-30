package com.careerconnect.backend.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.careerconnect.backend.common.dto.ApiResponse;
import com.careerconnect.backend.dto.request.RecruiterProfileRequest;
import com.careerconnect.backend.dto.response.RecruiterProfileResponse;
import com.careerconnect.backend.service.RecruiterProfileService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/recruiter/profile")
@RequiredArgsConstructor
public class RecruiterProfileController {

	private final RecruiterProfileService recruiterProfileService;

	@PostMapping
	public ResponseEntity<ApiResponse<RecruiterProfileResponse>> createProfile(@Valid @RequestBody RecruiterProfileRequest request) {
		return ResponseEntity.status(HttpStatus.CREATED)
				.body(ApiResponse.success("Recruiter profile created", recruiterProfileService.createProfile(request)));
	}

	@GetMapping
	public ResponseEntity<ApiResponse<RecruiterProfileResponse>> getProfile() {
		return ResponseEntity.ok(ApiResponse.success(recruiterProfileService.getProfile()));
	}

	@PutMapping
	public ResponseEntity<ApiResponse<RecruiterProfileResponse>> updateProfile(@Valid @RequestBody RecruiterProfileRequest request) {
		return ResponseEntity.ok(ApiResponse.success("Recruiter profile updated", recruiterProfileService.updateProfile(request)));
	}
}
