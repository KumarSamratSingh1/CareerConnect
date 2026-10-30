package com.careerconnect.backend.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.careerconnect.backend.common.dto.PageResponse;
import com.careerconnect.backend.common.enums.ApplicationStatus;
import com.careerconnect.backend.common.enums.InterviewMode;
import com.careerconnect.backend.common.enums.InterviewStatus;
import com.careerconnect.backend.common.enums.Role;
import com.careerconnect.backend.dto.request.ScheduleInterviewRequest;
import com.careerconnect.backend.dto.request.UpdateInterviewRequest;
import com.careerconnect.backend.dto.request.UpdateInterviewStatusRequest;
import com.careerconnect.backend.dto.response.InterviewResponse;
import com.careerconnect.backend.dto.response.JobCompanyResponse;
import com.careerconnect.backend.dto.response.JobSummaryResponse;
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

import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class InterviewService {

	private final CurrentUserService currentUserService;
	private final ApplicationRepository applicationRepository;
	private final ApplicationStatusHistoryRepository applicationStatusHistoryRepository;
	private final InterviewRepository interviewRepository;

	@Transactional
	public InterviewResponse scheduleInterview(Long applicationId, ScheduleInterviewRequest request) {
		User recruiter = getCurrentRecruiter();
		Application application = applicationRepository.findByIdAndJobCompanyRecruiterProfileUserId(applicationId, recruiter.getId())
				.orElseThrow(() -> new ResourceNotFoundException("Application not found"));
		if (application.getStatus() != ApplicationStatus.SHORTLISTED
				&& application.getStatus() != ApplicationStatus.INTERVIEW_SCHEDULED) {
			throw new BadRequestException("Interviews can be scheduled only for shortlisted applications");
		}
		validateSchedule(request.getScheduledDateTime(), request.getInterviewMode(), request.getMeetingLink(), request.getLocation());
		if (interviewRepository.existsByApplicationIdAndScheduledDateTimeAndStatus(
				applicationId, request.getScheduledDateTime(), InterviewStatus.SCHEDULED)) {
			throw new DuplicateResourceException("An active interview is already scheduled at this time");
		}

		Interview interview = new Interview();
		interview.setApplication(application);
		interview.setStatus(InterviewStatus.SCHEDULED);
		applySchedule(interview, request.getScheduledDateTime(), request.getInterviewMode(), request.getMeetingLink(),
				request.getLocation(), request.getNotes());
		Interview savedInterview = interviewRepository.save(interview);
		markApplicationInterviewScheduled(application);
		return toResponse(savedInterview);
	}

	@Transactional(readOnly = true)
	public PageResponse<InterviewResponse> getRecruiterInterviews(
			InterviewStatus status, InterviewMode mode, Long jobId, Pageable pageable
	) {
		User recruiter = getCurrentRecruiter();
		Specification<Interview> specification = recruiterInterviewSpecification(recruiter.getId(), status, mode, jobId);
		return toPageResponse(interviewRepository.findAll(specification, pageable));
	}

	@Transactional(readOnly = true)
	public InterviewResponse getRecruiterInterview(Long interviewId) {
		User recruiter = getCurrentRecruiter();
		Interview interview = interviewRepository.findByIdAndApplicationJobCompanyRecruiterProfileUserId(interviewId, recruiter.getId())
				.orElseThrow(() -> new ResourceNotFoundException("Interview not found"));
		return toResponse(interview);
	}

	@Transactional(readOnly = true)
	public PageResponse<InterviewResponse> getCandidateInterviews(Pageable pageable) {
		User candidate = getCurrentCandidate();
		return toPageResponse(interviewRepository.findByApplicationCandidateId(candidate.getId(), pageable));
	}

	@Transactional(readOnly = true)
	public InterviewResponse getCandidateInterview(Long interviewId) {
		User candidate = getCurrentCandidate();
		Interview interview = interviewRepository.findByIdAndApplicationCandidateId(interviewId, candidate.getId())
				.orElseThrow(() -> new ResourceNotFoundException("Interview not found"));
		return toResponse(interview);
	}

	@Transactional
	public InterviewResponse updateInterview(Long interviewId, UpdateInterviewRequest request) {
		Interview interview = getOwnedInterview(interviewId);
		if (interview.getStatus() != InterviewStatus.SCHEDULED) {
			throw new BadRequestException("Only scheduled interviews can be updated");
		}
		validateSchedule(request.getScheduledDateTime(), request.getInterviewMode(), request.getMeetingLink(), request.getLocation());
		if (interviewRepository.existsByApplicationIdAndScheduledDateTimeAndStatusAndIdNot(
				interview.getApplication().getId(), request.getScheduledDateTime(), InterviewStatus.SCHEDULED, interviewId)) {
			throw new DuplicateResourceException("An active interview is already scheduled at this time");
		}
		applySchedule(interview, request.getScheduledDateTime(), request.getInterviewMode(), request.getMeetingLink(),
				request.getLocation(), request.getNotes());
		return toResponse(interviewRepository.save(interview));
	}

	@Transactional
	public InterviewResponse updateInterviewStatus(Long interviewId, UpdateInterviewStatusRequest request) {
		Interview interview = getOwnedInterview(interviewId);
		if (interview.getStatus() == request.getStatus()) {
			return toResponse(interview);
		}
		if (interview.getStatus() != InterviewStatus.SCHEDULED
				|| (request.getStatus() != InterviewStatus.COMPLETED && request.getStatus() != InterviewStatus.CANCELLED)) {
			throw new BadRequestException("Invalid interview status transition");
		}
		interview.setStatus(request.getStatus());
		return toResponse(interviewRepository.save(interview));
	}

	private Interview getOwnedInterview(Long interviewId) {
		User recruiter = getCurrentRecruiter();
		return interviewRepository.findByIdAndApplicationJobCompanyRecruiterProfileUserId(interviewId, recruiter.getId())
				.orElseThrow(() -> new ResourceNotFoundException("Interview not found"));
	}

	private void validateSchedule(LocalDateTime scheduledDateTime, InterviewMode mode, String meetingLink, String location) {
		if (scheduledDateTime == null || !scheduledDateTime.isAfter(LocalDateTime.now())) {
			throw new BadRequestException("scheduledDateTime must be in the future");
		}
		if (mode == null) {
			throw new BadRequestException("interviewMode is required");
		}
		if (mode == InterviewMode.PHONE) {
			return;
		}
		if (mode == InterviewMode.ONLINE && (meetingLink == null || meetingLink.isBlank())) {
			throw new BadRequestException("meetingLink is required for online interviews");
		}
		if (mode == InterviewMode.OFFLINE && (location == null || location.isBlank())) {
			throw new BadRequestException("location is required for offline interviews");
		}
	}

	private void applySchedule(
			Interview interview, LocalDateTime scheduledDateTime, InterviewMode mode, String meetingLink, String location, String notes
	) {
		interview.setScheduledDateTime(scheduledDateTime);
		interview.setInterviewMode(mode);
		interview.setMeetingLink(mode == InterviewMode.ONLINE ? meetingLink.trim() : null);
		interview.setLocation(mode == InterviewMode.OFFLINE ? location.trim() : null);
		interview.setNotes(notes);
	}

	private void markApplicationInterviewScheduled(Application application) {
		if (application.getStatus() == ApplicationStatus.INTERVIEW_SCHEDULED) {
			return;
		}
		application.setStatus(ApplicationStatus.INTERVIEW_SCHEDULED);
		applicationRepository.save(application);
		ApplicationStatusHistory history = new ApplicationStatusHistory();
		history.setApplication(application);
		history.setStatus(ApplicationStatus.INTERVIEW_SCHEDULED);
		applicationStatusHistoryRepository.save(history);
		application.getStatusHistory().add(history);
	}

	private User getCurrentRecruiter() {
		User user = currentUserService.getCurrentUser();
		if (user.getRole() != Role.RECRUITER) {
			throw new UnauthorizedActionException("Only recruiters can manage interviews");
		}
		return user;
	}

	private User getCurrentCandidate() {
		User user = currentUserService.getCurrentUser();
		if (user.getRole() != Role.CANDIDATE) {
			throw new UnauthorizedActionException("Only candidates can view interviews");
		}
		return user;
	}

	private Specification<Interview> recruiterInterviewSpecification(
			Long recruiterId, InterviewStatus status, InterviewMode mode, Long jobId
	) {
		return (root, query, criteriaBuilder) -> {
			List<Predicate> predicates = new ArrayList<>();
			predicates.add(criteriaBuilder.equal(
					root.get("application").get("job").get("company").get("recruiterProfile").get("user").get("id"), recruiterId
			));
			if (status != null) {
				predicates.add(criteriaBuilder.equal(root.get("status"), status));
			}
			if (mode != null) {
				predicates.add(criteriaBuilder.equal(root.get("interviewMode"), mode));
			}
			if (jobId != null) {
				predicates.add(criteriaBuilder.equal(root.get("application").get("job").get("id"), jobId));
			}
			return criteriaBuilder.and(predicates.toArray(Predicate[]::new));
		};
	}

	private PageResponse<InterviewResponse> toPageResponse(Page<Interview> interviews) {
		return PageResponse.from(interviews.map(this::toResponse));
	}

	private InterviewResponse toResponse(Interview interview) {
		Job job = interview.getApplication().getJob();
		Company company = job.getCompany();
		JobSummaryResponse jobResponse = new JobSummaryResponse(
				job.getId(), job.getTitle(), new JobCompanyResponse(company.getId(), company.getName(), company.getWebsite(),
						company.getLocation(), company.getIndustry()), job.getLocation(), job.getJobType(), job.getEmploymentType(),
				job.getStatus(), job.getApplicationDeadline()
		);
		return new InterviewResponse(interview.getId(), jobResponse, interview.getScheduledDateTime(), interview.getInterviewMode(),
				interview.getMeetingLink(), interview.getLocation(), interview.getStatus(), interview.getNotes(),
				interview.getCreatedAt(), interview.getUpdatedAt());
	}
}
