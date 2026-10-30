package com.careerconnect.backend.dto.response;

import java.time.LocalDateTime;

import com.careerconnect.backend.common.enums.ApplicationStatus;

public record ApplicationStatusHistoryResponse(ApplicationStatus status, LocalDateTime changedAt) {
}
