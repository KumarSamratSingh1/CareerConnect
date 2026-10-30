package com.careerconnect.backend.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import com.careerconnect.backend.common.enums.JobStatus;
import com.careerconnect.backend.common.enums.JobType;
import com.careerconnect.backend.entity.Job;

public interface JobRepository extends JpaRepository<Job, Long>, JpaSpecificationExecutor<Job> {

	Page<Job> findByCompanyId(Long companyId, Pageable pageable);

	Optional<Job> findByIdAndCompanyRecruiterProfileUserId(Long id, Long userId);

	Optional<Job> findByIdAndStatus(Long id, JobStatus status);

	List<Job> findByStatusAndApplicationDeadlineBefore(JobStatus status, LocalDate applicationDeadline);

	long countByStatus(JobStatus status);

	long countByJobType(JobType jobType);
}
