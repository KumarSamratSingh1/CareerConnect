package com.careerconnect.backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import java.time.LocalDateTime;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import com.careerconnect.backend.common.enums.ApplicationStatus;
import com.careerconnect.backend.common.enums.InterviewMode;
import com.careerconnect.backend.common.enums.InterviewStatus;
import com.careerconnect.backend.common.enums.JobStatus;
import com.careerconnect.backend.common.enums.Role;
import com.careerconnect.backend.dto.request.ScheduleInterviewRequest;
import com.careerconnect.backend.dto.request.UpdateInterviewRequest;
import com.careerconnect.backend.dto.request.UpdateInterviewStatusRequest;
import com.careerconnect.backend.entity.Application;
import com.careerconnect.backend.entity.ApplicationStatusHistory;
import com.careerconnect.backend.entity.Company;
import com.careerconnect.backend.entity.Interview;
import com.careerconnect.backend.entity.Job;
import com.careerconnect.backend.entity.User;
import com.careerconnect.backend.exception.BadRequestException;
import com.careerconnect.backend.exception.DuplicateResourceException;
import com.careerconnect.backend.exception.ResourceNotFoundException;
import com.careerconnect.backend.exception.UnauthorizedActionException;
import com.careerconnect.backend.repository.ApplicationRepository;
import com.careerconnect.backend.repository.ApplicationStatusHistoryRepository;
import com.careerconnect.backend.repository.InterviewRepository;

class InterviewServiceTests {

	private CurrentUserService currentUserService;
	private ApplicationRepository applicationRepository;
	private ApplicationStatusHistoryRepository applicationStatusHistoryRepository;
	private InterviewRepository interviewRepository;
	private InterviewService service;

	@BeforeEach
	void setUp() {
		currentUserService = Mockito.mock(CurrentUserService.class);
		applicationRepository = Mockito.mock(ApplicationRepository.class);
		applicationStatusHistoryRepository = Mockito.mock(ApplicationStatusHistoryRepository.class);
		interviewRepository = Mockito.mock(InterviewRepository.class);
		service = new InterviewService(currentUserService, applicationRepository, applicationStatusHistoryRepository, interviewRepository);
	}

	@Test
	void recruiterCanScheduleOnlineInterviewForShortlistedApplication() {
		Application application = application(ApplicationStatus.SHORTLISTED);
		when(currentUserService.getCurrentUser()).thenReturn(recruiter(1L));
		when(applicationRepository.findByIdAndJobCompanyRecruiterProfileUserId(10L, 1L))
				.thenReturn(Optional.of(application));
		when(interviewRepository.existsByApplicationIdAndScheduledDateTimeAndStatus(any(), any(), any())).thenReturn(false);
		when(interviewRepository.save(any(Interview.class))).thenAnswer(invocation -> invocation.getArgument(0));

		var response = service.scheduleInterview(10L, onlineRequest());

		assertEquals(InterviewStatus.SCHEDULED, response.status());
		assertEquals(InterviewMode.ONLINE, response.interviewMode());
		assertEquals(ApplicationStatus.INTERVIEW_SCHEDULED, application.getStatus());
		assertEquals(1, application.getStatusHistory().size());
		assertEquals(ApplicationStatus.INTERVIEW_SCHEDULED, application.getStatusHistory().getFirst().getStatus());
		verify(applicationRepository).save(application);
		verify(applicationStatusHistoryRepository).save(any(ApplicationStatusHistory.class));
	}

	@Test
	void schedulingAnotherInterviewPreservesInterviewScheduledStatusWithoutAddingHistory() {
		Application application = application(ApplicationStatus.INTERVIEW_SCHEDULED);
		when(currentUserService.getCurrentUser()).thenReturn(recruiter(1L));
		when(applicationRepository.findByIdAndJobCompanyRecruiterProfileUserId(10L, 1L)).thenReturn(Optional.of(application));
		when(interviewRepository.existsByApplicationIdAndScheduledDateTimeAndStatus(any(), any(), any())).thenReturn(false);
		when(interviewRepository.save(any(Interview.class))).thenAnswer(invocation -> invocation.getArgument(0));

		service.scheduleInterview(10L, onlineRequest());

		assertEquals(ApplicationStatus.INTERVIEW_SCHEDULED, application.getStatus());
		assertEquals(0, application.getStatusHistory().size());
		verify(applicationRepository, never()).save(any(Application.class));
		verify(applicationStatusHistoryRepository, never()).save(any(ApplicationStatusHistory.class));
	}

	@Test
	void recruiterCannotScheduleForNonShortlistedApplication() {
		when(currentUserService.getCurrentUser()).thenReturn(recruiter(1L));
		when(applicationRepository.findByIdAndJobCompanyRecruiterProfileUserId(10L, 1L))
				.thenReturn(Optional.of(application(ApplicationStatus.UNDER_REVIEW)));

		assertThrows(BadRequestException.class, () -> service.scheduleInterview(10L, onlineRequest()));
	}

