package com.careerconnect.backend.service.resume;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.careerconnect.backend.dto.response.resume.ExtractedCertificationDto;
import com.careerconnect.backend.dto.response.resume.ExtractedEducationDto;
import com.careerconnect.backend.dto.response.resume.ExtractedExperienceDto;
import com.careerconnect.backend.dto.response.resume.ExtractedField;
import com.careerconnect.backend.dto.response.resume.ExtractedProjectDto;
import com.careerconnect.backend.dto.response.resume.ExtractedSkillDto;
import com.careerconnect.backend.dto.response.resume.ExtractedSocialLinksDto;
import com.careerconnect.backend.dto.response.resume.ExtractionMetadataDto;
import com.careerconnect.backend.dto.response.resume.PersonalDetailsDto;
import com.careerconnect.backend.dto.response.resume.ResumeDraftResponse;
import com.careerconnect.backend.service.resume.ai.dto.AiCertification;
import com.careerconnect.backend.service.resume.ai.dto.AiEducation;
import com.careerconnect.backend.service.resume.ai.dto.AiExperience;
import com.careerconnect.backend.service.resume.ai.dto.AiPersonalDetails;
import com.careerconnect.backend.service.resume.ai.dto.AiProject;
import com.careerconnect.backend.service.resume.ai.dto.AiResumeExtractionResult;
import com.careerconnect.backend.service.resume.ai.dto.AiSkill;
import com.careerconnect.backend.service.resume.ai.dto.AiSocialLinks;

class HybridResumeMergeServiceTests {

	private HybridResumeMergeService mergeService;

	@BeforeEach
	void setUp() {
		mergeService = new HybridResumeMergeService();
	}

	private ResumeDraftResponse createBaselineDraft() {
		PersonalDetailsDto personal = new PersonalDetailsDto(
				ExtractedField.of("John Doe", "DETERMINISTIC_RULE_BASED", 0.85, false),
				ExtractedField.of("john.doe@example.com", "DETERMINISTIC_RULE_BASED", 0.95, false),
				ExtractedField.of("+1-555-0199", "DETERMINISTIC_RULE_BASED", 0.90, false),
				ExtractedField.empty()
		);

		List<ExtractedSkillDto> skills = new ArrayList<>();
		skills.add(new ExtractedSkillDto("Java", "PROGRAMMING_LANGUAGE", 0.95));
		skills.add(new ExtractedSkillDto("Spring Boot", "FRAMEWORK", 0.95));

		ExtractedSocialLinksDto social = new ExtractedSocialLinksDto(
				ExtractedField.of("https://linkedin.com/in/johndoe", "DETERMINISTIC_RULE_BASED", 0.95, false),
				ExtractedField.empty(),
				ExtractedField.empty()
		);

		ExtractionMetadataDto meta = new ExtractionMetadataDto(
				"resume.pdf", "PDF", 1024L, 500, "DETERMINISTIC_RULE_BASED", LocalDateTime.now()
		);

		return new ResumeDraftResponse(
				personal,
				ExtractedField.empty(),
				skills,
				List.of(),
				List.of(),
				List.of(),
				List.of(),
				social,
				new ArrayList<>(),
				meta
		);
	}

	@Test
	void deterministicAndAiConflictPreservesDeterministicAndFlagsReview() {
		ResumeDraftResponse baseline = createBaselineDraft();

		AiResumeExtractionResult aiResult = new AiResumeExtractionResult(
				new AiPersonalDetails("Jonathan Doe", "john.doe@example.com", "+1-555-9999", "San Francisco, CA"),
				"Senior Software Architect with 8 years experience.",
				List.of(),
				List.of(),
				List.of(),
				List.of(),
				List.of(),
				new AiSocialLinks(null, "https://github.com/johndoe", null)
		);

		ResumeDraftResponse merged = mergeService.merge(baseline, aiResult, "Resume text");

		// Full Name: deterministic preserved, flagged reviewRequired, warning added
		assertEquals("John Doe", merged.personalDetails().fullName().value());
		assertTrue(merged.personalDetails().fullName().reviewRequired());
		assertTrue(merged.warnings().stream().anyMatch(w -> w.contains("differs from AI suggested name ('Jonathan Doe')")));

		// Phone: conflict flagged, deterministic preserved
		assertEquals("+1-555-0199", merged.personalDetails().phone().value());
		assertTrue(merged.personalDetails().phone().reviewRequired());

		// Location: filled in from AI
		assertEquals("San Francisco, CA", merged.personalDetails().location().value());
		assertEquals("HYBRID_AI", merged.personalDetails().location().source());

		// Summary: filled in from AI
		assertEquals("Senior Software Architect with 8 years experience.", merged.professionalSummary().value());
		assertEquals("HYBRID_AI", merged.professionalSummary().source());

		// Social Links: GitHub filled in from AI, LinkedIn preserved
		assertEquals("https://linkedin.com/in/johndoe", merged.socialLinks().linkedIn().value());
		assertEquals("https://github.com/johndoe", merged.socialLinks().gitHub().value());

		// Metadata: updated to HYBRID_RULE_AND_AI
		assertEquals("HYBRID_RULE_AND_AI", merged.extractionMetadata().extractionMethod());
	}

