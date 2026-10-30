package com.careerconnect.backend.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.careerconnect.backend.common.dto.ApiResponse;
import com.careerconnect.backend.dto.request.ExperienceRequest;
import com.careerconnect.backend.dto.response.ExperienceResponse;
import com.careerconnect.backend.service.CandidateProfileService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/candidate/experiences")
@RequiredArgsConstructor
public class ExperienceController {

	private final CandidateProfileService candidateProfileService;

	@PostMapping
	public ResponseEntity<ApiResponse<ExperienceResponse>> addExperience(@Valid @RequestBody ExperienceRequest request) {
		return ResponseEntity.status(HttpStatus.CREATED)
				.body(ApiResponse.success("Experience added", candidateProfileService.addExperience(request)));
	}

	@GetMapping
	public ResponseEntity<ApiResponse<List<ExperienceResponse>>> getExperiences() {
		return ResponseEntity.ok(ApiResponse.success(candidateProfileService.getExperiences()));
	}

	@PutMapping("/{experienceId}")
	public ResponseEntity<ApiResponse<ExperienceResponse>> updateExperience(
			@PathVariable Long experienceId,
			@Valid @RequestBody ExperienceRequest request
	) {
		return ResponseEntity.ok(ApiResponse.success("Experience updated", candidateProfileService.updateExperience(experienceId, request)));
	}

	@DeleteMapping("/{experienceId}")
	public ResponseEntity<ApiResponse<Void>> deleteExperience(@PathVariable Long experienceId) {
		candidateProfileService.deleteExperience(experienceId);
		return ResponseEntity.ok(ApiResponse.success("Experience deleted", null));
	}
}
