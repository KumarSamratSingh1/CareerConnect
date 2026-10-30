package com.careerconnect.backend.config;

import java.util.Locale;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.careerconnect.backend.common.enums.Role;
import com.careerconnect.backend.entity.User;
import com.careerconnect.backend.repository.UserRepository;

@Component
public class AdminSeeder implements CommandLineRunner {
	private final UserRepository userRepository;
	private final PasswordEncoder passwordEncoder;
	private final String email;
	private final String password;

	public AdminSeeder(UserRepository userRepository, PasswordEncoder passwordEncoder, @Value("${app.admin.email:}") String email, @Value("${app.admin.password:}") String password) {
		this.userRepository = userRepository;
		this.passwordEncoder = passwordEncoder;
		this.email = email;
		this.password = password;
	}

	@Override
	public void run(String... args) {
		if (email == null || email.isBlank() || password == null || password.isBlank()) return;
		String normalizedEmail = email.trim().toLowerCase(Locale.ROOT);
		if (userRepository.existsByEmail(normalizedEmail)) return;
		User admin = new User();
		admin.setEmail(normalizedEmail);
		admin.setPassword(passwordEncoder.encode(password));
		admin.setRole(Role.ADMIN);
		admin.setEnabled(true);
		userRepository.save(admin);
	}
}
