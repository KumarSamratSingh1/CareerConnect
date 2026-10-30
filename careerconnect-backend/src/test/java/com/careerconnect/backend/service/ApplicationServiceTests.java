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

import com.careerconnect.backend.common.enums.ApplicationStatus;
import com.careerconnect.backend.common.enums.JobStatus;
import com.careerconnect.backend.common.enums.Role;
import com.careerconnect.backend.dto.request.ApplyJobRequest;
import com.careerconnect.backend.dto.request.UpdateApplicationStatusRequest;
import com.careerconnect.backend.dto.response.ApplicationResponse;
import com.careerconnect.backend.entity.Application;
import com.careerconnect.backend.entity.ApplicationStatusHistory;
import com.careerconnect.backend.entity.CandidateProfile;
import com.careerconnect.backend.entity.Company;
import com.careerconnect.backend.entity.Job;
import com.careerconnect.backend.entity.User;
import com.careerconnect.backend.exception.BadRequestException;
import com.careerconnect.backend.exception.DuplicateResourceException;
import com.careerconnect.backend.exception.ResourceNotFoundException;
import com.careerconnect.backend.repository.ApplicationRepository;
import com.careerconnect.backend.repository.ApplicationStatusHistoryRepository;
import com.careerconnect.backend.repository.CandidateProfileRepository;
import com.careerconnect.backend.repository.JobRepository;

class ApplicationServiceTests {

	private CurrentUserService currentUserService;
	private CandidateProfileRepository candidateProfileRepository;
	private JobRepository jobRepository;
	private ApplicationRepository applicationRepository;
	private ApplicationStatusHistoryRepository historyRepository;
	private ApplicationService service;

	@BeforeEach
	void setUp() {
		currentUserService = Mockito.mock(CurrentUserService.class);
		candidateProfileRepository = Mockito.mock(CandidateProfileRepository.class);
		jobRepository = Mockito.mock(JobRepository.class);
		applicationRepository = Mockito.mock(ApplicationRepository.class);
		historyRepository = Mockito.mock(ApplicationStatusHistoryRepository.class);
		service = new ApplicationService(currentUserService, candidateProfileRepository, jobRepository, applicationRepository, historyRepository);
	}

	@Test
	void candidateWithoutProfileCannotApply() {
		when(currentUserService.getCurrentUser()).thenReturn(candidate(1L));
		when(candidateProfileRepository.findByUserId(1L)).thenReturn(Optional.empty());

		assertThrows(ResourceNotFoundException.class, () -> service.applyForJob(10L, applyRequest()));
		verify(applicationRepository, never()).saveAndFlush(any());
	}

	@Test
	void candidateCanApplyToOpenJobAndInitialHistoryIsCreated() {
		prepareCandidateWithProfile();
		Job job = job(JobStatus.OPEN);
		when(jobRepository.findById(10L)).thenReturn(Optional.of(job));
		when(applicationRepository.existsByJobIdAndCandidateId(10L, 1L)).thenReturn(false);
		when(applicationRepository.saveAndFlush(any(Application.class))).thenAnswer(invocation -> {
			Application application = invocation.getArgument(0);
			application.setId(20L);
			return application;
		});

		ApplicationResponse response = service.applyForJob(10L, applyRequest());

		assertEquals(ApplicationStatus.APPLIED, response.status());
		assertEquals(1, response.statusHistory().size());
		assertEquals(ApplicationStatus.APPLIED, response.statusHistory().getFirst().status());
		verify(historyRepository).save(any(ApplicationStatusHistory.class));
	}

	@Test
	void candidateCannotApplyToClosedJob() {
		prepareCandidateWithProfile();
		when(jobRepository.findById(10L)).thenReturn(Optional.of(job(JobStatus.CLOSED)));

		assertThrows(BadRequestException.class, () -> service.applyForJob(10L, applyRequest()));
	}

	@Test
	void candidateCannotApplyTwiceToSameJob() {
		prepareCandidateWithProfile();
		when(jobRepository.findById(10L)).thenReturn(Optional.of(job(JobStatus.OPEN)));
		when(applicationRepository.existsByJobIdAndCandidateId(10L, 1L)).thenReturn(true);

		assertThrows(DuplicateResourceException.class, () -> service.applyForJob(10L, applyRequest()));
	}

