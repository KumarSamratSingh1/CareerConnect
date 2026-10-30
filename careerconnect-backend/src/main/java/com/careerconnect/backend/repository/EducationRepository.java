package com.careerconnect.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.careerconnect.backend.entity.Education;

public interface EducationRepository extends JpaRepository<Education, Long> {

	List<Education> findByCandidateProfileIdOrderByIdAsc(Long candidateProfileId);

	Optional<Education> findByIdAndCandidateProfileId(Long id, Long candidateProfileId);
}
