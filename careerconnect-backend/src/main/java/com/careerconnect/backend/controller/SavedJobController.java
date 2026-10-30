package com.careerconnect.backend.controller;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.careerconnect.backend.common.dto.ApiResponse;
import com.careerconnect.backend.common.dto.PageResponse;
import com.careerconnect.backend.dto.response.SavedJobResponse;
import com.careerconnect.backend.service.SavedJobService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/candidate")
@RequiredArgsConstructor
public class SavedJobController {

	private final SavedJobService savedJobService;

	@PostMapping({"/jobs/{jobId}/save", "/saved-jobs/{jobId}"})
	public ResponseEntity<ApiResponse<SavedJobResponse>> saveJob(@PathVariable Long jobId) {
		return ResponseEntity.status(HttpStatus.CREATED)
				.body(ApiResponse.success("Job saved", savedJobService.saveJob(jobId)));
	}

	@GetMapping({"/jobs/saved", "/saved-jobs"})
	public ResponseEntity<ApiResponse<PageResponse<SavedJobResponse>>> getMySavedJobs(
			@PageableDefault(size = 10, sort = "savedAt", direction = Sort.Direction.DESC) Pageable pageable
	) {
		return ResponseEntity.ok(ApiResponse.success(savedJobService.getMySavedJobs(pageable)));
	}

	@DeleteMapping({"/jobs/{jobId}/save", "/saved-jobs/{jobId}"})
	public ResponseEntity<ApiResponse<Void>> removeSavedJob(@PathVariable Long jobId) {
		savedJobService.removeSavedJob(jobId);
		return ResponseEntity.ok(ApiResponse.success("Saved job removed", null));
	}
}
