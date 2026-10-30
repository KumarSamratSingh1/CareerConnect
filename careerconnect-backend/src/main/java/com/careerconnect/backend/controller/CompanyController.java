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
import com.careerconnect.backend.dto.request.CompanyRequest;
import com.careerconnect.backend.dto.response.CompanyResponse;
import com.careerconnect.backend.service.CompanyService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/recruiter/company")
@RequiredArgsConstructor
public class CompanyController {

	private final CompanyService companyService;

	@PostMapping
	public ResponseEntity<ApiResponse<CompanyResponse>> createCompany(@Valid @RequestBody CompanyRequest request) {
		return ResponseEntity.status(HttpStatus.CREATED)
				.body(ApiResponse.success("Company created", companyService.createCompany(request)));
	}

	@GetMapping
	public ResponseEntity<ApiResponse<CompanyResponse>> getMyCompany() {
		return ResponseEntity.ok(ApiResponse.success(companyService.getMyCompany()));
	}

	@PutMapping
	public ResponseEntity<ApiResponse<CompanyResponse>> updateMyCompany(@Valid @RequestBody CompanyRequest request) {
		return ResponseEntity.ok(ApiResponse.success("Company updated", companyService.updateMyCompany(request)));
	}
}
