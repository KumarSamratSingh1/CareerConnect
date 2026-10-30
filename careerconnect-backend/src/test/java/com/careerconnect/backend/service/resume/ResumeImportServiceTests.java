package com.careerconnect.backend.service.resume;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.careerconnect.backend.dto.request.resume.CertificationImportItem;
import com.careerconnect.backend.dto.request.resume.EducationImportItem;
import com.careerconnect.backend.dto.request.resume.ExperienceImportItem;
import com.careerconnect.backend.dto.request.resume.PersonalDetailsImportRequest;
import com.careerconnect.backend.dto.request.resume.ProjectImportItem;
import com.careerconnect.backend.dto.request.resume.ResumeImportRequest;
import com.careerconnect.backend.dto.request.resume.SkillImportItem;
import com.careerconnect.backend.dto.request.resume.SocialLinksImportRequest;
import com.careerconnect.backend.dto.response.resume.ResumeImportResponse;
import com.careerconnect.backend.entity.CandidateProfile;
import com.careerconnect.backend.entity.Education;
import com.careerconnect.backend.entity.Experience;
import com.careerconnect.backend.entity.Skill;
import com.careerconnect.backend.entity.User;
import com.careerconnect.backend.exception.ResourceNotFoundException;
import com.careerconnect.backend.repository.CandidateProfileRepository;
import com.careerconnect.backend.repository.CertificationRepository;
import com.careerconnect.backend.repository.EducationRepository;
import com.careerconnect.backend.repository.ExperienceRepository;
import com.careerconnect.backend.repository.ProjectRepository;
import com.careerconnect.backend.repository.SkillRepository;
import com.careerconnect.backend.service.CurrentUserService;

class ResumeImportServiceTests {

	private CurrentUserService currentUserService;
	private CandidateProfileRepository candidateProfileRepository;
	private EducationRepository educationRepository;
	private ExperienceRepository experienceRepository;
	private SkillRepository skillRepository;
	private ProjectRepository projectRepository;
	private CertificationRepository certificationRepository;
	private ResumeImportService service;

	private User user;
	private CandidateProfile profile;

	@BeforeEach
	void setUp() {
		currentUserService = mock(CurrentUserService.class);
		candidateProfileRepository = mock(CandidateProfileRepository.class);
		educationRepository = mock(EducationRepository.class);
		experienceRepository = mock(ExperienceRepository.class);
		skillRepository = mock(SkillRepository.class);
		projectRepository = mock(ProjectRepository.class);
		certificationRepository = mock(CertificationRepository.class);

		service = new ResumeImportService(
				currentUserService,
				candidateProfileRepository,
				educationRepository,
				experienceRepository,
				skillRepository,
				projectRepository,
				certificationRepository
		);

		user = new User();
		user.setId(42L);
		user.setEmail("candidate@example.com");

		profile = new CandidateProfile();
		profile.setId(100L);
		profile.setUser(user);
		profile.setFullName("Original Name");
		profile.setPhone("9999999999");
		profile.setSkills(new HashSet<>());
		profile.setEducations(new ArrayList<>());
		profile.setExperiences(new ArrayList<>());
		profile.setProjects(new ArrayList<>());
		profile.setCertifications(new ArrayList<>());

		when(currentUserService.getCurrentUser()).thenReturn(user);
		when(candidateProfileRepository.findByUserId(42L)).thenReturn(Optional.of(profile));
	}

	@Test
	void throwsResourceNotFoundWhenProfileMissing() {
		when(candidateProfileRepository.findByUserId(42L)).thenReturn(Optional.empty());

		ResumeImportRequest request = new ResumeImportRequest();
		assertThrows(ResourceNotFoundException.class, () -> service.importResume(request));
	}

