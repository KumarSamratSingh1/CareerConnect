package com.careerconnect.backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import com.careerconnect.backend.entity.Company;

public interface CompanyRepository extends JpaRepository<Company, Long>, JpaSpecificationExecutor<Company> {

	Optional<Company> findByName(String name);

	boolean existsByName(String name);

	long countByVerified(Boolean verified);
}
