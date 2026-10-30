package com.careerconnect.backend.service.resume;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.careerconnect.backend.dto.response.resume.ResumeDraftResponse;
import com.careerconnect.backend.entity.Skill;
import com.careerconnect.backend.repository.SkillRepository;

class RuleBasedResumeExtractorTests {

	private SkillRepository skillRepository;
	private RuleBasedResumeExtractor extractor;

	@BeforeEach
	void setUp() {
		skillRepository = mock(SkillRepository.class);
		Skill customSkill = new Skill();
		customSkill.setId(99L);
		customSkill.setName("GraphQL");
		when(skillRepository.findAll()).thenReturn(List.of(customSkill));

		extractor = new RuleBasedResumeExtractor(skillRepository);
	}

	@Test
	void extractsFullResumeCorrectly() {
		String resumeText = """
				Alex Morgan
				Email: alex.morgan@example.com | Phone: +1-555-0199
				Location: San Francisco, CA
				https://linkedin.com/in/alexmorgan https://github.com/alexmorgan https://alexmorgan.dev

				PROFESSIONAL SUMMARY
				Experienced Full Stack Software Engineer specializing in scalable microservices and reactive frontends.

				SKILLS
				Java, Spring Boot, React, TypeScript, Docker, Kubernetes, MySQL, PostgreSQL, GraphQL

				EXPERIENCE
				Senior Software Engineer at Acme Corp
				Jan 2021 - Present
				Designed and deployed fault-tolerant distributed services with high availability.

				EDUCATION
				Bachelor of Science in Computer Science
				Stanford University
				2016 - 2020

				PROJECTS
				Cloud Analytics Platform
				Real-time monitoring system processing streaming events using Kafka and React.

				CERTIFICATIONS
				AWS Certified Solutions Architect - Amazon Web Services (AWS)
				""";

		ResumeFileValidator.ValidatedFile meta = new ResumeFileValidator.ValidatedFile(
				ResumeFileValidator.DocumentFormat.PDF, "alex_resume.pdf", 5000L
		);

		ResumeDraftResponse draft = extractor.extract(resumeText, meta, Collections.emptyList());

		assertNotNull(draft);
		assertEquals("Alex Morgan", draft.personalDetails().fullName().value());
		assertEquals("alex.morgan@example.com", draft.personalDetails().email().value());
		assertEquals("+1-555-0199", draft.personalDetails().phone().value());
		assertEquals("San Francisco, CA", draft.personalDetails().location().value());

		assertTrue(draft.professionalSummary().value().contains("Experienced Full Stack Software Engineer"));

		assertEquals("https://linkedin.com/in/alexmorgan", draft.socialLinks().linkedIn().value());
		assertEquals("https://github.com/alexmorgan", draft.socialLinks().gitHub().value());
		assertEquals("https://alexmorgan.dev", draft.socialLinks().portfolio().value());

		// Skills check
		List<String> skillNames = draft.skills().stream().map(s -> s.name().toLowerCase()).toList();
		assertTrue(skillNames.contains("java"));
		assertTrue(skillNames.contains("spring boot"));
		assertTrue(skillNames.contains("react"));
		assertTrue(skillNames.contains("docker"));

		// Experience check
		assertFalse(draft.experiences().isEmpty());
		assertEquals("Acme Corp", draft.experiences().get(0).companyName().value());
		assertEquals("Senior Software Engineer", draft.experiences().get(0).jobTitle().value());
		assertTrue(draft.experiences().get(0).currentlyWorking().value());
		assertEquals("Jan 2021 - Present", draft.experiences().get(0).rawDateRange());

		// Education check
		assertFalse(draft.educations().isEmpty());
		assertEquals("Stanford University", draft.educations().get(0).institution().value());
		assertTrue(draft.educations().get(0).degree().value().contains("Bachelor"));
		assertEquals("2016 - 2020", draft.educations().get(0).rawDateRange());

		// Projects check
		assertFalse(draft.projects().isEmpty());
		assertEquals("Cloud Analytics Platform", draft.projects().get(0).title().value());

		// Certifications check
		assertFalse(draft.certifications().isEmpty());
		assertTrue(draft.certifications().get(0).name().value().contains("AWS Certified Solutions Architect"));
	}

	@Test
	void missingEmailTriggersWarning() {
		String textWithoutEmail = """
				Alex Morgan
				Phone: 555-0199
				SUMMARY
				Senior engineer.
				""";

		ResumeFileValidator.ValidatedFile meta = new ResumeFileValidator.ValidatedFile(
				ResumeFileValidator.DocumentFormat.PDF, "test.pdf", 200L
		);

		ResumeDraftResponse draft = extractor.extract(textWithoutEmail, meta, Collections.emptyList());

		assertNull(draft.personalDetails().email().value());
		assertFalse(draft.warnings().isEmpty());
		assertTrue(draft.warnings().stream().anyMatch(w -> w.contains("No contact email address was found")));
	}

	@Test
	void deduplicatesSkillsWithDifferentCasings() {
		String text = """
				Alex Morgan
				alex@example.com
				SKILLS
				Java, java, JAVA, Spring Boot, spring boot, REACT, React.js
				""";

		ResumeFileValidator.ValidatedFile meta = new ResumeFileValidator.ValidatedFile(
				ResumeFileValidator.DocumentFormat.PDF, "test.pdf", 200L
		);

		ResumeDraftResponse draft = extractor.extract(text, meta, Collections.emptyList());

		List<String> names = draft.skills().stream().map(s -> s.name().toLowerCase()).toList();
		long javaCount = names.stream().filter(n -> n.equals("java")).count();
		assertEquals(1, javaCount, "Java skill must be deduplicated");
	}

	@Test
	void ambiguousDatesPreservesRawTextAndFlagsReviewRequiredWithoutFabricatingDay() {
		String text = """
				Alex Morgan
				alex@example.com
				EDUCATION
				Bachelor of Technology
				Delhi University
				2018 - 2022
				""";

		ResumeFileValidator.ValidatedFile meta = new ResumeFileValidator.ValidatedFile(
				ResumeFileValidator.DocumentFormat.PDF, "test.pdf", 200L
		);

		ResumeDraftResponse draft = extractor.extract(text, meta, Collections.emptyList());

		assertFalse(draft.educations().isEmpty());
		assertEquals("2018 - 2022", draft.educations().get(0).rawDateRange());
		assertNull(draft.educations().get(0).startDate().value(), "Should not invent Day 1 when only year is given");
		assertTrue(draft.educations().get(0).startDate().reviewRequired());
		assertTrue(draft.warnings().stream().anyMatch(w -> w.contains("Partial date encountered")));
	}

	@Test
	void defensibleExactIsoDateParsesLocalDate() {
		String text = """
				Alex Morgan
				alex@example.com
				EDUCATION
				Bachelor of Technology
				Delhi University
				2018-08-01 to 2022-05-31
				""";

		ResumeFileValidator.ValidatedFile meta = new ResumeFileValidator.ValidatedFile(
				ResumeFileValidator.DocumentFormat.PDF, "test.pdf", 200L
		);

		ResumeDraftResponse draft = extractor.extract(text, meta, Collections.emptyList());

		assertFalse(draft.educations().isEmpty());
		assertEquals(LocalDate.of(2018, 8, 1), draft.educations().get(0).startDate().value());
		assertEquals(LocalDate.of(2022, 5, 31), draft.educations().get(0).endDate().value());
	}
}
