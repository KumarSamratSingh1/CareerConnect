package com.careerconnect.backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;

import com.careerconnect.backend.dto.request.CandidateProfileRequest;
import com.careerconnect.backend.dto.request.EducationRequest;
import com.careerconnect.backend.dto.request.ExperienceRequest;
import com.careerconnect.backend.dto.request.SkillRequest;
import com.careerconnect.backend.entity.CandidateProfile;
import com.careerconnect.backend.entity.Skill;
import com.careerconnect.backend.entity.User;
import com.careerconnect.backend.exception.DuplicateResourceException;
import com.careerconnect.backend.exception.ResourceNotFoundException;
import com.careerconnect.backend.repository.CandidateProfileRepository;
import com.careerconnect.backend.repository.EducationRepository;
import com.careerconnect.backend.repository.ExperienceRepository;
import com.careerconnect.backend.repository.SkillRepository;

import org.mockito.Mockito;

class CandidateProfileServiceTests {

	private CurrentUserService currentUserService;
	private CandidateProfileRepository candidateProfileRepository;
	private EducationRepository educationRepository;
	private ExperienceRepository experienceRepository;
	private SkillRepository skillRepository;
	private CandidateProfileService service;

	@BeforeEach
	void setUp() {
		currentUserService = Mockito.mock(CurrentUserService.class);
		candidateProfileRepository = Mockito.mock(CandidateProfileRepository.class);
		educationRepository = Mockito.mock(EducationRepository.class);
		experienceRepository = Mockito.mock(ExperienceRepository.class);
		skillRepository = Mockito.mock(SkillRepository.class);
		service = new CandidateProfileService(currentUserService, candidateProfileRepository, educationRepository,
				experienceRepository, skillRepository);
	}

	@Test
	void candidateCannotCreateDuplicateProfile() {
		User user = user(1L);
		when(currentUserService.getCurrentUser()).thenReturn(user);
		when(candidateProfileRepository.existsByUserId(1L)).thenReturn(true);

		assertThrows(DuplicateResourceException.class, () -> service.createProfile(profileRequest()));
		verify(candidateProfileRepository, never()).saveAndFlush(any());
	}

	@Test
	void candidateProfileUniqueConstraintIsReportedAsDuplicate() {
		User user = user(1L);
		when(currentUserService.getCurrentUser()).thenReturn(user);
		when(candidateProfileRepository.existsByUserId(1L)).thenReturn(false);
		when(candidateProfileRepository.saveAndFlush(any(CandidateProfile.class)))
				.thenThrow(new DataIntegrityViolationException("duplicate user_id"));

		assertThrows(DuplicateResourceException.class, () -> service.createProfile(profileRequest()));
	}

	@Test
	void candidateCannotModifyAnotherCandidatesEducation() {
		CandidateProfile profile = profile(1L, 10L);
		when(currentUserService.getCurrentUser()).thenReturn(user(1L));
		when(candidateProfileRepository.findByUserId(1L)).thenReturn(Optional.of(profile));
		when(educationRepository.findByIdAndCandidateProfileId(99L, 10L)).thenReturn(Optional.empty());

		assertThrows(ResourceNotFoundException.class,
				() -> service.updateEducation(99L, educationRequest()));
	}

	@Test
	void candidateCannotModifyAnotherCandidatesExperience() {
		CandidateProfile profile = profile(1L, 10L);
		when(currentUserService.getCurrentUser()).thenReturn(user(1L));
		when(candidateProfileRepository.findByUserId(1L)).thenReturn(Optional.of(profile));
		when(experienceRepository.findByIdAndCandidateProfileId(99L, 10L)).thenReturn(Optional.empty());

		assertThrows(ResourceNotFoundException.class,
				() -> service.updateExperience(99L, experienceRequest()));
	}

	@Test
	void skillVariantsReuseOneCanonicalSharedSkill() {
		CandidateProfile firstProfile = profile(1L, 10L);
		CandidateProfile secondProfile = profile(2L, 20L);
		CandidateProfile thirdProfile = profile(3L, 30L);
		Skill sharedSkill = new Skill();
		sharedSkill.setId(7L);
		sharedSkill.setName("java");

		when(currentUserService.getCurrentUser()).thenReturn(user(1L), user(2L), user(3L));
		when(candidateProfileRepository.findByUserId(1L)).thenReturn(Optional.of(firstProfile));
		when(candidateProfileRepository.findByUserId(2L)).thenReturn(Optional.of(secondProfile));
		when(candidateProfileRepository.findByUserId(3L)).thenReturn(Optional.of(thirdProfile));
		when(skillRepository.findByName("java"))
				.thenReturn(Optional.empty(), Optional.of(sharedSkill), Optional.of(sharedSkill));
		when(skillRepository.saveAndFlush(any(Skill.class))).thenAnswer(invocation -> {
			return sharedSkill;
		});

		service.addSkill(skillRequest("Java"));
		service.addSkill(skillRequest("JAVA"));
		service.addSkill(skillRequest(" java "));

		assertEquals("java", firstProfile.getSkills().iterator().next().getName());
		assertSame(firstProfile.getSkills().iterator().next(), secondProfile.getSkills().iterator().next());
		assertSame(firstProfile.getSkills().iterator().next(), thirdProfile.getSkills().iterator().next());
		verify(skillRepository).saveAndFlush(any(Skill.class));
	}

	@Test
	void candidateCannotAddTheSameCanonicalSkillTwice() {
		CandidateProfile profile = profile(1L, 10L);
		Skill sharedSkill = new Skill();
		sharedSkill.setId(7L);
		sharedSkill.setName("java");
		when(currentUserService.getCurrentUser()).thenReturn(user(1L), user(1L));
		when(candidateProfileRepository.findByUserId(1L)).thenReturn(Optional.of(profile));
		when(skillRepository.findByName("java")).thenReturn(Optional.of(sharedSkill));

		service.addSkill(skillRequest("Java"));

		assertThrows(DuplicateResourceException.class, () -> service.addSkill(skillRequest(" JAVA ")));
		verify(skillRepository, never()).saveAndFlush(any(Skill.class));
	}

	private User user(Long id) {
		User user = new User();
		user.setId(id);
		user.setEmail("user" + id + "@example.com");
		return user;
	}

	private CandidateProfile profile(Long userId, Long profileId) {
		CandidateProfile profile = new CandidateProfile();
		profile.setId(profileId);
		profile.setUser(user(userId));
		return profile;
	}

	private CandidateProfileRequest profileRequest() {
		CandidateProfileRequest request = new CandidateProfileRequest();
		request.setFullName("Candidate User");
		return request;
	}

	private EducationRequest educationRequest() {
		EducationRequest request = new EducationRequest();
		request.setInstitution("Example University");
		request.setDegree("BSc");
		request.setCurrentlyStudying(false);
		return request;
	}

	private ExperienceRequest experienceRequest() {
		ExperienceRequest request = new ExperienceRequest();
		request.setCompanyName("Example Company");
		request.setJobTitle("Developer");
		request.setCurrentlyWorking(false);
		return request;
	}

	private SkillRequest skillRequest(String name) {
		SkillRequest request = new SkillRequest();
		request.setName(name);
		return request;
	}
}
