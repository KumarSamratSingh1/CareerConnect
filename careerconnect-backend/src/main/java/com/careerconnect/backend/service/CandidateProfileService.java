package com.careerconnect.backend.service;

import java.util.Comparator;
import java.util.List;
import java.util.Locale;

import org.springframework.stereotype.Service;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.transaction.annotation.Transactional;

import com.careerconnect.backend.dto.request.CandidateProfileRequest;
import com.careerconnect.backend.dto.request.EducationRequest;
import com.careerconnect.backend.dto.request.ExperienceRequest;
import com.careerconnect.backend.dto.request.SkillRequest;
import com.careerconnect.backend.dto.response.CandidateProfileResponse;
import com.careerconnect.backend.dto.response.EducationResponse;
import com.careerconnect.backend.dto.response.ExperienceResponse;
import com.careerconnect.backend.dto.response.SkillResponse;
import com.careerconnect.backend.entity.CandidateProfile;
import com.careerconnect.backend.entity.Education;
import com.careerconnect.backend.entity.Experience;
import com.careerconnect.backend.entity.Skill;
import com.careerconnect.backend.entity.User;
import com.careerconnect.backend.exception.DuplicateResourceException;
import com.careerconnect.backend.exception.BadRequestException;
import com.careerconnect.backend.exception.ResourceNotFoundException;
import com.careerconnect.backend.repository.CandidateProfileRepository;
import com.careerconnect.backend.repository.EducationRepository;
import com.careerconnect.backend.repository.ExperienceRepository;
import com.careerconnect.backend.repository.SkillRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CandidateProfileService {

	private final CurrentUserService currentUserService;
	private final CandidateProfileRepository candidateProfileRepository;
	private final EducationRepository educationRepository;
	private final ExperienceRepository experienceRepository;
	private final SkillRepository skillRepository;

	@Transactional
	public CandidateProfileResponse createProfile(CandidateProfileRequest request) {
		User user = currentUserService.getCurrentUser();
		if (candidateProfileRepository.existsByUserId(user.getId())) {
			throw new DuplicateResourceException("Candidate profile already exists");
		}

		CandidateProfile profile = new CandidateProfile();
		profile.setUser(user);
		applyProfileRequest(profile, request);
		try {
			return toProfileResponse(candidateProfileRepository.saveAndFlush(profile));
		} catch (DataIntegrityViolationException exception) {
			throw new DuplicateResourceException("Candidate profile already exists");
		}
	}

	@Transactional(readOnly = true)
	public CandidateProfileResponse getProfile() {
		return toProfileResponse(getCurrentProfile());
	}

	@Transactional
	public CandidateProfileResponse updateProfile(CandidateProfileRequest request) {
		CandidateProfile profile = getCurrentProfile();
		applyProfileRequest(profile, request);
		return toProfileResponse(profile);
	}

	@Transactional
	public EducationResponse addEducation(EducationRequest request) {
		Education education = new Education();
		education.setCandidateProfile(getCurrentProfile());
		applyEducationRequest(education, request);
		return toEducationResponse(educationRepository.save(education));
	}

	@Transactional(readOnly = true)
	public List<EducationResponse> getEducations() {
		CandidateProfile profile = getCurrentProfile();
		return educationRepository.findByCandidateProfileIdOrderByIdAsc(profile.getId()).stream()
				.map(this::toEducationResponse)
				.toList();
	}

	@Transactional
	public EducationResponse updateEducation(Long educationId, EducationRequest request) {
		CandidateProfile profile = getCurrentProfile();
		Education education = educationRepository.findByIdAndCandidateProfileId(educationId, profile.getId())
				.orElseThrow(() -> new ResourceNotFoundException("Education record not found"));
		applyEducationRequest(education, request);
		return toEducationResponse(education);
	}

	@Transactional
	public void deleteEducation(Long educationId) {
		CandidateProfile profile = getCurrentProfile();
		Education education = educationRepository.findByIdAndCandidateProfileId(educationId, profile.getId())
				.orElseThrow(() -> new ResourceNotFoundException("Education record not found"));
		educationRepository.delete(education);
	}

	@Transactional
	public ExperienceResponse addExperience(ExperienceRequest request) {
		Experience experience = new Experience();
		experience.setCandidateProfile(getCurrentProfile());
		applyExperienceRequest(experience, request);
		return toExperienceResponse(experienceRepository.save(experience));
	}

	@Transactional(readOnly = true)
	public List<ExperienceResponse> getExperiences() {
		CandidateProfile profile = getCurrentProfile();
		return experienceRepository.findByCandidateProfileIdOrderByIdAsc(profile.getId()).stream()
				.map(this::toExperienceResponse)
				.toList();
	}

	@Transactional
	public ExperienceResponse updateExperience(Long experienceId, ExperienceRequest request) {
		CandidateProfile profile = getCurrentProfile();
		Experience experience = experienceRepository.findByIdAndCandidateProfileId(experienceId, profile.getId())
				.orElseThrow(() -> new ResourceNotFoundException("Experience record not found"));
		applyExperienceRequest(experience, request);
		return toExperienceResponse(experience);
	}

	@Transactional
	public void deleteExperience(Long experienceId) {
		CandidateProfile profile = getCurrentProfile();
		Experience experience = experienceRepository.findByIdAndCandidateProfileId(experienceId, profile.getId())
				.orElseThrow(() -> new ResourceNotFoundException("Experience record not found"));
		experienceRepository.delete(experience);
	}

	@Transactional
	public SkillResponse addSkill(SkillRequest request) {
		CandidateProfile profile = getCurrentProfile();
		String name = normalizeSkillName(request.getName());
		Skill skill = skillRepository.findByName(name).orElseGet(() -> createSkill(name));

		boolean alreadyAdded = profile.getSkills().stream().anyMatch(existing -> existing.getId().equals(skill.getId()));
		if (alreadyAdded) {
			throw new DuplicateResourceException("Skill is already associated with this profile");
		}

		profile.getSkills().add(skill);
		return toSkillResponse(skill);
	}

	@Transactional(readOnly = true)
	public List<SkillResponse> getSkills() {
		return getCurrentProfile().getSkills().stream()
				.sorted(Comparator.comparing(Skill::getName, String.CASE_INSENSITIVE_ORDER))
				.map(this::toSkillResponse)
				.toList();
	}

	@Transactional
	public void removeSkill(Long skillId) {
		CandidateProfile profile = getCurrentProfile();
		boolean removed = profile.getSkills().removeIf(skill -> skill.getId().equals(skillId));
		if (!removed) {
			throw new ResourceNotFoundException("Skill is not associated with this profile");
		}
	}

	private CandidateProfile getCurrentProfile() {
		User user = currentUserService.getCurrentUser();
		return candidateProfileRepository.findByUserId(user.getId())
				.orElseThrow(() -> new ResourceNotFoundException("Candidate profile not found"));
	}

	private String normalizeSkillName(String rawName) {
		if (rawName == null) {
			throw new BadRequestException("Skill name must not be blank");
		}

		String normalizedName = rawName.trim().toLowerCase(Locale.ROOT);
		if (normalizedName.isBlank()) {
			throw new BadRequestException("Skill name must not be blank");
		}

		return normalizedName;
	}

	private Skill createSkill(String name) {
		Skill newSkill = new Skill();
		newSkill.setName(name);
		try {
			return skillRepository.saveAndFlush(newSkill);
		} catch (DataIntegrityViolationException exception) {
			return skillRepository.findByName(name)
					.orElseThrow(() -> new DuplicateResourceException("Skill already exists"));
		}
	}

	private void applyProfileRequest(CandidateProfile profile, CandidateProfileRequest request) {
		profile.setFullName(request.getFullName().trim());
		profile.setPhone(request.getPhone());
		profile.setResumeUrl(request.getResumeUrl());
	}

	private void applyEducationRequest(Education education, EducationRequest request) {
		education.setInstitution(request.getInstitution().trim());
		education.setDegree(request.getDegree().trim());
		education.setFieldOfStudy(request.getFieldOfStudy());
		education.setStartDate(request.getStartDate());
		education.setEndDate(request.getEndDate());
		education.setCurrentlyStudying(request.getCurrentlyStudying());
	}

	private void applyExperienceRequest(Experience experience, ExperienceRequest request) {
		experience.setCompanyName(request.getCompanyName().trim());
		experience.setJobTitle(request.getJobTitle().trim());
		experience.setDescription(request.getDescription());
		experience.setStartDate(request.getStartDate());
		experience.setEndDate(request.getEndDate());
		experience.setCurrentlyWorking(request.getCurrentlyWorking());
	}

	private CandidateProfileResponse toProfileResponse(CandidateProfile profile) {
		List<EducationResponse> educations = profile.getEducations().stream()
				.sorted(Comparator.comparing(Education::getId))
				.map(this::toEducationResponse)
				.toList();
		List<ExperienceResponse> experiences = profile.getExperiences().stream()
				.sorted(Comparator.comparing(Experience::getId))
				.map(this::toExperienceResponse)
				.toList();
		List<SkillResponse> skills = profile.getSkills().stream()
				.sorted(Comparator.comparing(Skill::getName, String.CASE_INSENSITIVE_ORDER))
				.map(this::toSkillResponse)
				.toList();

		return new CandidateProfileResponse(
				profile.getId(), profile.getFullName(), profile.getPhone(), profile.getResumeUrl(),
				educations, experiences, skills,
				profile.getLinkedInUrl(), profile.getGitHubUrl(), profile.getPortfolioUrl()
		);
	}

	private EducationResponse toEducationResponse(Education education) {
		return new EducationResponse(
				education.getId(), education.getInstitution(), education.getDegree(), education.getFieldOfStudy(),
				education.getStartDate(), education.getEndDate(), education.getCurrentlyStudying()
		);
	}

	private ExperienceResponse toExperienceResponse(Experience experience) {
		return new ExperienceResponse(
				experience.getId(), experience.getCompanyName(), experience.getJobTitle(), experience.getDescription(),
				experience.getStartDate(), experience.getEndDate(), experience.getCurrentlyWorking()
		);
	}

	private SkillResponse toSkillResponse(Skill skill) {
		return new SkillResponse(skill.getId(), skill.getName());
	}
}
