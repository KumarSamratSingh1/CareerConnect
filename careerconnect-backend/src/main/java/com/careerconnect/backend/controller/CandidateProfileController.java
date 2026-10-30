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
import com.careerconnect.backend.dto.request.CandidateProfileRequest;
import com.careerconnect.backend.dto.response.CandidateProfileResponse;
import com.careerconnect.backend.service.CandidateProfileService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/candidate/profile")
@RequiredArgsConstructor
public class CandidateProfileController {

	private final CandidateProfileService candidateProfileService;

	@PostMapping
	public ResponseEntity<ApiResponse<CandidateProfileResponse>> createProfile(@Valid @RequestBody CandidateProfileRequest request) {
		return ResponseEntity.status(HttpStatus.CREATED)
				.body(ApiResponse.success("Candidate profile created", candidateProfileService.createProfile(request)));
	}

	@GetMapping
	public ResponseEntity<ApiResponse<CandidateProfileResponse>> getProfile() {
		return ResponseEntity.ok(ApiResponse.success(candidateProfileService.getProfile()));
	}

	@PutMapping
	public ResponseEntity<ApiResponse<CandidateProfileResponse>> updateProfile(@Valid @RequestBody CandidateProfileRequest request) {
		return ResponseEntity.ok(ApiResponse.success("Candidate profile updated", candidateProfileService.updateProfile(request)));
	}
}
