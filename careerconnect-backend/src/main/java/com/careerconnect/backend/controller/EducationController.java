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
import com.careerconnect.backend.dto.request.EducationRequest;
import com.careerconnect.backend.dto.response.EducationResponse;
import com.careerconnect.backend.service.CandidateProfileService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/candidate/educations")
@RequiredArgsConstructor
public class EducationController {

	private final CandidateProfileService candidateProfileService;

	@PostMapping
	public ResponseEntity<ApiResponse<EducationResponse>> addEducation(@Valid @RequestBody EducationRequest request) {
		return ResponseEntity.status(HttpStatus.CREATED)
				.body(ApiResponse.success("Education added", candidateProfileService.addEducation(request)));
	}

	@GetMapping
	public ResponseEntity<ApiResponse<List<EducationResponse>>> getEducations() {
		return ResponseEntity.ok(ApiResponse.success(candidateProfileService.getEducations()));
	}

	@PutMapping("/{educationId}")
	public ResponseEntity<ApiResponse<EducationResponse>> updateEducation(
			@PathVariable Long educationId,
			@Valid @RequestBody EducationRequest request
	) {
		return ResponseEntity.ok(ApiResponse.success("Education updated", candidateProfileService.updateEducation(educationId, request)));
	}

	@DeleteMapping("/{educationId}")
	public ResponseEntity<ApiResponse<Void>> deleteEducation(@PathVariable Long educationId) {
		candidateProfileService.deleteEducation(educationId);
		return ResponseEntity.ok(ApiResponse.success("Education deleted", null));
	}
}
