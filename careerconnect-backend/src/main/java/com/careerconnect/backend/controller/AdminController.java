package com.careerconnect.backend.controller;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.careerconnect.backend.common.dto.ApiResponse;
import com.careerconnect.backend.common.dto.PageResponse;
import com.careerconnect.backend.common.enums.ApplicationStatus;
import com.careerconnect.backend.common.enums.InterviewMode;
import com.careerconnect.backend.common.enums.InterviewStatus;
import com.careerconnect.backend.common.enums.JobStatus;
import com.careerconnect.backend.common.enums.JobType;
import com.careerconnect.backend.common.enums.Role;
import com.careerconnect.backend.dto.request.UpdateCompanyVerificationRequest;
import com.careerconnect.backend.dto.request.UpdateUserEnabledRequest;
import com.careerconnect.backend.dto.response.AdminApplicationResponse;
import com.careerconnect.backend.dto.response.AdminInterviewResponse;
import com.careerconnect.backend.dto.response.AdminUserResponse;
import com.careerconnect.backend.dto.response.CompanyResponse;
import com.careerconnect.backend.dto.response.DashboardResponse;
import com.careerconnect.backend.dto.response.JobResponse;
import com.careerconnect.backend.service.AdminService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
public class AdminController {
	private final AdminService adminService;

	@GetMapping("/users") public ResponseEntity<ApiResponse<PageResponse<AdminUserResponse>>> users(@RequestParam(required = false) Role role, @RequestParam(required = false) Boolean enabled, @RequestParam(required = false) String keyword, @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) { return ResponseEntity.ok(ApiResponse.success(adminService.getUsers(role, enabled, keyword, pageable))); }
	@GetMapping("/users/{userId}") public ResponseEntity<ApiResponse<AdminUserResponse>> user(@PathVariable Long userId) { return ResponseEntity.ok(ApiResponse.success(adminService.getUser(userId))); }
	@PatchMapping("/users/{userId}/enabled") public ResponseEntity<ApiResponse<AdminUserResponse>> enabled(@PathVariable Long userId, @Valid @RequestBody UpdateUserEnabledRequest request) { return ResponseEntity.ok(ApiResponse.success("User enabled status updated", adminService.updateUserEnabled(userId, request))); }
	@GetMapping("/companies") public ResponseEntity<ApiResponse<PageResponse<CompanyResponse>>> companies(@RequestParam(required = false) Boolean verified, @RequestParam(required = false) String keyword, @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) { return ResponseEntity.ok(ApiResponse.success(adminService.getCompanies(verified, keyword, pageable))); }
	@GetMapping("/companies/{companyId}") public ResponseEntity<ApiResponse<CompanyResponse>> company(@PathVariable Long companyId) { return ResponseEntity.ok(ApiResponse.success(adminService.getCompany(companyId))); }
	@PatchMapping("/companies/{companyId}/verification") public ResponseEntity<ApiResponse<CompanyResponse>> verification(@PathVariable Long companyId, @Valid @RequestBody UpdateCompanyVerificationRequest request) { return ResponseEntity.ok(ApiResponse.success("Company verification updated", adminService.updateCompanyVerification(companyId, request))); }
	@GetMapping("/jobs") public ResponseEntity<ApiResponse<PageResponse<JobResponse>>> jobs(@RequestParam(required = false) JobStatus status, @RequestParam(required = false) JobType jobType, @RequestParam(required = false) String keyword, @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) { return ResponseEntity.ok(ApiResponse.success(adminService.getJobs(status, jobType, keyword, pageable))); }
	@GetMapping("/jobs/{jobId}") public ResponseEntity<ApiResponse<JobResponse>> job(@PathVariable Long jobId) { return ResponseEntity.ok(ApiResponse.success(adminService.getJob(jobId))); }
	@PatchMapping("/jobs/{jobId}/close") public ResponseEntity<ApiResponse<JobResponse>> closeJob(@PathVariable Long jobId) { return ResponseEntity.ok(ApiResponse.success("Job closed", adminService.closeJob(jobId))); }
	@GetMapping("/applications") public ResponseEntity<ApiResponse<PageResponse<AdminApplicationResponse>>> applications(@RequestParam(required = false) ApplicationStatus status, @RequestParam(required = false) Long jobId, @PageableDefault(size = 10, sort = "appliedAt", direction = Sort.Direction.DESC) Pageable pageable) { return ResponseEntity.ok(ApiResponse.success(adminService.getApplications(status, jobId, pageable))); }
	@GetMapping("/applications/{applicationId}") public ResponseEntity<ApiResponse<AdminApplicationResponse>> application(@PathVariable Long applicationId) { return ResponseEntity.ok(ApiResponse.success(adminService.getApplication(applicationId))); }
	@GetMapping("/interviews") public ResponseEntity<ApiResponse<PageResponse<AdminInterviewResponse>>> interviews(@RequestParam(required = false) InterviewStatus status, @RequestParam(required = false) InterviewMode mode, @RequestParam(required = false) Long jobId, @PageableDefault(size = 10, sort = "scheduledDateTime") Pageable pageable) { return ResponseEntity.ok(ApiResponse.success(adminService.getInterviews(status, mode, jobId, pageable))); }
	@GetMapping("/interviews/{interviewId}") public ResponseEntity<ApiResponse<AdminInterviewResponse>> interview(@PathVariable Long interviewId) { return ResponseEntity.ok(ApiResponse.success(adminService.getInterview(interviewId))); }
	@GetMapping("/dashboard") public ResponseEntity<ApiResponse<DashboardResponse>> dashboard() { return ResponseEntity.ok(ApiResponse.success(adminService.getDashboard())); }
}
