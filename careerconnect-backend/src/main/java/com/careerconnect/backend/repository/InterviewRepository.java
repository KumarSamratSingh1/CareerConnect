package com.careerconnect.backend.repository;

import java.time.LocalDateTime;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import com.careerconnect.backend.common.enums.InterviewStatus;
import com.careerconnect.backend.entity.Interview;

public interface InterviewRepository extends JpaRepository<Interview, Long>, JpaSpecificationExecutor<Interview> {

	boolean existsByApplicationIdAndScheduledDateTimeAndStatus(Long applicationId, LocalDateTime scheduledDateTime, InterviewStatus status);

	boolean existsByApplicationIdAndScheduledDateTimeAndStatusAndIdNot(
			Long applicationId, LocalDateTime scheduledDateTime, InterviewStatus status, Long id
	);

	Page<Interview> findByApplicationCandidateId(Long candidateId, Pageable pageable);

	Optional<Interview> findByIdAndApplicationCandidateId(Long id, Long candidateId);

	Optional<Interview> findByIdAndApplicationJobCompanyRecruiterProfileUserId(Long id, Long userId);

	long countByStatus(InterviewStatus status);
}