	@Test
	void skillsAreDeduplicatedCaseInsensitively() {
		ResumeDraftResponse baseline = createBaselineDraft();

		AiResumeExtractionResult aiResult = new AiResumeExtractionResult(
				null,
				null,
				List.of(
						new AiSkill("java", "OTHER"),
						new AiSkill("SPRING BOOT", "FRAMEWORK"),
						new AiSkill("Docker", "CLOUD_DEVOPS"),
						new AiSkill("PostgreSQL", "DATABASE")
				),
				List.of(),
				List.of(),
				List.of(),
				List.of(),
				null
		);

		ResumeDraftResponse merged = mergeService.merge(baseline, aiResult, "Resume text");

		assertEquals(4, merged.skills().size());
		// Deterministic "Java" and "Spring Boot" preserved
		assertEquals("Java", merged.skills().get(0).name());
		assertEquals(0.95, merged.skills().get(0).confidence());
		assertEquals("Spring Boot", merged.skills().get(1).name());

		// Newly added from AI
		assertTrue(merged.skills().stream().anyMatch(s -> s.name().equals("Docker") && s.category().equals("CLOUD_DEVOPS")));
		assertTrue(merged.skills().stream().anyMatch(s -> s.name().equals("PostgreSQL") && s.category().equals("DATABASE")));
	}

	@Test
	void partialDatesPreservesOriginalTextWithoutFabricatingDay() {
		ResumeDraftResponse baseline = createBaselineDraft();

		AiResumeExtractionResult aiResult = new AiResumeExtractionResult(
				null,
				null,
				List.of(),
				List.of(
						new AiEducation("MIT", "B.S.", "Computer Science", "2018 - 2022", false)
				),
				List.of(
						new AiExperience("Acme Corp", "Backend Engineer", "Built microservices", "Jan 2022 - Present", true)
				),
				List.of(),
				List.of(),
				null
		);

		ResumeDraftResponse merged = mergeService.merge(baseline, aiResult, "Resume text");

		// Education: Partial date "2018 - 2022" -> no fabricated day 1
		assertEquals(1, merged.educations().size());
		ExtractedEducationDto edu = merged.educations().get(0);
		assertEquals("MIT", edu.institution().value());
		assertEquals("2018 - 2022", edu.rawDateRange());
		assertNull(edu.startDate().value());
		assertNull(edu.endDate().value());
		assertTrue(edu.startDate().reviewRequired());
		assertTrue(edu.endDate().reviewRequired());

		// Experience: Partial date "Jan 2022 - Present" -> currentlyWorking = true, no fabricated day
		assertEquals(1, merged.experiences().size());
		ExtractedExperienceDto exp = merged.experiences().get(0);
		assertEquals("Acme Corp", exp.companyName().value());
		assertEquals("Jan 2022 - Present", exp.rawDateRange());
		assertNull(exp.startDate().value());
		assertNull(exp.endDate().value());
		assertTrue(exp.currentlyWorking().value());

		// Warning generated for partial dates
		assertTrue(merged.warnings().stream().anyMatch(w -> w.contains("Partial date encountered")));
	}

	@Test
	void exactIsoDatesInAiAreDefensiblyParsed() {
		ResumeDraftResponse baseline = createBaselineDraft();

		AiResumeExtractionResult aiResult = new AiResumeExtractionResult(
				null,
				null,
				List.of(),
				List.of(
						new AiEducation("Stanford", "M.S.", "AI", "2020-09-01 to 2022-06-30", false)
				),
				List.of(),
				List.of(),
				List.of(),
				null
		);

		ResumeDraftResponse merged = mergeService.merge(baseline, aiResult, "Resume text");

		assertEquals(1, merged.educations().size());
		ExtractedEducationDto edu = merged.educations().get(0);
		assertEquals(LocalDate.of(2020, 9, 1), edu.startDate().value());
		assertEquals(LocalDate.of(2022, 6, 30), edu.endDate().value());
		assertFalse(edu.startDate().reviewRequired());
		assertFalse(edu.endDate().reviewRequired());
	}

	@Test
	void aiEnrichesProjectsAndCertifications() {
		ResumeDraftResponse baseline = createBaselineDraft();

		AiResumeExtractionResult aiResult = new AiResumeExtractionResult(
				null,
				null,
				List.of(),
				List.of(),
				List.of(),
				List.of(
						new AiProject("CareerConnect", "Full-stack job platform", List.of("Spring Boot", "React"))
				),
				List.of(
						new AiCertification("AWS Solutions Architect", "Amazon Web Services")
				),
				null
		);

		ResumeDraftResponse merged = mergeService.merge(baseline, aiResult, "Resume text");

		assertEquals(1, merged.projects().size());
		ExtractedProjectDto project = merged.projects().get(0);
		assertEquals("CareerConnect", project.title().value());
		assertEquals(List.of("Spring Boot", "React"), project.technologies());

		assertEquals(1, merged.certifications().size());
		ExtractedCertificationDto cert = merged.certifications().get(0);
		assertEquals("AWS Solutions Architect", cert.name().value());
		assertEquals("Amazon Web Services", cert.issuingOrganization().value());
	}
}
