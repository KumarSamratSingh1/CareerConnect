package com.careerconnect.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.careerconnect.backend.entity.Experience;

public interface ExperienceRepository extends JpaRepository<Experience, Long> {

	List<Experience> findByCandidateProfileIdOrderByIdAsc(Long candidateProfileId);

	Optional<Experience> findByIdAndCandidateProfileId(Long id, Long candidateProfileId);
}