	@Test
	void recruiterCannotScheduleForAnotherRecruitersApplication() {
		when(currentUserService.getCurrentUser()).thenReturn(recruiter(2L));
		when(applicationRepository.findByIdAndJobCompanyRecruiterProfileUserId(10L, 2L)).thenReturn(Optional.empty());

		assertThrows(ResourceNotFoundException.class, () -> service.scheduleInterview(10L, onlineRequest()));
	}

	@Test
	void candidateCannotScheduleInterview() {
		when(currentUserService.getCurrentUser()).thenReturn(candidate(1L));

		assertThrows(UnauthorizedActionException.class, () -> service.scheduleInterview(10L, onlineRequest()));
	}

	@Test
	void invalidScheduleAndModeDetailsAreRejected() {
		when(currentUserService.getCurrentUser()).thenReturn(recruiter(1L));
		when(applicationRepository.findByIdAndJobCompanyRecruiterProfileUserId(10L, 1L))
				.thenReturn(Optional.of(application(ApplicationStatus.SHORTLISTED)));
		ScheduleInterviewRequest past = onlineRequest();
		past.setScheduledDateTime(LocalDateTime.now().minusMinutes(1));
		ScheduleInterviewRequest missingLink = onlineRequest();
		missingLink.setMeetingLink(null);
		ScheduleInterviewRequest missingLocation = onlineRequest();
		missingLocation.setInterviewMode(InterviewMode.OFFLINE);
		missingLocation.setMeetingLink(null);

		assertThrows(BadRequestException.class, () -> service.scheduleInterview(10L, past));
		assertThrows(BadRequestException.class, () -> service.scheduleInterview(10L, missingLink));
		assertThrows(BadRequestException.class, () -> service.scheduleInterview(10L, missingLocation));
	}

	@Test
	void candidateCanViewOwnInterviewButAnotherCandidateCannot() {
		Interview interview = interview(InterviewStatus.SCHEDULED);
		when(currentUserService.getCurrentUser()).thenReturn(candidate(1L), candidate(2L));
		when(interviewRepository.findByIdAndApplicationCandidateId(5L, 1L)).thenReturn(Optional.of(interview));
		when(interviewRepository.findByIdAndApplicationCandidateId(5L, 2L)).thenReturn(Optional.empty());

		assertEquals(5L, service.getCandidateInterview(5L).id());
		assertThrows(ResourceNotFoundException.class, () -> service.getCandidateInterview(5L));
	}

	@Test
	void recruiterCanUpdateOwnInterviewButAnotherRecruiterCannot() {
		Interview interview = interview(InterviewStatus.SCHEDULED);
		when(currentUserService.getCurrentUser()).thenReturn(recruiter(1L), recruiter(2L));
		when(interviewRepository.findByIdAndApplicationJobCompanyRecruiterProfileUserId(5L, 1L)).thenReturn(Optional.of(interview));
		when(interviewRepository.findByIdAndApplicationJobCompanyRecruiterProfileUserId(5L, 2L)).thenReturn(Optional.empty());
		when(interviewRepository.save(interview)).thenReturn(interview);
		UpdateInterviewRequest update = new UpdateInterviewRequest();
		update.setScheduledDateTime(LocalDateTime.now().plusDays(3));
		update.setInterviewMode(InterviewMode.OFFLINE);
		update.setLocation("Office");

		assertEquals(InterviewMode.OFFLINE, service.updateInterview(5L, update).interviewMode());
		assertThrows(ResourceNotFoundException.class, () -> service.updateInterview(5L, update));
	}

	@Test
	void reschedulingRejectsConflictsWithAnotherActiveInterview() {
		Interview interview = interview(InterviewStatus.SCHEDULED);
		when(currentUserService.getCurrentUser()).thenReturn(recruiter(1L));
		when(interviewRepository.findByIdAndApplicationJobCompanyRecruiterProfileUserId(5L, 1L)).thenReturn(Optional.of(interview));
		when(interviewRepository.existsByApplicationIdAndScheduledDateTimeAndStatusAndIdNot(any(), any(), any(), any()))
				.thenReturn(true);

		assertThrows(DuplicateResourceException.class, () -> service.updateInterview(5L, updateRequest()));
	}

	@Test
	void reschedulingExcludesTheCurrentInterviewFromConflictCheck() {
		Interview interview = interview(InterviewStatus.SCHEDULED);
		when(currentUserService.getCurrentUser()).thenReturn(recruiter(1L));
		when(interviewRepository.findByIdAndApplicationJobCompanyRecruiterProfileUserId(5L, 1L)).thenReturn(Optional.of(interview));
		when(interviewRepository.existsByApplicationIdAndScheduledDateTimeAndStatusAndIdNot(
				10L, interview.getScheduledDateTime(), InterviewStatus.SCHEDULED, 5L)).thenReturn(false);
		when(interviewRepository.save(interview)).thenReturn(interview);
		UpdateInterviewRequest update = new UpdateInterviewRequest();
		update.setScheduledDateTime(interview.getScheduledDateTime());
		update.setInterviewMode(InterviewMode.ONLINE);
		update.setMeetingLink("https://meet.example.com/room");

		service.updateInterview(5L, update);

		verify(interviewRepository).existsByApplicationIdAndScheduledDateTimeAndStatusAndIdNot(
				10L, interview.getScheduledDateTime(), InterviewStatus.SCHEDULED, 5L);
	}

