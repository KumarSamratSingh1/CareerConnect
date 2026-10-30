package com.careerconnect.backend.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.careerconnect.backend.common.dto.ApiResponse;
import com.careerconnect.backend.dto.request.SkillRequest;
import com.careerconnect.backend.dto.response.SkillResponse;
import com.careerconnect.backend.service.CandidateProfileService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/candidate/skills")
@RequiredArgsConstructor
public class SkillController {

	private final CandidateProfileService candidateProfileService;

	@PostMapping
	public ResponseEntity<ApiResponse<SkillResponse>> addSkill(@Valid @RequestBody SkillRequest request) {
		return ResponseEntity.status(HttpStatus.CREATED)
				.body(ApiResponse.success("Skill added", candidateProfileService.addSkill(request)));
	}

	@GetMapping
	public ResponseEntity<ApiResponse<List<SkillResponse>>> getSkills() {
		return ResponseEntity.ok(ApiResponse.success(candidateProfileService.getSkills()));
	}

	@DeleteMapping("/{skillId}")
	public ResponseEntity<ApiResponse<Void>> removeSkill(@PathVariable Long skillId) {
		candidateProfileService.removeSkill(skillId);
		return ResponseEntity.ok(ApiResponse.success("Skill removed", null));
	}
}
