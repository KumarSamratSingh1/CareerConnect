package com.careerconnect.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.careerconnect.backend.entity.Certification;

public interface CertificationRepository extends JpaRepository<Certification, Long> {

	List<Certification> findByCandidateProfileIdOrderByIdAsc(Long candidateProfileId);

	Optional<Certification> findByIdAndCandidateProfileId(Long id, Long candidateProfileId);
}