	@Test
	void phoneInterviewDoesNotRequireOrRetainMeetingLinkOrLocation() {
		Application application = application(ApplicationStatus.SHORTLISTED);
		when(currentUserService.getCurrentUser()).thenReturn(recruiter(1L));
		when(applicationRepository.findByIdAndJobCompanyRecruiterProfileUserId(10L, 1L)).thenReturn(Optional.of(application));
		when(interviewRepository.existsByApplicationIdAndScheduledDateTimeAndStatus(any(), any(), any())).thenReturn(false);
		when(interviewRepository.save(any(Interview.class))).thenAnswer(invocation -> invocation.getArgument(0));
		ScheduleInterviewRequest request = new ScheduleInterviewRequest();
		request.setScheduledDateTime(LocalDateTime.now().plusDays(2));
		request.setInterviewMode(InterviewMode.PHONE);
		request.setMeetingLink("https://ignored.example.com");
		request.setLocation("Ignored office");

		var response = service.scheduleInterview(10L, request);

		assertNull(response.meetingLink());
		assertNull(response.location());
	}

	@Test
	void phoneRescheduleClearsExistingMeetingLinkAndLocation() {
		Interview interview = interview(InterviewStatus.SCHEDULED);
		interview.setLocation("Old office");
		when(currentUserService.getCurrentUser()).thenReturn(recruiter(1L));
		when(interviewRepository.findByIdAndApplicationJobCompanyRecruiterProfileUserId(5L, 1L)).thenReturn(Optional.of(interview));
		when(interviewRepository.save(interview)).thenReturn(interview);
		UpdateInterviewRequest update = new UpdateInterviewRequest();
		update.setScheduledDateTime(LocalDateTime.now().plusDays(3));
		update.setInterviewMode(InterviewMode.PHONE);
		update.setMeetingLink("https://ignored.example.com");
		update.setLocation("Ignored office");

		var response = service.updateInterview(5L, update);

		assertEquals(InterviewMode.PHONE, response.interviewMode());
		assertNull(response.meetingLink());
		assertNull(response.location());
	}

	@Test
	void invalidInterviewStatusTransitionIsRejected() {
		Interview interview = interview(InterviewStatus.COMPLETED);
		when(currentUserService.getCurrentUser()).thenReturn(recruiter(1L));
		when(interviewRepository.findByIdAndApplicationJobCompanyRecruiterProfileUserId(5L, 1L)).thenReturn(Optional.of(interview));
		UpdateInterviewStatusRequest request = new UpdateInterviewStatusRequest();
		request.setStatus(InterviewStatus.SCHEDULED);

		assertThrows(BadRequestException.class, () -> service.updateInterviewStatus(5L, request));
	}

	private User recruiter(Long id) {
		User user = new User();
		user.setId(id);
		user.setRole(Role.RECRUITER);
		return user;
	}

	private User candidate(Long id) {
		User user = new User();
		user.setId(id);
		user.setRole(Role.CANDIDATE);
		return user;
	}

	private Application application(ApplicationStatus status) {
		Application application = new Application();
		application.setId(10L);
		application.setStatus(status);
		application.setCandidate(candidate(1L));
		application.setJob(job());
		return application;
	}

	private Interview interview(InterviewStatus status) {
		Interview interview = new Interview();
		interview.setId(5L);
		interview.setApplication(application(ApplicationStatus.SHORTLISTED));
		interview.setScheduledDateTime(LocalDateTime.now().plusDays(2));
		interview.setInterviewMode(InterviewMode.ONLINE);
		interview.setMeetingLink("https://meet.example.com/room");
		interview.setStatus(status);
		return interview;
	}

	private Job job() {
		Company company = new Company();
		company.setId(1L);
		company.setName("Acme");
		Job job = new Job();
		job.setId(2L);
		job.setTitle("Developer");
		job.setCompany(company);
		job.setStatus(JobStatus.OPEN);
		return job;
	}

	private ScheduleInterviewRequest onlineRequest() {
		ScheduleInterviewRequest request = new ScheduleInterviewRequest();
		request.setScheduledDateTime(LocalDateTime.now().plusDays(2));
		request.setInterviewMode(InterviewMode.ONLINE);
		request.setMeetingLink("https://meet.example.com/room");
		return request;
	}

	private UpdateInterviewRequest updateRequest() {
		UpdateInterviewRequest request = new UpdateInterviewRequest();
		request.setScheduledDateTime(LocalDateTime.now().plusDays(3));
		request.setInterviewMode(InterviewMode.ONLINE);
		request.setMeetingLink("https://meet.example.com/updated-room");
		return request;
	}
}
