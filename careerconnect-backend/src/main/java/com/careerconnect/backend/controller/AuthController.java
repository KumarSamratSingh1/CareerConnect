package com.careerconnect.backend.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.careerconnect.backend.common.dto.ApiResponse;
import com.careerconnect.backend.dto.request.GoogleAuthRequest;
import com.careerconnect.backend.dto.request.LoginRequest;
import com.careerconnect.backend.dto.request.RegisterRequest;
import com.careerconnect.backend.dto.response.AuthResponse;
import com.careerconnect.backend.service.AuthService;
import com.careerconnect.backend.service.GoogleAuthService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

	private final AuthService authService;
	private final GoogleAuthService googleAuthService;

	@PostMapping("/register")
	public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
		AuthResponse response = authService.register(request);
		return ResponseEntity.status(HttpStatus.CREATED)
				.body(ApiResponse.success("Registration successful", response));
	}

	@PostMapping("/login")
	public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
		AuthResponse response = authService.login(request);
		return ResponseEntity.ok(ApiResponse.success("Login successful", response));
	}

	@PostMapping("/google")
	public ResponseEntity<ApiResponse<AuthResponse>> googleLogin(@Valid @RequestBody GoogleAuthRequest request) {
		AuthResponse response = googleAuthService.authenticate(request);
		return ResponseEntity.ok(ApiResponse.success("Google login successful", response));
	}
}
