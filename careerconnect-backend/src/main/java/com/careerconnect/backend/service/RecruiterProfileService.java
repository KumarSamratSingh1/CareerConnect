package com.careerconnect.backend.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.careerconnect.backend.dto.request.RecruiterProfileRequest;
import com.careerconnect.backend.dto.response.RecruiterProfileResponse;
import com.careerconnect.backend.entity.RecruiterProfile;
import com.careerconnect.backend.entity.User;
import com.careerconnect.backend.exception.DuplicateResourceException;
import com.careerconnect.backend.exception.ResourceNotFoundException;
import com.careerconnect.backend.repository.RecruiterProfileRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class RecruiterProfileService {

	private final CurrentUserService currentUserService;
	private final RecruiterProfileRepository recruiterProfileRepository;

	@Transactional
	public RecruiterProfileResponse createProfile(RecruiterProfileRequest request) {
		User user = currentUserService.getCurrentUser();
		if (recruiterProfileRepository.existsByUserId(user.getId())) {
			throw new DuplicateResourceException("Recruiter profile already exists");
		}

		RecruiterProfile profile = new RecruiterProfile();
		profile.setUser(user);
		applyRequest(profile, request);
		return toResponse(recruiterProfileRepository.save(profile));
	}

	@Transactional(readOnly = true)
	public RecruiterProfileResponse getProfile() {
		return toResponse(getCurrentProfile());
	}

	@Transactional
	public RecruiterProfileResponse updateProfile(RecruiterProfileRequest request) {
		RecruiterProfile profile = getCurrentProfile();
		applyRequest(profile, request);
		return toResponse(profile);
	}

	private RecruiterProfile getCurrentProfile() {
		User user = currentUserService.getCurrentUser();
		return recruiterProfileRepository.findByUserId(user.getId())
				.orElseThrow(() -> new ResourceNotFoundException("Recruiter profile not found"));
	}

	private void applyRequest(RecruiterProfile profile, RecruiterProfileRequest request) {
		profile.setFullName(request.getFullName().trim());
		profile.setPhone(request.getPhone());
		profile.setDesignation(request.getDesignation());
	}

	private RecruiterProfileResponse toResponse(RecruiterProfile profile) {
		return new RecruiterProfileResponse(profile.getId(), profile.getFullName(), profile.getPhone(), profile.getDesignation());
	}
}
