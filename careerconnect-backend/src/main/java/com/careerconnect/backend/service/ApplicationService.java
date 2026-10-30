package com.careerconnect.backend.service;

import java.util.Comparator;
import java.util.List;
import java.util.Set;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.careerconnect.backend.common.dto.PageResponse;
import com.careerconnect.backend.common.enums.ApplicationStatus;
import com.careerconnect.backend.common.enums.JobStatus;
import com.careerconnect.backend.common.enums.Role;
import com.careerconnect.backend.dto.request.ApplyJobRequest;
import com.careerconnect.backend.dto.request.UpdateApplicationStatusRequest;
import com.careerconnect.backend.dto.response.ApplicationResponse;
import com.careerconnect.backend.dto.response.ApplicationStatusHistoryResponse;
import com.careerconnect.backend.dto.response.CandidateProfileResponse;
import com.careerconnect.backend.dto.response.EducationResponse;
import com.careerconnect.backend.dto.response.ExperienceResponse;
import com.careerconnect.backend.dto.response.JobCompanyResponse;
import com.careerconnect.backend.dto.response.JobSummaryResponse;
import com.careerconnect.backend.dto.response.RecruiterApplicationResponse;
import com.careerconnect.backend.dto.response.SkillResponse;
import com.careerconnect.backend.entity.Application;
import com.careerconnect.backend.entity.ApplicationStatusHistory;
import com.careerconnect.backend.entity.CandidateProfile;
import com.careerconnect.backend.entity.Company;
import com.careerconnect.backend.entity.Job;
import com.careerconnect.backend.entity.Skill;
import com.careerconnect.backend.entity.User;
import com.careerconnect.backend.exception.BadRequestException;
import com.careerconnect.backend.exception.DuplicateResourceException;
import com.careerconnect.backend.exception.ResourceNotFoundException;
import com.careerconnect.backend.exception.UnauthorizedActionException;
import com.careerconnect.backend.repository.ApplicationRepository;
import com.careerconnect.backend.repository.ApplicationStatusHistoryRepository;
import com.careerconnect.backend.repository.CandidateProfileRepository;
import com.careerconnect.backend.repository.JobRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ApplicationService {

	private final CurrentUserService currentUserService;
	private final CandidateProfileRepository candidateProfileRepository;
	private final JobRepository jobRepository;
	private final ApplicationRepository applicationRepository;
	private final ApplicationStatusHistoryRepository applicationStatusHistoryRepository;

	@Transactional
	public ApplicationResponse applyForJob(Long jobId, ApplyJobRequest request) {
		User candidate = getCurrentCandidate();
		requireCandidateProfile(candidate);
		Job job = jobRepository.findById(jobId)
				.orElseThrow(() -> new ResourceNotFoundException("Job not found"));
		if (job.getStatus() != JobStatus.OPEN) {
			throw new BadRequestException("Applications are allowed only for open jobs");
		}
		if (applicationRepository.existsByJobIdAndCandidateId(jobId, candidate.getId())) {
			throw new DuplicateResourceException("You have already applied for this job");
		}

		Application application = new Application();
		application.setJob(job);
		application.setCandidate(candidate);
		application.setCoverLetter(request.getCoverLetter());
		application.setStatus(ApplicationStatus.APPLIED);
		try {
			Application savedApplication = applicationRepository.saveAndFlush(application);
			createStatusHistory(savedApplication, ApplicationStatus.APPLIED);
			return toCandidateResponse(savedApplication);
		} catch (DataIntegrityViolationException exception) {
			throw new DuplicateResourceException("You have already applied for this job");
		}
	}

	@Transactional(readOnly = true)
	public PageResponse<ApplicationResponse> getMyApplications(Pageable pageable) {
		User candidate = getCurrentCandidate();
		requireCandidateProfile(candidate);
		return toCandidatePage(applicationRepository.findByCandidateId(candidate.getId(), pageable));
	}

	@Transactional(readOnly = true)
	public ApplicationResponse getMyApplication(Long applicationId) {
		User candidate = getCurrentCandidate();
		requireCandidateProfile(candidate);
		Application application = applicationRepository.findByIdAndCandidateId(applicationId, candidate.getId())
				.orElseThrow(() -> new ResourceNotFoundException("Application not found"));
		return toCandidateResponse(application);
	}

	@Transactional(readOnly = true)
	public PageResponse<RecruiterApplicationResponse> getApplicationsForMyJob(Long jobId, Pageable pageable) {
		getOwnedJob(jobId);
		return toRecruiterPage(applicationRepository.findByJobId(jobId, pageable));
	}

	@Transactional(readOnly = true)
	public RecruiterApplicationResponse getRecruiterApplication(Long applicationId) {
		User recruiter = getCurrentRecruiter();
		Application application = applicationRepository.findByIdAndJobCompanyRecruiterProfileUserId(applicationId, recruiter.getId())
				.orElseThrow(() -> new ResourceNotFoundException("Application not found"));
		return toRecruiterResponse(application);
	}

	@Transactional
	public RecruiterApplicationResponse updateApplicationStatus(Long applicationId, UpdateApplicationStatusRequest request) {
		User recruiter = getCurrentRecruiter();
		Application application = applicationRepository.findByIdAndJobCompanyRecruiterProfileUserId(applicationId, recruiter.getId())
				.orElseThrow(() -> new ResourceNotFoundException("Application not found"));
		ApplicationStatus requestedStatus = request.getStatus();
		if (application.getStatus() == requestedStatus) {
			return toRecruiterResponse(application);
		}
		validateTransition(application.getStatus(), requestedStatus);
		application.setStatus(requestedStatus);
		Application updatedApplication = applicationRepository.save(application);
		createStatusHistory(updatedApplication, requestedStatus);
		return toRecruiterResponse(updatedApplication);
	}

	private void createStatusHistory(Application application, ApplicationStatus status) {
		ApplicationStatusHistory history = new ApplicationStatusHistory();
		history.setApplication(application);
		history.setStatus(status);
		applicationStatusHistoryRepository.save(history);
		application.getStatusHistory().add(history);
	}

	private void validateTransition(ApplicationStatus current, ApplicationStatus requested) {
		boolean allowed = switch (current) {
			case APPLIED -> requested == ApplicationStatus.UNDER_REVIEW || requested == ApplicationStatus.REJECTED;
			case UNDER_REVIEW -> requested == ApplicationStatus.SHORTLISTED || requested == ApplicationStatus.REJECTED;
			case SHORTLISTED -> requested == ApplicationStatus.INTERVIEW_SCHEDULED
					|| requested == ApplicationStatus.SELECTED || requested == ApplicationStatus.REJECTED;
			case INTERVIEW_SCHEDULED -> requested == ApplicationStatus.SELECTED || requested == ApplicationStatus.REJECTED;
			case SELECTED, REJECTED, WITHDRAWN -> false;
		};
		if (!allowed) {
			throw new BadRequestException("Invalid application status transition");
		}
	}

	private Job getOwnedJob(Long jobId) {
		User recruiter = getCurrentRecruiter();
		return jobRepository.findByIdAndCompanyRecruiterProfileUserId(jobId, recruiter.getId())
				.orElseThrow(() -> new ResourceNotFoundException("Job not found"));
	}

	private User getCurrentCandidate() {
		User user = currentUserService.getCurrentUser();
		if (user.getRole() != Role.CANDIDATE) {
			throw new UnauthorizedActionException("Only candidates can manage applications");
		}
		return user;
	}

	private User getCurrentRecruiter() {
		User user = currentUserService.getCurrentUser();
		if (user.getRole() != Role.RECRUITER) {
			throw new UnauthorizedActionException("Only recruiters can manage applications");
		}
		return user;
	}

	private CandidateProfile requireCandidateProfile(User candidate) {
		return candidateProfileRepository.findByUserId(candidate.getId())
				.orElseThrow(() -> new ResourceNotFoundException("Candidate profile not found"));
	}

	private PageResponse<ApplicationResponse> toCandidatePage(Page<Application> applications) {
		return PageResponse.from(applications.map(this::toCandidateResponse));
	}

	private PageResponse<RecruiterApplicationResponse> toRecruiterPage(Page<Application> applications) {
		return PageResponse.from(applications.map(this::toRecruiterResponse));
	}

	private ApplicationResponse toCandidateResponse(Application application) {
		return new ApplicationResponse(
				application.getId(), toJobSummary(application.getJob()), application.getStatus(), application.getCoverLetter(),
				application.getAppliedAt(), application.getUpdatedAt(), toHistoryResponses(application)
		);
	}

	private RecruiterApplicationResponse toRecruiterResponse(Application application) {
		CandidateProfile candidateProfile = requireCandidateProfile(application.getCandidate());
		return new RecruiterApplicationResponse(
				application.getId(), toJobSummary(application.getJob()), toCandidateProfileResponse(candidateProfile),
				application.getStatus(), application.getCoverLetter(), application.getAppliedAt(), application.getUpdatedAt(),
				toHistoryResponses(application)
		);
	}

	private JobSummaryResponse toJobSummary(Job job) {
		Company company = job.getCompany();
		return new JobSummaryResponse(
				job.getId(), job.getTitle(), new JobCompanyResponse(company.getId(), company.getName(), company.getWebsite(),
						company.getLocation(), company.getIndustry()), job.getLocation(), job.getJobType(), job.getEmploymentType(),
				job.getStatus(), job.getApplicationDeadline()
		);
	}

	private List<ApplicationStatusHistoryResponse> toHistoryResponses(Application application) {
		return application.getStatusHistory().stream()
				.sorted(Comparator.comparing(ApplicationStatusHistory::getChangedAt, Comparator.nullsLast(Comparator.naturalOrder())))
				.map(history -> new ApplicationStatusHistoryResponse(history.getStatus(), history.getChangedAt()))
				.toList();
	}

	private CandidateProfileResponse toCandidateProfileResponse(CandidateProfile profile) {
		List<EducationResponse> educations = profile.getEducations().stream()
				.sorted(Comparator.comparing(education -> education.getId(), Comparator.nullsLast(Comparator.naturalOrder())))
				.map(education -> new EducationResponse(education.getId(), education.getInstitution(), education.getDegree(),
						education.getFieldOfStudy(), education.getStartDate(), education.getEndDate(), education.getCurrentlyStudying()))
				.toList();
		List<ExperienceResponse> experiences = profile.getExperiences().stream()
				.sorted(Comparator.comparing(experience -> experience.getId(), Comparator.nullsLast(Comparator.naturalOrder())))
				.map(experience -> new ExperienceResponse(experience.getId(), experience.getCompanyName(), experience.getJobTitle(),
						experience.getDescription(), experience.getStartDate(), experience.getEndDate(), experience.getCurrentlyWorking()))
				.toList();
		List<SkillResponse> skills = profile.getSkills().stream()
				.sorted(Comparator.comparing(Skill::getName, String.CASE_INSENSITIVE_ORDER))
				.map(skill -> new SkillResponse(skill.getId(), skill.getName()))
				.toList();
		return new CandidateProfileResponse(profile.getId(), profile.getFullName(), profile.getPhone(), profile.getResumeUrl(),
				educations, experiences, skills);
	}
}
