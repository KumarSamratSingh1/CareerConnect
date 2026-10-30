package com.careerconnect.backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import com.careerconnect.backend.common.enums.EmploymentType;
import com.careerconnect.backend.common.enums.JobStatus;
import com.careerconnect.backend.common.enums.JobType;
import com.careerconnect.backend.common.enums.Role;
import com.careerconnect.backend.dto.request.CreateJobRequest;
import com.careerconnect.backend.dto.request.UpdateJobRequest;
import com.careerconnect.backend.dto.response.JobResponse;
import com.careerconnect.backend.entity.Company;
import com.careerconnect.backend.entity.Job;
import com.careerconnect.backend.entity.RecruiterProfile;
import com.careerconnect.backend.entity.Skill;
import com.careerconnect.backend.entity.User;
import com.careerconnect.backend.exception.BadRequestException;
import com.careerconnect.backend.exception.ResourceNotFoundException;
import com.careerconnect.backend.repository.JobRepository;
import com.careerconnect.backend.repository.RecruiterProfileRepository;
import com.careerconnect.backend.repository.SkillRepository;

class JobServiceTests {

	private CurrentUserService currentUserService;
	private RecruiterProfileRepository recruiterProfileRepository;
	private JobRepository jobRepository;
	private SkillRepository skillRepository;
	private JobService service;

	@BeforeEach
	void setUp() {
		currentUserService = Mockito.mock(CurrentUserService.class);
		recruiterProfileRepository = Mockito.mock(RecruiterProfileRepository.class);
		jobRepository = Mockito.mock(JobRepository.class);
		skillRepository = Mockito.mock(SkillRepository.class);
		service = new JobService(currentUserService, recruiterProfileRepository, jobRepository, skillRepository);
	}

	@Test
	void recruiterWithoutProfileCannotCreateJob() {
		when(currentUserService.getCurrentUser()).thenReturn(recruiter(1L));
		when(recruiterProfileRepository.findByUserId(1L)).thenReturn(Optional.empty());

		assertThrows(ResourceNotFoundException.class, () -> service.createJob(jobRequest(JobType.JOB)));
		verify(jobRepository, never()).save(any());
	}

	@Test
	void recruiterWithoutCompanyCannotCreateJob() {
		when(currentUserService.getCurrentUser()).thenReturn(recruiter(1L));
		when(recruiterProfileRepository.findByUserId(1L)).thenReturn(Optional.of(profileWithoutCompany(1L)));

		assertThrows(ResourceNotFoundException.class, () -> service.createJob(jobRequest(JobType.JOB)));
		verify(jobRepository, never()).save(any());
	}

	@Test
	void recruiterCanCreateJob() {
		prepareRecruiterWithCompany();
		when(jobRepository.save(any(Job.class))).thenAnswer(invocation -> {
			Job job = invocation.getArgument(0);
			job.setId(10L);
			return job;
		});

		JobResponse response = service.createJob(jobRequest(JobType.JOB));

		assertEquals(JobStatus.OPEN, response.status());
		assertNull(response.duration());
	}

	@Test
	void recruiterCanCreateInternshipWithDuration() {
		prepareRecruiterWithCompany();
		when(jobRepository.save(any(Job.class))).thenAnswer(invocation -> invocation.getArgument(0));
		CreateJobRequest request = jobRequest(JobType.INTERNSHIP);
		request.setDuration("6 months");

		JobResponse response = service.createJob(request);

		assertEquals("6 months", response.duration());
	}

	@Test
	void internshipWithoutDurationIsRejected() {
		prepareRecruiterWithCompany();

		assertThrows(BadRequestException.class, () -> service.createJob(jobRequest(JobType.INTERNSHIP)));
	}

	@Test
	void jobDurationIsIgnored() {
		prepareRecruiterWithCompany();
		when(jobRepository.save(any(Job.class))).thenAnswer(invocation -> invocation.getArgument(0));
		CreateJobRequest request = jobRequest(JobType.JOB);
		request.setDuration("6 months");

		JobResponse response = service.createJob(request);

		assertNull(response.duration());
	}

	@Test
	void anotherRecruiterCannotUpdateOrCloseJob() {
		when(currentUserService.getCurrentUser()).thenReturn(recruiter(2L), recruiter(2L));
		when(jobRepository.findByIdAndCompanyRecruiterProfileUserId(99L, 2L)).thenReturn(Optional.empty());

		assertThrows(ResourceNotFoundException.class, () -> service.updateMyJob(99L, updateRequest()));
		assertThrows(ResourceNotFoundException.class, () -> service.closeMyJob(99L));
	}

