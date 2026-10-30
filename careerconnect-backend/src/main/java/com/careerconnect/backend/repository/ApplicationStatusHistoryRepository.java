package com.careerconnect.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.careerconnect.backend.entity.ApplicationStatusHistory;

public interface ApplicationStatusHistoryRepository extends JpaRepository<ApplicationStatusHistory, Long> {
}