	@Test
	void importsValidCandidateDraftSuccessfully() {
		ResumeImportRequest request = new ResumeImportRequest();

		// Educations
		EducationImportItem edu = new EducationImportItem();
		edu.setSelected(true);
		edu.setInstitution("MIT");
		edu.setDegree("B.S.");
		edu.setFieldOfStudy("Computer Science");
		edu.setStartDate(LocalDate.of(2018, 9, 1));
		edu.setEndDate(LocalDate.of(2022, 5, 31));
		edu.setCurrentlyStudying(false);
		request.setEducations(List.of(edu));

		// Experiences
		ExperienceImportItem exp = new ExperienceImportItem();
		exp.setSelected(true);
		exp.setCompanyName("Acme Corp");
		exp.setJobTitle("Software Engineer");
		exp.setDescription("Backend services in Java");
		exp.setStartDate(LocalDate.of(2022, 6, 1));
		exp.setCurrentlyWorking(true);
		request.setExperiences(List.of(exp));

		// Skills
		SkillImportItem skill = new SkillImportItem();
		skill.setSelected(true);
		skill.setName("Java");
		request.setSkills(List.of(skill));

		// Projects
		ProjectImportItem project = new ProjectImportItem();
		project.setSelected(true);
		project.setTitle("CareerConnect");
		project.setDescription("Job portal system");
		project.setTechnologies(List.of("Java", "Spring Boot", "React"));
		request.setProjects(List.of(project));

		// Certifications
		CertificationImportItem cert = new CertificationImportItem();
		cert.setSelected(true);
		cert.setName("AWS Certified Developer");
		cert.setIssuingOrganization("Amazon Web Services");
		request.setCertifications(List.of(cert));

		when(educationRepository.findByCandidateProfileIdOrderByIdAsc(100L)).thenReturn(Collections.emptyList());
		when(experienceRepository.findByCandidateProfileIdOrderByIdAsc(100L)).thenReturn(Collections.emptyList());
		when(projectRepository.findByCandidateProfileIdOrderByIdAsc(100L)).thenReturn(Collections.emptyList());
		when(certificationRepository.findByCandidateProfileIdOrderByIdAsc(100L)).thenReturn(Collections.emptyList());
		when(skillRepository.findByName("java")).thenReturn(Optional.empty());
		when(skillRepository.save(any(Skill.class))).thenAnswer(invocation -> invocation.getArgument(0));

		ResumeImportResponse response = service.importResume(request);

		assertEquals(1, response.educations().imported());
		assertEquals(1, response.experiences().imported());
		assertEquals(1, response.skills().imported());
		assertEquals(1, response.projects().imported());
		assertEquals(1, response.certifications().imported());
		assertTrue(response.errors().isEmpty());

		verify(educationRepository).saveAll(any());
		verify(experienceRepository).saveAll(any());
		verify(projectRepository).saveAll(any());
		verify(certificationRepository).saveAll(any());
		verify(candidateProfileRepository).save(profile);
	}

	@Test
	void unselectedItemsAreIgnored() {
		ResumeImportRequest request = new ResumeImportRequest();

		EducationImportItem edu = new EducationImportItem();
		edu.setSelected(false);
		edu.setInstitution("MIT");
		edu.setDegree("B.S.");
		request.setEducations(List.of(edu));

		ResumeImportResponse response = service.importResume(request);

		assertEquals(0, response.educations().requested());
		assertEquals(0, response.educations().imported());
		assertEquals(0, response.educations().skipped());
	}

	@Test
	void personalDetailsOverwriteBlockedWithoutApproval() {
		ResumeImportRequest request = new ResumeImportRequest();
		PersonalDetailsImportRequest pd = new PersonalDetailsImportRequest();
		pd.setFullName("New Different Name");
		request.setPersonalDetails(pd);
		request.setApprovePersonalDetailsOverwrite(false);

		ResumeImportResponse response = service.importResume(request);

		assertEquals(1, response.personalDetails().requested());
		assertEquals(0, response.personalDetails().imported());
		assertEquals(1, response.personalDetails().skipped());
		assertEquals("Original Name", profile.getFullName());
		assertFalse(response.errors().isEmpty());
	}

	@Test
	void personalDetailsOverwriteAllowedWithApproval() {
		ResumeImportRequest request = new ResumeImportRequest();
		PersonalDetailsImportRequest pd = new PersonalDetailsImportRequest();
		pd.setFullName("New Different Name");
		request.setPersonalDetails(pd);
		request.setApprovePersonalDetailsOverwrite(true);

		ResumeImportResponse response = service.importResume(request);

		assertEquals(1, response.personalDetails().requested());
		assertEquals(1, response.personalDetails().imported());
		assertEquals(0, response.personalDetails().skipped());
		assertEquals("New Different Name", profile.getFullName());
	}

