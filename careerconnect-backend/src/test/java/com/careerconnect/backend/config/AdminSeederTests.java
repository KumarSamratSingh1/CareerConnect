package com.careerconnect.backend.config;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.careerconnect.backend.common.enums.Role;
import com.careerconnect.backend.entity.User;
import com.careerconnect.backend.repository.UserRepository;

class AdminSeederTests {
	@Test
	void seederDoesNothingWhenCredentialsAreMissing() throws Exception {
		UserRepository users = Mockito.mock(UserRepository.class);
		new AdminSeeder(users, Mockito.mock(PasswordEncoder.class), "", "password").run();
		verify(users, never()).existsByEmail(any());
	}

	@Test
	void seederCreatesAdminOnlyWhenEmailDoesNotExist() throws Exception {
		UserRepository users = Mockito.mock(UserRepository.class);
		PasswordEncoder encoder = Mockito.mock(PasswordEncoder.class);
		when(users.existsByEmail("admin@example.com")).thenReturn(false);
		when(encoder.encode("secret")).thenReturn("hash");
		new AdminSeeder(users, encoder, "Admin@Example.com", "secret").run();
		var captor = org.mockito.ArgumentCaptor.forClass(User.class);
		verify(users).save(captor.capture());
		assertEquals(Role.ADMIN, captor.getValue().getRole());
		assertEquals("admin@example.com", captor.getValue().getEmail());

		when(users.existsByEmail("admin@example.com")).thenReturn(true);
		new AdminSeeder(users, encoder, "admin@example.com", "secret").run();
		verify(users).save(any(User.class));
	}
}
