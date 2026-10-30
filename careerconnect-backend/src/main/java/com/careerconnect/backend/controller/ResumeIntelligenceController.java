package com.careerconnect.backend.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.careerconnect.backend.common.dto.ApiResponse;
import com.careerconnect.backend.dto.request.resume.ResumeImportRequest;
import com.careerconnect.backend.dto.response.resume.ResumeDraftResponse;
import com.careerconnect.backend.dto.response.resume.ResumeImportResponse;
import com.careerconnect.backend.service.resume.ResumeImportService;
import com.careerconnect.backend.service.resume.ResumeIntelligenceService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/candidate/resume")
@RequiredArgsConstructor
public class ResumeIntelligenceController {

	private final ResumeIntelligenceService resumeIntelligenceService;
	private final ResumeImportService resumeImportService;

	/**
	 * Parses an uploaded PDF or DOCX resume into a structured reviewable draft.
	 * 
	 * @param file uploaded document (PDF or DOCX, max 10MB)
	 * @return standardized ApiResponse containing the extracted ResumeDraftResponse
	 */
	@PostMapping(value = "/parse", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	public ResponseEntity<ApiResponse<ResumeDraftResponse>> parseResume(
			@RequestParam("file") MultipartFile file
	) {
		ResumeDraftResponse response = resumeIntelligenceService.parseResume(file);
		return ResponseEntity.ok(ApiResponse.success("Resume parsed successfully", response));
	}

	/**
	 * Imports candidate-approved and edited sections into candidate profile.
	 * 
	 * @param request candidate approved/edited draft payload
	 * @return standardized ApiResponse with ResumeImportResponse
	 */
	@PostMapping("/import")
	public ResponseEntity<ApiResponse<ResumeImportResponse>> importResume(
			@Valid @RequestBody ResumeImportRequest request
	) {
		ResumeImportResponse response = resumeImportService.importResume(request);
		int totalImported = response.personalDetails().imported()
				+ response.educations().imported()
				+ response.experiences().imported()
				+ response.skills().imported()
				+ response.projects().imported()
				+ response.certifications().imported()
				+ response.socialLinks().imported();

		if (totalImported > 0) {
			return ResponseEntity.ok(ApiResponse.success("Resume imported successfully", response));
		} else {
			return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY)
					.body(ApiResponse.error("No selected records could be imported", response));
		}
	}
}
