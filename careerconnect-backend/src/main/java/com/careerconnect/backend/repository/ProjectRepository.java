package com.careerconnect.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.careerconnect.backend.entity.Project;

public interface ProjectRepository extends JpaRepository<Project, Long> {

	List<Project> findByCandidateProfileIdOrderByIdAsc(Long candidateProfileId);

	Optional<Project> findByIdAndCandidateProfileId(Long id, Long candidateProfileId);
}
