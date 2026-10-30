package com.careerconnect.backend.service;

import java.util.Comparator;
import java.util.EnumMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
import com.careerconnect.backend.dto.response.ApplicationStatusHistoryResponse;
import com.careerconnect.backend.dto.response.CompanyResponse;
import com.careerconnect.backend.dto.response.DashboardResponse;
import com.careerconnect.backend.dto.response.JobCompanyResponse;
import com.careerconnect.backend.dto.response.JobResponse;
import com.careerconnect.backend.dto.response.JobSummaryResponse;
import com.careerconnect.backend.dto.response.SkillResponse;
import com.careerconnect.backend.entity.Application;
import com.careerconnect.backend.entity.ApplicationStatusHistory;
import com.careerconnect.backend.entity.Company;
import com.careerconnect.backend.entity.Interview;
import com.careerconnect.backend.entity.Job;
import com.careerconnect.backend.entity.Skill;
import com.careerconnect.backend.entity.User;
import com.careerconnect.backend.exception.BadRequestException;
import com.careerconnect.backend.exception.ResourceNotFoundException;
import com.careerconnect.backend.exception.UnauthorizedActionException;
import com.careerconnect.backend.repository.ApplicationRepository;
import com.careerconnect.backend.repository.CompanyRepository;
import com.careerconnect.backend.repository.InterviewRepository;
import com.careerconnect.backend.repository.JobRepository;
import com.careerconnect.backend.repository.UserRepository;

