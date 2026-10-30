package com.careerconnect.backend.dto.response;

import com.careerconnect.backend.common.enums.Role;

public record AuthResponse(
		String token,
		String tokenType,
		String email,
		Role role
) {
}
