package com.careerconnect.backend.service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.careerconnect.backend.common.dto.PageResponse;
import com.careerconnect.backend.common.enums.EmploymentType;
import com.careerconnect.backend.common.enums.JobStatus;
import com.careerconnect.backend.common.enums.JobType;
import com.careerconnect.backend.common.enums.Role;
import com.careerconnect.backend.dto.request.CreateJobRequest;
import com.careerconnect.backend.dto.request.UpdateJobRequest;
import com.careerconnect.backend.dto.response.JobCompanyResponse;
import com.careerconnect.backend.dto.response.JobResponse;
import com.careerconnect.backend.dto.response.SkillResponse;
import com.careerconnect.backend.entity.Company;
import com.careerconnect.backend.entity.Job;
import com.careerconnect.backend.entity.RecruiterProfile;
import com.careerconnect.backend.entity.Skill;
import com.careerconnect.backend.entity.User;
import com.careerconnect.backend.exception.BadRequestException;
import com.careerconnect.backend.exception.DuplicateResourceException;
import com.careerconnect.backend.exception.ResourceNotFoundException;
import com.careerconnect.backend.exception.UnauthorizedActionException;
import com.careerconnect.backend.repository.JobRepository;
import com.careerconnect.backend.repository.RecruiterProfileRepository;
import com.careerconnect.backend.repository.SkillRepository;