	@Test
	void duplicateDetectionSkipsExistingEducationAndWithinRequestDuplicate() {
		ResumeImportRequest request = new ResumeImportRequest();

		Education existing = new Education();
		existing.setInstitution("Harvard");
		existing.setDegree("B.A.");
		existing.setFieldOfStudy("Economics");
		existing.setStartDate(LocalDate.of(2015, 9, 1));
		existing.setEndDate(LocalDate.of(2019, 5, 31));
		existing.setCurrentlyStudying(false);

		when(educationRepository.findByCandidateProfileIdOrderByIdAsc(100L)).thenReturn(List.of(existing));

		// First item: matches existing
		EducationImportItem item1 = new EducationImportItem();
		item1.setSelected(true);
		item1.setInstitution("Harvard ");
		item1.setDegree("B.A.");
		item1.setFieldOfStudy("Economics");
		item1.setStartDate(LocalDate.of(2015, 9, 1));
		item1.setEndDate(LocalDate.of(2019, 5, 31));

		// Second item: new valid
		EducationImportItem item2 = new EducationImportItem();
		item2.setSelected(true);
		item2.setInstitution("Stanford");
		item2.setDegree("M.S.");
		item2.setFieldOfStudy("Computer Science");
		item2.setStartDate(LocalDate.of(2020, 9, 1));
		item2.setEndDate(LocalDate.of(2022, 6, 1));

		// Third item: duplicate within request of item2
		EducationImportItem item3 = new EducationImportItem();
		item3.setSelected(true);
		item3.setInstitution(" Stanford ");
		item3.setDegree("M.S.");
		item3.setFieldOfStudy("Computer Science");
		item3.setStartDate(LocalDate.of(2020, 9, 15)); // same year-month 2020-9
		item3.setEndDate(LocalDate.of(2022, 6, 1));

		request.setEducations(List.of(item1, item2, item3));

		ResumeImportResponse response = service.importResume(request);

		assertEquals(3, response.educations().requested());
		assertEquals(1, response.educations().imported());
		assertEquals(2, response.educations().skipped());
	}

	@Test
	void invalidDateLogicIsDetectedAndSkipped() {
		ResumeImportRequest request = new ResumeImportRequest();

		// Start after end
		EducationImportItem edu1 = new EducationImportItem();
		edu1.setSelected(true);
		edu1.setInstitution("MIT");
		edu1.setDegree("B.S.");
		edu1.setStartDate(LocalDate.of(2023, 1, 1));
		edu1.setEndDate(LocalDate.of(2020, 1, 1));

		// Currently studying but has endDate
		EducationImportItem edu2 = new EducationImportItem();
		edu2.setSelected(true);
		edu2.setInstitution("Caltech");
		edu2.setDegree("Ph.D.");
		edu2.setCurrentlyStudying(true);
		edu2.setEndDate(LocalDate.of(2025, 1, 1));

		request.setEducations(List.of(edu1, edu2));
		when(educationRepository.findByCandidateProfileIdOrderByIdAsc(100L)).thenReturn(Collections.emptyList());

		ResumeImportResponse response = service.importResume(request);

		assertEquals(2, response.educations().requested());
		assertEquals(0, response.educations().imported());
		assertEquals(2, response.educations().skipped());
		assertEquals(2, response.errors().size());
	}

	@Test
	void socialLinksImportRespectsOverwriteProtection() {
		profile.setLinkedInUrl("https://linkedin.com/in/existing");

		ResumeImportRequest req1 = new ResumeImportRequest();
		SocialLinksImportRequest sl1 = new SocialLinksImportRequest();
		sl1.setLinkedIn("https://linkedin.com/in/newurl");
		req1.setSocialLinks(sl1);
		req1.setApproveSocialLinksOverwrite(false);

		ResumeImportResponse res1 = service.importResume(req1);
		assertEquals(0, res1.socialLinks().imported());
		assertEquals(1, res1.socialLinks().skipped());

		// With approval
		ResumeImportRequest req2 = new ResumeImportRequest();
		req2.setSocialLinks(sl1);
		req2.setApproveSocialLinksOverwrite(true);

		ResumeImportResponse res2 = service.importResume(req2);
		assertEquals(1, res2.socialLinks().imported());
		assertEquals("https://linkedin.com/in/newurl", profile.getLinkedInUrl());
	}
}
