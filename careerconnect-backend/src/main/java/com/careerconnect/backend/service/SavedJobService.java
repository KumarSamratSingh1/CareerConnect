package com.careerconnect.backend.service;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.careerconnect.backend.common.dto.PageResponse;
import com.careerconnect.backend.common.enums.JobStatus;
import com.careerconnect.backend.common.enums.Role;
import com.careerconnect.backend.dto.response.JobCompanyResponse;
import com.careerconnect.backend.dto.response.JobSummaryResponse;
import com.careerconnect.backend.dto.response.SavedJobResponse;
import com.careerconnect.backend.entity.CandidateProfile;
import com.careerconnect.backend.entity.Company;
import com.careerconnect.backend.entity.Job;
import com.careerconnect.backend.entity.SavedJob;
import com.careerconnect.backend.entity.User;
import com.careerconnect.backend.exception.DuplicateResourceException;
import com.careerconnect.backend.exception.ResourceNotFoundException;
import com.careerconnect.backend.exception.UnauthorizedActionException;
import com.careerconnect.backend.repository.CandidateProfileRepository;
import com.careerconnect.backend.repository.JobRepository;
import com.careerconnect.backend.repository.SavedJobRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class SavedJobService {

	private final CurrentUserService currentUserService;
	private final CandidateProfileRepository candidateProfileRepository;
	private final JobRepository jobRepository;
	private final SavedJobRepository savedJobRepository;

	@Transactional
	public SavedJobResponse saveJob(Long jobId) {
		User candidate = getCurrentCandidate();
		requireCandidateProfile(candidate);
		Job job = jobRepository.findById(jobId)
				.orElseThrow(() -> new ResourceNotFoundException("Job not found"));
		if (job.getStatus() != JobStatus.OPEN) {
			throw new ResourceNotFoundException("Job not found");
		}
		if (savedJobRepository.existsByCandidateIdAndJobId(candidate.getId(), jobId)) {
			throw new DuplicateResourceException("Job is already saved");
		}

		SavedJob savedJob = new SavedJob();
		savedJob.setCandidate(candidate);
		savedJob.setJob(job);
		try {
			return toResponse(savedJobRepository.saveAndFlush(savedJob));
		} catch (DataIntegrityViolationException exception) {
			throw new DuplicateResourceException("Job is already saved");
		}
	}

	@Transactional(readOnly = true)
	public PageResponse<SavedJobResponse> getMySavedJobs(Pageable pageable) {
		User candidate = getCurrentCandidate();
		requireCandidateProfile(candidate);
		return toPageResponse(savedJobRepository.findByCandidateId(candidate.getId(), pageable));
	}

	@Transactional
	public void removeSavedJob(Long jobId) {
		User candidate = getCurrentCandidate();
		requireCandidateProfile(candidate);
		SavedJob savedJob = savedJobRepository.findByCandidateIdAndJobId(candidate.getId(), jobId)
				.orElseThrow(() -> new ResourceNotFoundException("Saved job not found"));
		savedJobRepository.delete(savedJob);
	}

	private User getCurrentCandidate() {
		User user = currentUserService.getCurrentUser();
		if (user.getRole() != Role.CANDIDATE) {
			throw new UnauthorizedActionException("Only candidates can manage saved jobs");
		}
		return user;
	}

	private CandidateProfile requireCandidateProfile(User candidate) {
		return candidateProfileRepository.findByUserId(candidate.getId())
				.orElseThrow(() -> new ResourceNotFoundException("Candidate profile not found"));
	}

	private PageResponse<SavedJobResponse> toPageResponse(Page<SavedJob> savedJobs) {
		return PageResponse.from(savedJobs.map(this::toResponse));
	}

	private SavedJobResponse toResponse(SavedJob savedJob) {
		Job job = savedJob.getJob();
		Company company = job.getCompany();
		JobSummaryResponse jobResponse = new JobSummaryResponse(
				job.getId(), job.getTitle(), new JobCompanyResponse(company.getId(), company.getName(), company.getWebsite(),
						company.getLocation(), company.getIndustry()), job.getLocation(), job.getJobType(), job.getEmploymentType(),
				job.getStatus(), job.getApplicationDeadline()
		);
		return new SavedJobResponse(savedJob.getId(), jobResponse, savedJob.getSavedAt());
	}
}
