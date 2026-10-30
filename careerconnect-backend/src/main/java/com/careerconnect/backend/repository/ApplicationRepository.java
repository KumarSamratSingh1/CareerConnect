package com.careerconnect.backend.repository;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import com.careerconnect.backend.common.enums.ApplicationStatus;
import com.careerconnect.backend.entity.Application;

public interface ApplicationRepository extends JpaRepository<Application, Long>, JpaSpecificationExecutor<Application> {

	boolean existsByJobIdAndCandidateId(Long jobId, Long candidateId);

	Page<Application> findByCandidateId(Long candidateId, Pageable pageable);

	Optional<Application> findByIdAndCandidateId(Long id, Long candidateId);

	Optional<Application> findByIdAndJobCompanyRecruiterProfileUserId(Long id, Long userId);

	Page<Application> findByJobId(Long jobId, Pageable pageable);

	long countByStatus(ApplicationStatus status);
}
