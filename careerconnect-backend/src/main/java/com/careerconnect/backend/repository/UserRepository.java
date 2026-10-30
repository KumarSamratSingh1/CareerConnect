package com.careerconnect.backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import com.careerconnect.backend.common.enums.Role;
import com.careerconnect.backend.entity.User;

public interface UserRepository extends JpaRepository<User, Long>, JpaSpecificationExecutor<User> {

	Optional<User> findByEmail(String email);

	boolean existsByEmail(String email);

	Optional<User> findByGoogleSubject(String googleSubject);

	boolean existsByGoogleSubject(String googleSubject);

	long countByRole(Role role);

	long countByEnabled(Boolean enabled);
}