import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class JobService {

	private final CurrentUserService currentUserService;
	private final RecruiterProfileRepository recruiterProfileRepository;
	private final JobRepository jobRepository;
	private final SkillRepository skillRepository;

	@Transactional
	public JobResponse createJob(CreateJobRequest request) {
		Company company = getCurrentRecruiterCompany();
		Job job = new Job();
		job.setCompany(company);
		job.setStatus(JobStatus.OPEN);
		applyJobFields(job, request.getTitle(), request.getDescription(), request.getLocation(), request.getJobType(),
				request.getEmploymentType(), request.getMinSalary(), request.getMaxSalary(), request.getMinExperience(),
				request.getApplicationDeadline(), request.getDuration(), request.getRequiredSkills());
		return toResponse(jobRepository.save(job));
	}

	@Transactional
	public JobResponse updateMyJob(Long jobId, UpdateJobRequest request) {
		Job job = getOwnedJob(jobId);
		applyJobFields(job, request.getTitle(), request.getDescription(), request.getLocation(), request.getJobType(),
				request.getEmploymentType(), request.getMinSalary(), request.getMaxSalary(), request.getMinExperience(),
				request.getApplicationDeadline(), request.getDuration(), request.getRequiredSkills());
		return toResponse(jobRepository.save(job));
	}

	@Transactional
	public JobResponse closeMyJob(Long jobId) {
		Job job = getOwnedJob(jobId);
		if (job.getStatus() != JobStatus.CLOSED) {
			job.setStatus(JobStatus.CLOSED);
			jobRepository.save(job);
		}
		return toResponse(job);
	}

	@Transactional(readOnly = true)
	public PageResponse<JobResponse> getMyJobs(Pageable pageable) {
		Company company = getCurrentRecruiterCompany();
		return toPageResponse(jobRepository.findByCompanyId(company.getId(), pageable));
	}

	@Transactional(readOnly = true)
	public PageResponse<JobResponse> getPublicJobs(
			String keyword,
			String location,
			JobType jobType,
			EmploymentType employmentType,
			Pageable pageable
	) {
		return toPageResponse(jobRepository.findAll(publicJobSpecification(keyword, location, jobType, employmentType), pageable));
	}

	@Transactional(readOnly = true)
	public JobResponse getPublicJob(Long jobId) {
		Job job = jobRepository.findByIdAndStatus(jobId, JobStatus.OPEN)
				.orElseThrow(() -> new ResourceNotFoundException("Job not found"));
		return toResponse(job);
	}

	private Job getOwnedJob(Long jobId) {
		User user = getCurrentRecruiter();
		return jobRepository.findByIdAndCompanyRecruiterProfileUserId(jobId, user.getId())
				.orElseThrow(() -> new ResourceNotFoundException("Job not found"));
	}

	private Company getCurrentRecruiterCompany() {
		User user = getCurrentRecruiter();
		RecruiterProfile profile = recruiterProfileRepository.findByUserId(user.getId())
				.orElseThrow(() -> new ResourceNotFoundException("Recruiter profile not found"));
		if (profile.getCompany() == null) {
			throw new ResourceNotFoundException("Company not found for recruiter profile");
		}
		return profile.getCompany();
	}

	private User getCurrentRecruiter() {
		User user = currentUserService.getCurrentUser();
		if (user.getRole() != Role.RECRUITER) {
			throw new UnauthorizedActionException("Only recruiters can manage jobs");
		}
		return user;
	}

	private void applyJobFields(
			Job job,
			String title,
			String description,
			String location,
			JobType jobType,
			EmploymentType employmentType,
			Integer minSalary,
			Integer maxSalary,
			Integer minExperience,
			LocalDate applicationDeadline,
			String duration,
			List<String> requiredSkills
	) {
		validateBusinessRules(jobType, minSalary, maxSalary, minExperience, applicationDeadline, duration);
		job.setTitle(title.trim());
		job.setDescription(description.trim());
		job.setLocation(location.trim());
		job.setJobType(jobType);
		job.setEmploymentType(employmentType);
		job.setMinSalary(minSalary);
		job.setMaxSalary(maxSalary);
		job.setMinExperience(minExperience);
		job.setApplicationDeadline(applicationDeadline);
		job.setDuration(jobType == JobType.INTERNSHIP ? duration.trim() : null);
		job.setRequiredSkills(resolveSkills(requiredSkills));
	}

	private void validateBusinessRules(
			JobType jobType,
			Integer minSalary,
			Integer maxSalary,
			Integer minExperience,
			LocalDate applicationDeadline,
			String duration
	) {
		if (jobType == null) {
			throw new BadRequestException("jobType is required");
		}
		if (minSalary != null && maxSalary != null && minSalary > maxSalary) {
			throw new BadRequestException("minSalary must not be greater than maxSalary");
		}
		if (minExperience != null && minExperience < 0) {
			throw new BadRequestException("minExperience must not be negative");
		}
		if (applicationDeadline != null && applicationDeadline.isBefore(LocalDate.now())) {
			throw new BadRequestException("applicationDeadline must not be in the past");
		}
		if (jobType == JobType.INTERNSHIP && (duration == null || duration.isBlank())) {
			throw new BadRequestException("duration is required for internships");
		}
	}

	private Set<Skill> resolveSkills(List<String> requestedSkills) {
		if (requestedSkills == null || requestedSkills.isEmpty()) {
			return new LinkedHashSet<>();
		}

		Set<String> canonicalNames = new LinkedHashSet<>();
		for (String requestedSkill : requestedSkills) {
			canonicalNames.add(normalizeSkillName(requestedSkill));
		}

		Set<Skill> skills = new LinkedHashSet<>();
		for (String canonicalName : canonicalNames) {
			skills.add(skillRepository.findByName(canonicalName).orElseGet(() -> createSkill(canonicalName)));
		}
		return skills;
	}

	private String normalizeSkillName(String rawName) {
		if (rawName == null) {
			throw new BadRequestException("Skill name must not be blank");
		}
		String normalizedName = rawName.trim().toLowerCase(Locale.ROOT);
		if (normalizedName.isBlank()) {
			throw new BadRequestException("Skill name must not be blank");
		}
		return normalizedName;
	}

	private Skill createSkill(String name) {
		Skill skill = new Skill();
		skill.setName(name);
		try {
			return skillRepository.saveAndFlush(skill);
		} catch (DataIntegrityViolationException exception) {
			return skillRepository.findByName(name)
					.orElseThrow(() -> new DuplicateResourceException("Skill already exists"));
		}
	}

	private Specification<Job> publicJobSpecification(
			String keyword,
			String location,
			JobType jobType,
			EmploymentType employmentType
	) {
		return (root, query, criteriaBuilder) -> {
			List<Predicate> predicates = new ArrayList<>();
			predicates.add(criteriaBuilder.equal(root.get("status"), JobStatus.OPEN));
			if (keyword != null && !keyword.isBlank()) {
				String pattern = "%" + keyword.trim().toLowerCase(Locale.ROOT) + "%";
				predicates.add(criteriaBuilder.or(
						criteriaBuilder.like(criteriaBuilder.lower(root.get("title")), pattern),
						criteriaBuilder.like(criteriaBuilder.lower(root.get("description")), pattern)
				));
			}
			if (location != null && !location.isBlank()) {
				predicates.add(criteriaBuilder.equal(
						criteriaBuilder.lower(root.get("location")), location.trim().toLowerCase(Locale.ROOT)
				));
			}
			if (jobType != null) {
				predicates.add(criteriaBuilder.equal(root.get("jobType"), jobType));
			}
			if (employmentType != null) {
				predicates.add(criteriaBuilder.equal(root.get("employmentType"), employmentType));
			}
			return criteriaBuilder.and(predicates.toArray(Predicate[]::new));
		};
	}

	private PageResponse<JobResponse> toPageResponse(Page<Job> jobs) {
		return PageResponse.from(jobs.map(this::toResponse));
	}

	private JobResponse toResponse(Job job) {
		List<SkillResponse> skills = job.getRequiredSkills().stream()
				.sorted(Comparator.comparing(Skill::getName, String.CASE_INSENSITIVE_ORDER))
				.map(skill -> new SkillResponse(skill.getId(), skill.getName()))
				.toList();
		Company company = job.getCompany();
		JobCompanyResponse companyResponse = new JobCompanyResponse(
				company.getId(), company.getName(), company.getWebsite(), company.getLocation(), company.getIndustry()
		);
		return new JobResponse(
				job.getId(), job.getTitle(), job.getDescription(), companyResponse, job.getLocation(), job.getJobType(),
				job.getEmploymentType(), job.getMinSalary(), job.getMaxSalary(), skills, job.getMinExperience(),
				job.getDuration(), job.getApplicationDeadline(), job.getStatus(), job.getCreatedAt(), job.getUpdatedAt()
		);
	}
}
