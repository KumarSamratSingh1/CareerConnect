package com.careerconnect.backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import com.careerconnect.backend.common.enums.ApplicationStatus;
import com.careerconnect.backend.common.enums.InterviewStatus;
import com.careerconnect.backend.common.enums.JobStatus;
import com.careerconnect.backend.common.enums.JobType;
import com.careerconnect.backend.common.enums.Role;
import com.careerconnect.backend.dto.request.UpdateCompanyVerificationRequest;
import com.careerconnect.backend.dto.request.UpdateUserEnabledRequest;
import com.careerconnect.backend.entity.Company;
import com.careerconnect.backend.entity.Job;
import com.careerconnect.backend.entity.User;
import com.careerconnect.backend.exception.BadRequestException;
import com.careerconnect.backend.repository.ApplicationRepository;
import com.careerconnect.backend.repository.CompanyRepository;
import com.careerconnect.backend.repository.InterviewRepository;
import com.careerconnect.backend.repository.JobRepository;
import com.careerconnect.backend.repository.UserRepository;

class AdminServiceTests {
	private CurrentUserService currentUserService;
	private UserRepository userRepository;
	private CompanyRepository companyRepository;
	private JobRepository jobRepository;
	private ApplicationRepository applicationRepository;
	private InterviewRepository interviewRepository;
	private AdminService service;

	@BeforeEach
	void setUp() {
		currentUserService = Mockito.mock(CurrentUserService.class);
		userRepository = Mockito.mock(UserRepository.class);
		companyRepository = Mockito.mock(CompanyRepository.class);
		jobRepository = Mockito.mock(JobRepository.class);
		applicationRepository = Mockito.mock(ApplicationRepository.class);
		interviewRepository = Mockito.mock(InterviewRepository.class);
		service = new AdminService(currentUserService, userRepository, companyRepository, jobRepository, applicationRepository, interviewRepository);
		when(currentUserService.getCurrentUser()).thenReturn(admin(1L));
	}

	@Test
	void adminCanEnableOrDisableAnotherUser() {
		User user = user(2L, Role.CANDIDATE, true);
		when(userRepository.findById(2L)).thenReturn(Optional.of(user));
		when(userRepository.save(user)).thenReturn(user);
		UpdateUserEnabledRequest request = new UpdateUserEnabledRequest();
		request.setEnabled(false);

		var response = service.updateUserEnabled(2L, request);

		assertEquals(false, response.enabled());
		verify(userRepository).save(user);
	}

	@Test
	void adminCannotDisableThemselves() {
		when(userRepository.findById(1L)).thenReturn(Optional.of(admin(1L)));
		UpdateUserEnabledRequest request = new UpdateUserEnabledRequest();
		request.setEnabled(false);

		assertThrows(BadRequestException.class, () -> service.updateUserEnabled(1L, request));
	}

	@Test
	void adminUsersSupportsFilteredPageQueries() {
		when(userRepository.findAll(
				Mockito.<org.springframework.data.jpa.domain.Specification<User>>any(), any(org.springframework.data.domain.Pageable.class)
		)).thenReturn(new PageImpl<>(java.util.List.of(user(2L, Role.CANDIDATE, true))));

		var result = service.getUsers(Role.CANDIDATE, true, "candidate", PageRequest.of(0, 10));

		assertEquals(1, result.totalElements());
		assertEquals(Role.CANDIDATE, result.content().getFirst().role());
	}

	@Test
	void adminCanVerifyCompany() {
		Company company = new Company();
		company.setId(3L);
		company.setName("Acme");
		company.setVerified(false);
		when(companyRepository.findById(3L)).thenReturn(Optional.of(company));
		when(companyRepository.save(company)).thenReturn(company);
		UpdateCompanyVerificationRequest request = new UpdateCompanyVerificationRequest();
		request.setVerified(true);

		assertEquals(true, service.updateCompanyVerification(3L, request).verified());
	}

	@Test
	void adminCanCloseAnyJobAndClosingClosedJobIsIdempotent() {
		Job open = job(JobStatus.OPEN);
		when(jobRepository.findById(4L)).thenReturn(Optional.of(open));
		when(jobRepository.save(open)).thenReturn(open);
		assertEquals(JobStatus.CLOSED, service.closeJob(4L).status());
		verify(jobRepository).save(open);

		Job closed = job(JobStatus.CLOSED);
		when(jobRepository.findById(5L)).thenReturn(Optional.of(closed));
		assertEquals(JobStatus.CLOSED, service.closeJob(5L).status());
		verify(jobRepository, never()).save(closed);
	}

	@Test
	void dashboardUsesRepositoryCounts() {
		when(userRepository.count()).thenReturn(10L);
		when(userRepository.countByRole(Role.CANDIDATE)).thenReturn(5L);
		when(userRepository.countByRole(Role.RECRUITER)).thenReturn(3L);
		when(userRepository.countByRole(Role.ADMIN)).thenReturn(2L);
		when(userRepository.countByEnabled(true)).thenReturn(8L);
		when(userRepository.countByEnabled(false)).thenReturn(2L);
		when(companyRepository.count()).thenReturn(4L);
		when(companyRepository.countByVerified(true)).thenReturn(3L);
		when(companyRepository.countByVerified(false)).thenReturn(1L);
		when(jobRepository.count()).thenReturn(6L);
		when(jobRepository.countByStatus(JobStatus.OPEN)).thenReturn(4L);
		when(jobRepository.countByStatus(JobStatus.CLOSED)).thenReturn(2L);
		when(jobRepository.countByJobType(JobType.INTERNSHIP)).thenReturn(2L);
		when(jobRepository.countByJobType(JobType.JOB)).thenReturn(4L);
		when(applicationRepository.count()).thenReturn(7L);
		when(interviewRepository.count()).thenReturn(3L);

		var response = service.getDashboard();

		assertEquals(10L, response.totalUsers());
		assertEquals(5L, response.totalCandidates());
		assertEquals(7L, response.totalApplications());
		assertEquals(3L, response.totalInterviews());
		assertEquals(0L, response.applicationsByStatus().get(ApplicationStatus.APPLIED));
		assertEquals(0L, response.interviewsByStatus().get(InterviewStatus.SCHEDULED));
	}

	private User admin(Long id) { return user(id, Role.ADMIN, true); }
	private User user(Long id, Role role, boolean enabled) { User user = new User(); user.setId(id); user.setEmail(role.name().toLowerCase() + id + "@example.com"); user.setRole(role); user.setEnabled(enabled); return user; }
	private Job job(JobStatus status) { Company company = new Company(); company.setId(1L); company.setName("Acme"); Job job = new Job(); job.setId(4L); job.setTitle("Developer"); job.setCompany(company); job.setStatus(status); return job; }
}