	@Test
	void anotherCandidateCannotAccessApplication() {
		when(currentUserService.getCurrentUser()).thenReturn(candidate(2L));
		when(candidateProfileRepository.findByUserId(2L)).thenReturn(Optional.of(profile(2L)));
		when(applicationRepository.findByIdAndCandidateId(20L, 2L)).thenReturn(Optional.empty());

		assertThrows(ResourceNotFoundException.class, () -> service.getMyApplication(20L));
	}

	@Test
	void anotherRecruiterCannotViewApplicationsForAnotherRecruitersJob() {
		when(currentUserService.getCurrentUser()).thenReturn(recruiter(2L));
		when(jobRepository.findByIdAndCompanyRecruiterProfileUserId(10L, 2L)).thenReturn(Optional.empty());

		assertThrows(ResourceNotFoundException.class, () -> service.getApplicationsForMyJob(10L, org.springframework.data.domain.PageRequest.of(0, 10)));
	}

	@Test
	void recruiterCanUpdateOwnApplicationStatusAndHistoryIsCreated() {
		Application application = application(candidate(1L), ApplicationStatus.APPLIED);
		when(currentUserService.getCurrentUser()).thenReturn(recruiter(5L));
		when(applicationRepository.findByIdAndJobCompanyRecruiterProfileUserId(20L, 5L)).thenReturn(Optional.of(application));
		when(applicationRepository.save(application)).thenReturn(application);
		when(candidateProfileRepository.findByUserId(1L)).thenReturn(Optional.of(profile(1L)));
		UpdateApplicationStatusRequest request = new UpdateApplicationStatusRequest();
		request.setStatus(ApplicationStatus.UNDER_REVIEW);

		var response = service.updateApplicationStatus(20L, request);

		assertEquals(ApplicationStatus.UNDER_REVIEW, response.status());
		assertEquals(1, response.statusHistory().size());
		verify(historyRepository).save(any(ApplicationStatusHistory.class));
	}

	@Test
	void terminalStatusTransitionIsRejected() {
		Application application = application(candidate(1L), ApplicationStatus.REJECTED);
		when(currentUserService.getCurrentUser()).thenReturn(recruiter(5L));
		when(applicationRepository.findByIdAndJobCompanyRecruiterProfileUserId(20L, 5L)).thenReturn(Optional.of(application));
		UpdateApplicationStatusRequest request = new UpdateApplicationStatusRequest();
		request.setStatus(ApplicationStatus.UNDER_REVIEW);

		assertThrows(BadRequestException.class, () -> service.updateApplicationStatus(20L, request));
	}

	private void prepareCandidateWithProfile() {
		when(currentUserService.getCurrentUser()).thenReturn(candidate(1L));
		when(candidateProfileRepository.findByUserId(1L)).thenReturn(Optional.of(profile(1L)));
	}

	private User candidate(Long id) {
		User user = new User();
		user.setId(id);
		user.setRole(Role.CANDIDATE);
		return user;
	}

	private User recruiter(Long id) {
		User user = new User();
		user.setId(id);
		user.setRole(Role.RECRUITER);
		return user;
	}

	private CandidateProfile profile(Long userId) {
		CandidateProfile profile = new CandidateProfile();
		profile.setId(userId * 10);
		profile.setUser(candidate(userId));
		profile.setFullName("Candidate");
		return profile;
	}

	private Job job(JobStatus status) {
		Company company = new Company();
		company.setId(1L);
		company.setName("Acme");
		Job job = new Job();
		job.setId(10L);
		job.setTitle("Developer");
		job.setCompany(company);
		job.setStatus(status);
		return job;
	}

	private Application application(User candidate, ApplicationStatus status) {
		Application application = new Application();
		application.setId(20L);
		application.setCandidate(candidate);
		application.setJob(job(JobStatus.OPEN));
		application.setStatus(status);
		return application;
	}

	private ApplyJobRequest applyRequest() {
		ApplyJobRequest request = new ApplyJobRequest();
		request.setCoverLetter("I am interested in this role.");
		return request;
	}
}
