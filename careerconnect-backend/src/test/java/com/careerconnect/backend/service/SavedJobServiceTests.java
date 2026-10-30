package com.careerconnect.backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import com.careerconnect.backend.common.enums.JobStatus;
import com.careerconnect.backend.common.enums.Role;
import com.careerconnect.backend.entity.CandidateProfile;
import com.careerconnect.backend.entity.Company;
import com.careerconnect.backend.entity.Job;
import com.careerconnect.backend.entity.SavedJob;
import com.careerconnect.backend.entity.User;
import com.careerconnect.backend.exception.DuplicateResourceException;
import com.careerconnect.backend.repository.CandidateProfileRepository;
import com.careerconnect.backend.repository.JobRepository;
import com.careerconnect.backend.repository.SavedJobRepository;

class SavedJobServiceTests {

	private CurrentUserService currentUserService;
	private CandidateProfileRepository candidateProfileRepository;
	private JobRepository jobRepository;
	private SavedJobRepository savedJobRepository;
	private SavedJobService service;

	@BeforeEach
	void setUp() {
		currentUserService = Mockito.mock(CurrentUserService.class);
		candidateProfileRepository = Mockito.mock(CandidateProfileRepository.class);
		jobRepository = Mockito.mock(JobRepository.class);
		savedJobRepository = Mockito.mock(SavedJobRepository.class);
		service = new SavedJobService(currentUserService, candidateProfileRepository, jobRepository, savedJobRepository);
	}

	@Test
	void candidateCanSaveOpenJob() {
		prepareCandidate();
		when(jobRepository.findById(10L)).thenReturn(Optional.of(job()));
		when(savedJobRepository.existsByCandidateIdAndJobId(1L, 10L)).thenReturn(false);
		when(savedJobRepository.saveAndFlush(any(SavedJob.class))).thenAnswer(invocation -> {
			SavedJob savedJob = invocation.getArgument(0);
			savedJob.setId(20L);
			return savedJob;
		});

		var response = service.saveJob(10L);

		assertEquals(20L, response.id());
		assertEquals(10L, response.job().id());
	}

	@Test
	void candidateCannotSaveSameJobTwice() {
		prepareCandidate();
		when(jobRepository.findById(10L)).thenReturn(Optional.of(job()));
		when(savedJobRepository.existsByCandidateIdAndJobId(1L, 10L)).thenReturn(true);

		assertThrows(DuplicateResourceException.class, () -> service.saveJob(10L));
	}

	@Test
	void candidateCanRemoveOwnSavedJob() {
		prepareCandidate();
		SavedJob savedJob = new SavedJob();
		savedJob.setId(20L);
		when(savedJobRepository.findByCandidateIdAndJobId(1L, 10L)).thenReturn(Optional.of(savedJob));

		service.removeSavedJob(10L);

		verify(savedJobRepository).delete(savedJob);
	}

	private void prepareCandidate() {
		User candidate = new User();
		candidate.setId(1L);
		candidate.setRole(Role.CANDIDATE);
		CandidateProfile profile = new CandidateProfile();
		profile.setUser(candidate);
		when(currentUserService.getCurrentUser()).thenReturn(candidate);
		when(candidateProfileRepository.findByUserId(1L)).thenReturn(Optional.of(profile));
	}

	private Job job() {
		Company company = new Company();
		company.setId(1L);
		company.setName("Acme");
		Job job = new Job();
		job.setId(10L);
		job.setTitle("Developer");
		job.setCompany(company);
		job.setStatus(JobStatus.OPEN);
		return job;
	}
}
