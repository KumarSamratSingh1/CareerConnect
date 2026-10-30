package com.careerconnect.backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.careerconnect.backend.entity.Skill;

public interface SkillRepository extends JpaRepository<Skill, Long> {

	Optional<Skill> findByName(String name);

	boolean existsByName(String name);
}
