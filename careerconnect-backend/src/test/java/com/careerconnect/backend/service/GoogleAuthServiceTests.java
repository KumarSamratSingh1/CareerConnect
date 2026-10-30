package com.careerconnect.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;

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

@ExtendWith(MockitoExtension.class)
class GoogleAuthServiceTests {

	@Mock
	private UserRepository userRepository;

	@Mock
	private CandidateProfileRepository candidateProfileRepository;

	@Mock
	private PasswordEncoder passwordEncoder;

	@Mock
	private CustomUserDetailsService userDetailsService;

	@Mock
	private JwtService jwtService;

	@Mock
	private GoogleIdTokenVerifier tokenVerifier;

	private GoogleAuthService googleAuthService;

	@BeforeEach
	void setUp() {
		googleAuthService = new GoogleAuthService(
				userRepository,
				candidateProfileRepository,
				passwordEncoder,
				userDetailsService,
				jwtService,
				"test-client-id"
		);
		googleAuthService.setVerifier(tokenVerifier);
	}

	@Test
	void throwsBadRequestWhenClientNotConfigured() {
		GoogleAuthService unconfiguredService = new GoogleAuthService(
				userRepository, candidateProfileRepository, passwordEncoder,
				userDetailsService, jwtService, ""
		);
		GoogleAuthRequest request = new GoogleAuthRequest();
		request.setIdToken("token123");

		assertThatThrownBy(() -> unconfiguredService.authenticate(request))
				.isInstanceOf(BadRequestException.class)
				.hasMessageContaining("Google authentication is not configured");
	}

	@Test
	void throwsBadRequestWhenTokenInvalid() throws Exception {
		when(tokenVerifier.verify(anyString())).thenReturn(null);

		GoogleAuthRequest request = new GoogleAuthRequest();
		request.setIdToken("invalid-token");

		assertThatThrownBy(() -> googleAuthService.authenticate(request))
				.isInstanceOf(BadRequestException.class)
				.hasMessageContaining("Invalid or expired Google ID token");
	}

	@Test
	void throwsBadRequestWhenEmailNotVerified() throws Exception {
		GoogleIdToken idToken = mock(GoogleIdToken.class);
		Payload payload = new Payload();
		payload.setSubject("google-sub-123");
		payload.setEmail("user@example.com");
		payload.setEmailVerified(false);

		when(tokenVerifier.verify(anyString())).thenReturn(idToken);
		when(idToken.getPayload()).thenReturn(payload);

		GoogleAuthRequest request = new GoogleAuthRequest();
		request.setIdToken("valid-token");

		assertThatThrownBy(() -> googleAuthService.authenticate(request))
				.isInstanceOf(BadRequestException.class)
				.hasMessageContaining("Google account email is not verified");
	}

	@Test
	void authenticatesExistingUserByGoogleSubject() throws Exception {
		GoogleIdToken idToken = mock(GoogleIdToken.class);
		Payload payload = new Payload();
		payload.setSubject("google-sub-123");
		payload.setEmail("user@example.com");
		payload.setEmailVerified(true);

		User existingUser = new User();
		existingUser.setId(10L);
		existingUser.setEmail("user@example.com");
		existingUser.setRole(Role.CANDIDATE);
		existingUser.setGoogleSubject("google-sub-123");
		existingUser.setEnabled(true);

		UserDetails userDetails = org.springframework.security.core.userdetails.User.builder()
				.username("user@example.com")
				.password("secret")
				.authorities(new SimpleGrantedAuthority("ROLE_CANDIDATE"))
				.build();

		when(tokenVerifier.verify(anyString())).thenReturn(idToken);
		when(idToken.getPayload()).thenReturn(payload);
		when(userRepository.findByGoogleSubject("google-sub-123")).thenReturn(Optional.of(existingUser));
		when(userDetailsService.loadUserByUsername("user@example.com")).thenReturn(userDetails);
		when(jwtService.generateToken(userDetails)).thenReturn("mock-jwt-token");

		GoogleAuthRequest request = new GoogleAuthRequest();
		request.setIdToken("valid-token");

		AuthResponse response = googleAuthService.authenticate(request);

		assertThat(response.token()).isEqualTo("mock-jwt-token");
		assertThat(response.email()).isEqualTo("user@example.com");
		assertThat(response.role()).isEqualTo(Role.CANDIDATE);
	}

