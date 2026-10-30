package com.careerconnect.backend.dto.response;

import java.time.LocalDateTime;

import com.careerconnect.backend.common.enums.Role;

public record AdminUserResponse(Long id, String email, Role role, Boolean enabled, LocalDateTime createdAt) {
}
