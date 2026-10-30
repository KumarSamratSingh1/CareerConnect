package com.careerconnect.backend.service;

import java.util.Locale;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.careerconnect.backend.common.enums.Role;
import com.careerconnect.backend.dto.request.LoginRequest;
import com.careerconnect.backend.dto.request.RegisterRequest;
import com.careerconnect.backend.dto.response.AuthResponse;
import com.careerconnect.backend.entity.User;
import com.careerconnect.backend.exception.BadRequestException;
import com.careerconnect.backend.exception.DuplicateResourceException;
import com.careerconnect.backend.repository.UserRepository;
import com.careerconnect.backend.security.CustomUserDetailsService;
import com.careerconnect.backend.security.JwtService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuthService {

	private static final String TOKEN_TYPE = "Bearer";

	private final UserRepository userRepository;
	private final PasswordEncoder passwordEncoder;
	private final AuthenticationManager authenticationManager;
	private final CustomUserDetailsService userDetailsService;
	private final JwtService jwtService;

	public AuthResponse register(RegisterRequest request) {
		Role role = request.getRole();
		if (role != Role.CANDIDATE && role != Role.RECRUITER) {
			throw new BadRequestException("Only CANDIDATE and RECRUITER registrations are allowed");
		}

		String email = normalizeEmail(request.getEmail());
		if (userRepository.existsByEmail(email)) {
			throw new DuplicateResourceException("An account already exists for this email");
		}

		User user = new User();
		user.setEmail(email);
		user.setPassword(passwordEncoder.encode(request.getPassword()));
		user.setRole(role);
		user.setEnabled(true);
		userRepository.save(user);

		return createAuthResponse(userDetailsService.loadUserByUsername(email));
	}

	public AuthResponse login(LoginRequest request) {
		Authentication authentication = authenticationManager.authenticate(
				new UsernamePasswordAuthenticationToken(normalizeEmail(request.getEmail()), request.getPassword())
		);

		return createAuthResponse((UserDetails) authentication.getPrincipal());
	}

	private AuthResponse createAuthResponse(UserDetails userDetails) {
		Role role = userDetails.getAuthorities().stream()
				.map(GrantedAuthority::getAuthority)
				.filter(authority -> authority.startsWith("ROLE_"))
				.map(authority -> Role.valueOf(authority.substring("ROLE_".length())))
				.findFirst()
				.orElseThrow(() -> new BadRequestException("User has no valid role"));

		return new AuthResponse(jwtService.generateToken(userDetails), TOKEN_TYPE, userDetails.getUsername(), role);
	}

	private String normalizeEmail(String email) {
		return email.trim().toLowerCase(Locale.ROOT);
	}
}