	@Test
	void requiredSkillsUseOneCanonicalSharedSkillAndPreventDuplicates() {
		prepareRecruiterWithCompany();
		Skill java = new Skill();
		java.setId(5L);
		java.setName("java");
		when(skillRepository.findByName("java")).thenReturn(Optional.empty());
		when(skillRepository.saveAndFlush(any(Skill.class))).thenReturn(java);
		when(jobRepository.save(any(Job.class))).thenAnswer(invocation -> invocation.getArgument(0));
		CreateJobRequest request = jobRequest(JobType.JOB);
		request.setRequiredSkills(List.of("Java", "JAVA", " java "));

		JobResponse response = service.createJob(request);

		assertEquals(1, response.requiredSkills().size());
		assertEquals("java", response.requiredSkills().getFirst().name());
		verify(skillRepository).findByName("java");
		verify(skillRepository).saveAndFlush(any(Skill.class));
	}

	@Test
	void publicListingUsesRepositoryQueryForOpenJobs() {
		Pageable pageable = PageRequest.of(0, 10);
		Job openJob = job(10L, JobStatus.OPEN);
		when(jobRepository.findAll(any(Specification.class), eq(pageable)))
				.thenReturn(new PageImpl<>(List.of(openJob), pageable, 1));

		var response = service.getPublicJobs("java", "Delhi", JobType.JOB, EmploymentType.FULL_TIME, pageable);

		assertEquals(1, response.content().size());
		assertEquals(JobStatus.OPEN, response.content().getFirst().status());
		verify(jobRepository).findAll(any(Specification.class), eq(pageable));
	}

	@Test
	void publicAccessDoesNotExposeClosedJobDetails() {
		when(jobRepository.findByIdAndStatus(10L, JobStatus.OPEN)).thenReturn(Optional.empty());

		assertThrows(ResourceNotFoundException.class, () -> service.getPublicJob(10L));
	}

	@Test
	void invalidSalaryRangeIsRejected() {
		prepareRecruiterWithCompany();
		CreateJobRequest request = jobRequest(JobType.JOB);
		request.setMinSalary(100000);
		request.setMaxSalary(50000);

		assertThrows(BadRequestException.class, () -> service.createJob(request));
	}

	@Test
	void pastApplicationDeadlineIsRejected() {
		prepareRecruiterWithCompany();
		CreateJobRequest request = jobRequest(JobType.JOB);
		request.setApplicationDeadline(LocalDate.now().minusDays(1));

		assertThrows(BadRequestException.class, () -> service.createJob(request));
	}

	private void prepareRecruiterWithCompany() {
		when(currentUserService.getCurrentUser()).thenReturn(recruiter(1L));
		when(recruiterProfileRepository.findByUserId(1L)).thenReturn(Optional.of(profileWithCompany(1L)));
	}

	private User recruiter(Long id) {
		User user = new User();
		user.setId(id);
		user.setRole(Role.RECRUITER);
		return user;
	}

	private RecruiterProfile profileWithoutCompany(Long userId) {
		RecruiterProfile profile = new RecruiterProfile();
		profile.setId(userId * 10);
		profile.setUser(recruiter(userId));
		return profile;
	}

	private RecruiterProfile profileWithCompany(Long userId) {
		RecruiterProfile profile = profileWithoutCompany(userId);
		profile.setCompany(company());
		return profile;
	}

	private Company company() {
		Company company = new Company();
		company.setId(1L);
		company.setName("Acme");
		company.setLocation("Delhi");
		company.setIndustry("Technology");
		return company;
	}

	private Job job(Long id, JobStatus status) {
		Job job = new Job();
		job.setId(id);
		job.setTitle("Java Developer");
		job.setDescription("Spring Boot position");
		job.setLocation("Delhi");
		job.setJobType(JobType.JOB);
		job.setEmploymentType(EmploymentType.FULL_TIME);
		job.setStatus(status);
		job.setCompany(company());
		return job;
	}

	private CreateJobRequest jobRequest(JobType jobType) {
		CreateJobRequest request = new CreateJobRequest();
		request.setTitle("Java Developer");
		request.setDescription("Spring Boot position");
		request.setLocation("Delhi");
		request.setJobType(jobType);
		request.setEmploymentType(jobType == JobType.INTERNSHIP ? EmploymentType.INTERNSHIP : EmploymentType.FULL_TIME);
		return request;
	}

	private UpdateJobRequest updateRequest() {
		UpdateJobRequest request = new UpdateJobRequest();
		request.setTitle("Updated Java Developer");
		request.setDescription("Updated description");
		request.setLocation("Delhi");
		request.setJobType(JobType.JOB);
		request.setEmploymentType(EmploymentType.FULL_TIME);
		return request;
	}
}
