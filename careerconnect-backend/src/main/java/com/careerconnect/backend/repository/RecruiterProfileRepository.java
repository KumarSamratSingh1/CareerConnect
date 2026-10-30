package com.careerconnect.backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.careerconnect.backend.entity.RecruiterProfile;

public interface RecruiterProfileRepository extends JpaRepository<RecruiterProfile, Long> {

	Optional<RecruiterProfile> findByUserId(Long userId);

	boolean existsByUserId(Long userId);

	boolean existsByCompanyId(Long companyId);
}
