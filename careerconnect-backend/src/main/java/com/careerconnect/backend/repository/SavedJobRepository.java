package com.careerconnect.backend.repository;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.careerconnect.backend.entity.SavedJob;

public interface SavedJobRepository extends JpaRepository<SavedJob, Long> {

	boolean existsByCandidateIdAndJobId(Long candidateId, Long jobId);

	Page<SavedJob> findByCandidateId(Long candidateId, Pageable pageable);

	Optional<SavedJob> findByCandidateIdAndJobId(Long candidateId, Long jobId);
}