import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AdminService {

	private final CurrentUserService currentUserService;
	private final UserRepository userRepository;
	private final CompanyRepository companyRepository;
	private final JobRepository jobRepository;
	private final ApplicationRepository applicationRepository;
	private final InterviewRepository interviewRepository;

	@Transactional(readOnly = true)
	public PageResponse<AdminUserResponse> getUsers(Role role, Boolean enabled, String keyword, Pageable pageable) {
		requireAdmin();
		return page(userRepository.findAll(userSpecification(role, enabled, keyword), pageable), this::toUserResponse);
	}

	@Transactional(readOnly = true)
	public AdminUserResponse getUser(Long userId) {
		requireAdmin();
		return toUserResponse(userRepository.findById(userId).orElseThrow(() -> new ResourceNotFoundException("User not found")));
	}

	@Transactional
	public AdminUserResponse updateUserEnabled(Long userId, UpdateUserEnabledRequest request) {
		User admin = requireAdmin();
		User user = userRepository.findById(userId).orElseThrow(() -> new ResourceNotFoundException("User not found"));
		if (admin.getId().equals(user.getId()) && !request.getEnabled()) {
			throw new BadRequestException("Admins cannot disable their own account");
		}
		user.setEnabled(request.getEnabled());
		return toUserResponse(userRepository.save(user));
	}

	@Transactional(readOnly = true)
	public PageResponse<CompanyResponse> getCompanies(Boolean verified, String keyword, Pageable pageable) {
		requireAdmin();
		return page(companyRepository.findAll(companySpecification(verified, keyword), pageable), this::toCompanyResponse);
	}

	@Transactional(readOnly = true)
	public CompanyResponse getCompany(Long companyId) {
		requireAdmin();
		return toCompanyResponse(companyRepository.findById(companyId)
				.orElseThrow(() -> new ResourceNotFoundException("Company not found")));
	}

	@Transactional
	public CompanyResponse updateCompanyVerification(Long companyId, UpdateCompanyVerificationRequest request) {
		requireAdmin();
		Company company = companyRepository.findById(companyId).orElseThrow(() -> new ResourceNotFoundException("Company not found"));
		company.setVerified(request.getVerified());
		return toCompanyResponse(companyRepository.save(company));
	}

	@Transactional(readOnly = true)
	public PageResponse<JobResponse> getJobs(JobStatus status, JobType jobType, String keyword, Pageable pageable) {
		requireAdmin();
		return page(jobRepository.findAll(jobSpecification(status, jobType, keyword), pageable), this::toJobResponse);
	}

	@Transactional(readOnly = true)
	public JobResponse getJob(Long jobId) {
		requireAdmin();
		return toJobResponse(jobRepository.findById(jobId).orElseThrow(() -> new ResourceNotFoundException("Job not found")));
	}

	@Transactional
	public JobResponse closeJob(Long jobId) {
		requireAdmin();
		Job job = jobRepository.findById(jobId).orElseThrow(() -> new ResourceNotFoundException("Job not found"));
		if (job.getStatus() != JobStatus.CLOSED) {
			job.setStatus(JobStatus.CLOSED);
			jobRepository.save(job);
		}
		return toJobResponse(job);
	}

	@Transactional(readOnly = true)
	public PageResponse<AdminApplicationResponse> getApplications(ApplicationStatus status, Long jobId, Pageable pageable) {
		requireAdmin();
		return page(applicationRepository.findAll(applicationSpecification(status, jobId), pageable), this::toApplicationResponse);
	}

	@Transactional(readOnly = true)
	public AdminApplicationResponse getApplication(Long applicationId) {
		requireAdmin();
		return toApplicationResponse(applicationRepository.findById(applicationId)
				.orElseThrow(() -> new ResourceNotFoundException("Application not found")));
	}

	@Transactional(readOnly = true)
	public PageResponse<AdminInterviewResponse> getInterviews(
			InterviewStatus status, InterviewMode mode, Long jobId, Pageable pageable
	) {
		requireAdmin();
		return page(interviewRepository.findAll(interviewSpecification(status, mode, jobId), pageable), this::toInterviewResponse);
	}

	@Transactional(readOnly = true)
	public AdminInterviewResponse getInterview(Long interviewId) {
		requireAdmin();
		return toInterviewResponse(interviewRepository.findById(interviewId)
				.orElseThrow(() -> new ResourceNotFoundException("Interview not found")));
	}

	@Transactional(readOnly = true)
	public DashboardResponse getDashboard() {
		requireAdmin();
		Map<ApplicationStatus, Long> applications = new EnumMap<>(ApplicationStatus.class);
		for (ApplicationStatus status : ApplicationStatus.values()) applications.put(status, applicationRepository.countByStatus(status));
		Map<InterviewStatus, Long> interviews = new EnumMap<>(InterviewStatus.class);
		for (InterviewStatus status : InterviewStatus.values()) interviews.put(status, interviewRepository.countByStatus(status));
		return new DashboardResponse(
				userRepository.count(), userRepository.countByRole(Role.CANDIDATE), userRepository.countByRole(Role.RECRUITER),
				userRepository.countByRole(Role.ADMIN), userRepository.countByEnabled(true), userRepository.countByEnabled(false),
				companyRepository.count(), companyRepository.countByVerified(true), companyRepository.countByVerified(false),
				jobRepository.count(), jobRepository.countByStatus(JobStatus.OPEN), jobRepository.countByStatus(JobStatus.CLOSED),
				jobRepository.countByJobType(JobType.INTERNSHIP), jobRepository.countByJobType(JobType.JOB),
				applicationRepository.count(), applications, interviewRepository.count(), interviews
		);
	}

	private User requireAdmin() {
		User user = currentUserService.getCurrentUser();
		if (user.getRole() != Role.ADMIN) throw new UnauthorizedActionException("Only admins can manage this resource");
		return user;
	}

	private Specification<User> userSpecification(Role role, Boolean enabled, String keyword) {
		return (root, query, cb) -> {
			List<Predicate> predicates = new java.util.ArrayList<>();
			if (role != null) predicates.add(cb.equal(root.get("role"), role));
			if (enabled != null) predicates.add(cb.equal(root.get("enabled"), enabled));
			if (hasText(keyword)) predicates.add(cb.like(cb.lower(root.get("email")), pattern(keyword)));
			return cb.and(predicates.toArray(Predicate[]::new));
		};
	}

	private Specification<Company> companySpecification(Boolean verified, String keyword) {
		return (root, query, cb) -> {
			List<Predicate> predicates = new java.util.ArrayList<>();
			if (verified != null) predicates.add(cb.equal(root.get("verified"), verified));
			if (hasText(keyword)) predicates.add(cb.like(cb.lower(root.get("name")), pattern(keyword)));
			return cb.and(predicates.toArray(Predicate[]::new));
		};
	}

	private Specification<Job> jobSpecification(JobStatus status, JobType jobType, String keyword) {
		return (root, query, cb) -> {
			List<Predicate> predicates = new java.util.ArrayList<>();
			if (status != null) predicates.add(cb.equal(root.get("status"), status));
			if (jobType != null) predicates.add(cb.equal(root.get("jobType"), jobType));
			if (hasText(keyword)) predicates.add(cb.or(cb.like(cb.lower(root.get("title")), pattern(keyword)), cb.like(cb.lower(root.get("location")), pattern(keyword))));
			return cb.and(predicates.toArray(Predicate[]::new));
		};
	}

	private Specification<Application> applicationSpecification(ApplicationStatus status, Long jobId) {
		return (root, query, cb) -> {
			List<Predicate> predicates = new java.util.ArrayList<>();
			if (status != null) predicates.add(cb.equal(root.get("status"), status));
			if (jobId != null) predicates.add(cb.equal(root.get("job").get("id"), jobId));
			return cb.and(predicates.toArray(Predicate[]::new));
		};
	}

	private Specification<Interview> interviewSpecification(InterviewStatus status, InterviewMode mode, Long jobId) {
		return (root, query, cb) -> {
			List<Predicate> predicates = new java.util.ArrayList<>();
			if (status != null) predicates.add(cb.equal(root.get("status"), status));
			if (mode != null) predicates.add(cb.equal(root.get("interviewMode"), mode));
			if (jobId != null) predicates.add(cb.equal(root.get("application").get("job").get("id"), jobId));
			return cb.and(predicates.toArray(Predicate[]::new));
		};
	}

	private boolean hasText(String value) { return value != null && !value.isBlank(); }
	private String pattern(String value) { return "%" + value.trim().toLowerCase(Locale.ROOT) + "%"; }
	private <T, R> PageResponse<R> page(Page<T> source, java.util.function.Function<T, R> mapper) { return PageResponse.from(source.map(mapper)); }
	private AdminUserResponse toUserResponse(User user) { return new AdminUserResponse(user.getId(), user.getEmail(), user.getRole(), user.getEnabled(), user.getCreatedAt()); }
	private CompanyResponse toCompanyResponse(Company company) { return new CompanyResponse(company.getId(), company.getName(), company.getDescription(), company.getWebsite(), company.getLocation(), company.getIndustry(), company.getVerified(), company.getCreatedAt(), company.getUpdatedAt()); }
	private JobSummaryResponse toJobSummary(Job job) { Company c = job.getCompany(); return new JobSummaryResponse(job.getId(), job.getTitle(), new JobCompanyResponse(c.getId(), c.getName(), c.getWebsite(), c.getLocation(), c.getIndustry()), job.getLocation(), job.getJobType(), job.getEmploymentType(), job.getStatus(), job.getApplicationDeadline()); }
	private JobResponse toJobResponse(Job job) { List<SkillResponse> skills = job.getRequiredSkills().stream().sorted(Comparator.comparing(Skill::getName, String.CASE_INSENSITIVE_ORDER)).map(s -> new SkillResponse(s.getId(), s.getName())).toList(); return new JobResponse(job.getId(), job.getTitle(), job.getDescription(), toJobSummary(job).company(), job.getLocation(), job.getJobType(), job.getEmploymentType(), job.getMinSalary(), job.getMaxSalary(), skills, job.getMinExperience(), job.getDuration(), job.getApplicationDeadline(), job.getStatus(), job.getCreatedAt(), job.getUpdatedAt()); }
	private AdminApplicationResponse toApplicationResponse(Application app) { List<ApplicationStatusHistoryResponse> history = app.getStatusHistory().stream().sorted(Comparator.comparing(ApplicationStatusHistory::getChangedAt, Comparator.nullsLast(Comparator.naturalOrder()))).map(h -> new ApplicationStatusHistoryResponse(h.getStatus(), h.getChangedAt())).toList(); return new AdminApplicationResponse(app.getId(), toUserResponse(app.getCandidate()), toJobSummary(app.getJob()), app.getStatus(), app.getAppliedAt(), history); }
	private AdminInterviewResponse toInterviewResponse(Interview interview) { Application app = interview.getApplication(); return new AdminInterviewResponse(interview.getId(), toUserResponse(app.getCandidate()), toJobSummary(app.getJob()), interview.getScheduledDateTime(), interview.getInterviewMode(), interview.getStatus()); }
}
