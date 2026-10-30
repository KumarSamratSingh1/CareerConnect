package com.careerconnect.backend.service;

import java.util.Collections;
import java.util.Locale;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.careerconnect.backend.common.enums.Role;
import com.careerconnect.backend.dto.request.GoogleAuthRequest;
import com.careerconnect.backend.dto.response.AuthResponse;
import com.careerconnect.backend.entity.CandidateProfile;
import com.careerconnect.backend.entity.User;
import com.careerconnect.backend.exception.BadRequestException;
import com.careerconnect.backend.exception.UnauthorizedActionException;
import com.careerconnect.backend.repository.CandidateProfileRepository;
import com.careerconnect.backend.repository.UserRepository;
import com.careerconnect.backend.security.CustomUserDetailsService;
import com.careerconnect.backend.security.JwtService;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken.Payload;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;

@Service
public class GoogleAuthService {

	private static final String TOKEN_TYPE = "Bearer";

	private final UserRepository userRepository;
	private final CandidateProfileRepository candidateProfileRepository;
	private final PasswordEncoder passwordEncoder;
	private final CustomUserDetailsService userDetailsService;
	private final JwtService jwtService;
	private final String googleClientId;
	private GoogleIdTokenVerifier verifier;

	public GoogleAuthService(
			UserRepository userRepository,
			CandidateProfileRepository candidateProfileRepository,
			PasswordEncoder passwordEncoder,
			CustomUserDetailsService userDetailsService,
			JwtService jwtService,
			@Value("${app.google.client-id:}") String googleClientId
	) {
		this.userRepository = userRepository;
		this.candidateProfileRepository = candidateProfileRepository;
		this.passwordEncoder = passwordEncoder;
		this.userDetailsService = userDetailsService;
		this.jwtService = jwtService;
		this.googleClientId = googleClientId != null ? googleClientId.trim() : "";
	}

	void setVerifier(GoogleIdTokenVerifier verifier) {
		this.verifier = verifier;
	}

	private GoogleIdTokenVerifier getOrCreateVerifier() {
		if (this.verifier != null) {
			return this.verifier;
		}
		if (this.googleClientId.isBlank()) {
			throw new BadRequestException("Google authentication is not configured on this server. Please set GOOGLE_CLIENT_ID.");
		}
		this.verifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), new GsonFactory())
				.setAudience(Collections.singletonList(this.googleClientId))
				.build();
		return this.verifier;
	}

	@Transactional
	public AuthResponse authenticate(GoogleAuthRequest request) {
		GoogleIdTokenVerifier tokenVerifier = getOrCreateVerifier();

		GoogleIdToken idToken;
		try {
			idToken = tokenVerifier.verify(request.getIdToken());
		} catch (Exception exception) {
			throw new BadRequestException("Invalid Google ID token: " + exception.getMessage());
		}

		if (idToken == null) {
			throw new BadRequestException("Invalid or expired Google ID token");
		}

		Payload payload = idToken.getPayload();
		String googleSubject = payload.getSubject();
		String email = payload.getEmail();
		Boolean emailVerified = payload.getEmailVerified();
		String name = (String) payload.get("name");

		if (googleSubject == null || googleSubject.isBlank()) {
			throw new BadRequestException("Google ID token missing subject");
		}
		if (email == null || email.isBlank()) {
			throw new BadRequestException("Google ID token missing email");
		}
		if (emailVerified == null || !emailVerified) {
			throw new BadRequestException("Google account email is not verified");
		}

		String normalizedEmail = email.trim().toLowerCase(Locale.ROOT);

		// 1. If user with googleSubject already exists -> log in
		User user = userRepository.findByGoogleSubject(googleSubject).orElse(null);

		if (user != null) {
			if (!Boolean.TRUE.equals(user.getEnabled())) {
				throw new UnauthorizedActionException("User account is disabled");
			}
			ensureCandidateProfile(user, name, normalizedEmail);
			return createAuthResponse(user);
		}

		// 2. If matching verified email exists -> link Google identity
		user = userRepository.findByEmail(normalizedEmail).orElse(null);
		if (user != null) {
			if (!Boolean.TRUE.equals(user.getEnabled())) {
				throw new UnauthorizedActionException("User account is disabled");
			}
			user.setGoogleSubject(googleSubject);
			userRepository.save(user);
			ensureCandidateProfile(user, name, normalizedEmail);
			return createAuthResponse(user);
		}

		// 3. New user -> create as CANDIDATE
		User newUser = new User();
		newUser.setEmail(normalizedEmail);
		newUser.setGoogleSubject(googleSubject);
		newUser.setPassword(passwordEncoder.encode(UUID.randomUUID().toString()));
		newUser.setRole(Role.CANDIDATE);
		newUser.setEnabled(true);
		User savedUser = userRepository.save(newUser);

		// Auto-provision basic candidate profile so candidate features work immediately
		ensureCandidateProfile(savedUser, name, normalizedEmail);

		return createAuthResponse(savedUser);
	}

	private void ensureCandidateProfile(User user, String name, String normalizedEmail) {
		if (user.getRole() == Role.CANDIDATE && candidateProfileRepository.findByUserId(user.getId()).isEmpty()) {
			CandidateProfile profile = new CandidateProfile();
			profile.setUser(user);
			profile.setFullName(name != null && !name.isBlank() ? name.trim() : normalizedEmail.split("@")[0]);
			candidateProfileRepository.save(profile);
		}
	}

	private AuthResponse createAuthResponse(User user) {
		UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
		String token = jwtService.generateToken(userDetails);
		return new AuthResponse(token, TOKEN_TYPE, user.getEmail(), user.getRole());
	}
}