	@Test
	void linksGoogleSubjectToExistingUserWithMatchingEmail() throws Exception {
		GoogleIdToken idToken = mock(GoogleIdToken.class);
		Payload payload = new Payload();
		payload.setSubject("google-sub-456");
		payload.setEmail("user@example.com");
		payload.setEmailVerified(true);

		User existingUser = new User();
		existingUser.setId(10L);
		existingUser.setEmail("user@example.com");
		existingUser.setRole(Role.RECRUITER);
		existingUser.setEnabled(true);

		UserDetails userDetails = org.springframework.security.core.userdetails.User.builder()
				.username("user@example.com")
				.password("secret")
				.authorities(new SimpleGrantedAuthority("ROLE_RECRUITER"))
				.build();

		when(tokenVerifier.verify(anyString())).thenReturn(idToken);
		when(idToken.getPayload()).thenReturn(payload);
		when(userRepository.findByGoogleSubject("google-sub-456")).thenReturn(Optional.empty());
		when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(existingUser));
		when(userDetailsService.loadUserByUsername("user@example.com")).thenReturn(userDetails);
		when(jwtService.generateToken(userDetails)).thenReturn("mock-jwt-token");

		GoogleAuthRequest request = new GoogleAuthRequest();
		request.setIdToken("valid-token");

		AuthResponse response = googleAuthService.authenticate(request);

		assertThat(response.token()).isEqualTo("mock-jwt-token");
		assertThat(existingUser.getGoogleSubject()).isEqualTo("google-sub-456");
		verify(userRepository).save(existingUser);
	}

	@Test
	void createsNewCandidateWhenUserDoesNotExist() throws Exception {
		GoogleIdToken idToken = mock(GoogleIdToken.class);
		Payload payload = new Payload();
		payload.setSubject("google-sub-789");
		payload.setEmail("newuser@example.com");
		payload.setEmailVerified(true);
		payload.set("name", "New Candidate");

		when(tokenVerifier.verify(anyString())).thenReturn(idToken);
		when(idToken.getPayload()).thenReturn(payload);
		when(userRepository.findByGoogleSubject("google-sub-789")).thenReturn(Optional.empty());
		when(userRepository.findByEmail("newuser@example.com")).thenReturn(Optional.empty());
		when(passwordEncoder.encode(anyString())).thenReturn("hashed-random-password");

		when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
			User user = invocation.getArgument(0);
			user.setId(99L);
			return user;
		});

		UserDetails userDetails = org.springframework.security.core.userdetails.User.builder()
				.username("newuser@example.com")
				.password("secret")
				.authorities(new SimpleGrantedAuthority("ROLE_CANDIDATE"))
				.build();
		when(userDetailsService.loadUserByUsername("newuser@example.com")).thenReturn(userDetails);
		when(jwtService.generateToken(userDetails)).thenReturn("mock-jwt-token");

		GoogleAuthRequest request = new GoogleAuthRequest();
		request.setIdToken("valid-token");

		AuthResponse response = googleAuthService.authenticate(request);

		assertThat(response.token()).isEqualTo("mock-jwt-token");
		assertThat(response.email()).isEqualTo("newuser@example.com");
		assertThat(response.role()).isEqualTo(Role.CANDIDATE);
		verify(candidateProfileRepository).save(any(CandidateProfile.class));
	}

	@Test
	void throwsUnauthorizedWhenAccountDisabled() throws Exception {
		GoogleIdToken idToken = mock(GoogleIdToken.class);
		Payload payload = new Payload();
		payload.setSubject("google-sub-disabled");
		payload.setEmail("disabled@example.com");
		payload.setEmailVerified(true);

		User disabledUser = new User();
		disabledUser.setId(5L);
		disabledUser.setEmail("disabled@example.com");
		disabledUser.setEnabled(false);

		when(tokenVerifier.verify(anyString())).thenReturn(idToken);
		when(idToken.getPayload()).thenReturn(payload);
		when(userRepository.findByGoogleSubject("google-sub-disabled")).thenReturn(Optional.of(disabledUser));

		GoogleAuthRequest request = new GoogleAuthRequest();
		request.setIdToken("valid-token");

		assertThatThrownBy(() -> googleAuthService.authenticate(request))
				.isInstanceOf(UnauthorizedActionException.class)
				.hasMessageContaining("User account is disabled");
	}
}
