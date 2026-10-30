package com.careerconnect.backend.service;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import com.careerconnect.backend.entity.User;
import com.careerconnect.backend.exception.ResourceNotFoundException;
import com.careerconnect.backend.exception.UnauthorizedActionException;
import com.careerconnect.backend.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CurrentUserService {

	private final UserRepository userRepository;

	public User getCurrentUser() {
		Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
		if (authentication == null || !authentication.isAuthenticated() || authentication.getName() == null) {
			throw new UnauthorizedActionException("Authentication is required");
		}

		return userRepository.findByEmail(authentication.getName())
				.orElseThrow(() -> new ResourceNotFoundException("Authenticated user no longer exists"));
	}
}
