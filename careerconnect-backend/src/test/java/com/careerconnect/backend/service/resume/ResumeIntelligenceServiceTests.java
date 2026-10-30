package com.careerconnect.backend.service.resume;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import com.careerconnect.backend.common.enums.Role;
import com.careerconnect.backend.dto.response.resume.ExtractedField;
import com.careerconnect.backend.dto.response.resume.ExtractedSocialLinksDto;
import com.careerconnect.backend.dto.response.resume.ExtractionMetadataDto;
import com.careerconnect.backend.dto.response.resume.PersonalDetailsDto;
import com.careerconnect.backend.dto.response.resume.ResumeDraftResponse;
import com.careerconnect.backend.entity.User;
import com.careerconnect.backend.exception.UnauthorizedActionException;
import com.careerconnect.backend.service.CurrentUserService;
import com.careerconnect.backend.service.resume.ai.ResumeAiExtractionProvider;
import com.careerconnect.backend.service.resume.ai.dto.AiPersonalDetails;
import com.careerconnect.backend.service.resume.ai.dto.AiResumeExtractionResult;

class ResumeIntelligenceServiceTests {

	private CurrentUserService currentUserService;
	private ResumeFileValidator resumeFileValidator;
	private DocumentParserService documentParserService;
	private RuleBasedResumeExtractor ruleBasedResumeExtractor;
	private ResumeAiExtractionProvider resumeAiExtractionProvider;
	private HybridResumeMergeService hybridResumeMergeService;
	private ResumeIntelligenceService service;

	@BeforeEach
	void setUp() {
		currentUserService = mock(CurrentUserService.class);
		resumeFileValidator = mock(ResumeFileValidator.class);
		documentParserService = mock(DocumentParserService.class);
		ruleBasedResumeExtractor = mock(RuleBasedResumeExtractor.class);
		resumeAiExtractionProvider = mock(ResumeAiExtractionProvider.class);
		hybridResumeMergeService = mock(HybridResumeMergeService.class);

		service = new ResumeIntelligenceService(
				currentUserService,
				resumeFileValidator,
				documentParserService,
				ruleBasedResumeExtractor,
				resumeAiExtractionProvider,
				hybridResumeMergeService
		);
	}

	private ResumeDraftResponse createMockBaseline() {
		return new ResumeDraftResponse(
				new PersonalDetailsDto(
						ExtractedField.of("John Doe", 0.85),
						ExtractedField.of("john@example.com", 0.95),
						ExtractedField.empty(),
						ExtractedField.empty()
				),
				ExtractedField.empty(),
				Collections.emptyList(),
				Collections.emptyList(),
				Collections.emptyList(),
				Collections.emptyList(),
				Collections.emptyList(),
				new ExtractedSocialLinksDto(ExtractedField.empty(), ExtractedField.empty(), ExtractedField.empty()),
				new ArrayList<>(),
				new ExtractionMetadataDto("resume.pdf", "PDF", 100L, 50, "DETERMINISTIC_RULE_BASED", LocalDateTime.now())
		);
	}

	@Test
	void candidateCanParseResumeWithAiDisabledReturnsDeterministic() {
		User candidate = new User();
		candidate.setId(10L);
		candidate.setEmail("candidate@example.com");
		candidate.setRole(Role.CANDIDATE);

		when(currentUserService.getCurrentUser()).thenReturn(candidate);
		when(resumeAiExtractionProvider.isEnabled()).thenReturn(false);

		MockMultipartFile file = new MockMultipartFile("file", "resume.pdf", "application/pdf", "%PDF-1.4 sample".getBytes());
		ResumeFileValidator.ValidatedFile meta = new ResumeFileValidator.ValidatedFile(
				ResumeFileValidator.DocumentFormat.PDF, "resume.pdf", 100L
		);

		when(resumeFileValidator.validate(file)).thenReturn(meta);
		when(documentParserService.parseDocument(file, ResumeFileValidator.DocumentFormat.PDF))
				.thenReturn(new DocumentParserService.ParsedDocumentResult("Resume Text", Collections.emptyList()));
		when(ruleBasedResumeExtractor.extract(eq("Resume Text"), eq(meta), any()))
				.thenReturn(createMockBaseline());

		ResumeDraftResponse response = service.parseResume(file);

		assertNotNull(response);
		assertEquals("DETERMINISTIC_RULE_BASED", response.extractionMetadata().extractionMethod());
		verify(resumeAiExtractionProvider, never()).extractStructuredData(any());
		verify(hybridResumeMergeService, never()).merge(any(), any(), any());
	}

	@Test
	void candidateCanParseResumeWhenAiProviderNullGracefullyFallsBackToDeterministic() {
		User candidate = new User();
		candidate.setId(10L);
		candidate.setEmail("candidate@example.com");
		candidate.setRole(Role.CANDIDATE);

		when(currentUserService.getCurrentUser()).thenReturn(candidate);

		ResumeIntelligenceService serviceWithNullProvider = new ResumeIntelligenceService(
				currentUserService,
				resumeFileValidator,
				documentParserService,
				ruleBasedResumeExtractor,
				null,
				hybridResumeMergeService
		);

		MockMultipartFile file = new MockMultipartFile("file", "resume.pdf", "application/pdf", "%PDF-1.4 sample".getBytes());
		ResumeFileValidator.ValidatedFile meta = new ResumeFileValidator.ValidatedFile(
				ResumeFileValidator.DocumentFormat.PDF, "resume.pdf", 100L
		);

		when(resumeFileValidator.validate(file)).thenReturn(meta);
		when(documentParserService.parseDocument(file, ResumeFileValidator.DocumentFormat.PDF))
				.thenReturn(new DocumentParserService.ParsedDocumentResult("Resume Text", Collections.emptyList()));
		when(ruleBasedResumeExtractor.extract(eq("Resume Text"), eq(meta), any()))
				.thenReturn(createMockBaseline());

		ResumeDraftResponse response = serviceWithNullProvider.parseResume(file);

		assertNotNull(response);
		assertEquals("DETERMINISTIC_RULE_BASED", response.extractionMetadata().extractionMethod());
		verify(hybridResumeMergeService, never()).merge(any(), any(), any());
	}

	@Test
	void candidateCanParseResumeWithAiSuccessReturnsHybridMerged() {
		User candidate = new User();
		candidate.setId(10L);
		candidate.setEmail("candidate@example.com");
		candidate.setRole(Role.CANDIDATE);

		when(currentUserService.getCurrentUser()).thenReturn(candidate);
		when(resumeAiExtractionProvider.isEnabled()).thenReturn(true);

		MockMultipartFile file = new MockMultipartFile("file", "resume.pdf", "application/pdf", "%PDF-1.4 sample".getBytes());
		ResumeFileValidator.ValidatedFile meta = new ResumeFileValidator.ValidatedFile(
				ResumeFileValidator.DocumentFormat.PDF, "resume.pdf", 100L
		);

		ResumeDraftResponse baseline = createMockBaseline();
		AiResumeExtractionResult aiResult = new AiResumeExtractionResult(
				new AiPersonalDetails("John Doe", "john@example.com", "+1-555-0199", "NYC"),
				"Summary", List.of(), List.of(), List.of(), List.of(), List.of(), null
		);

		ResumeDraftResponse mergedResponse = new ResumeDraftResponse(
				baseline.personalDetails(),
				ExtractedField.of("Summary", "HYBRID_AI", 0.85, false),
				baseline.skills(),
				baseline.educations(),
				baseline.experiences(),
				baseline.projects(),
				baseline.certifications(),
				baseline.socialLinks(),
				baseline.warnings(),
				new ExtractionMetadataDto("resume.pdf", "PDF", 100L, 50, "HYBRID_RULE_AND_AI", LocalDateTime.now())
		);

		when(resumeFileValidator.validate(file)).thenReturn(meta);
		when(documentParserService.parseDocument(file, ResumeFileValidator.DocumentFormat.PDF))
				.thenReturn(new DocumentParserService.ParsedDocumentResult("Resume Text", Collections.emptyList()));
		when(ruleBasedResumeExtractor.extract(eq("Resume Text"), eq(meta), any())).thenReturn(baseline);
		when(resumeAiExtractionProvider.extractStructuredData("Resume Text")).thenReturn(Optional.of(aiResult));
		when(hybridResumeMergeService.merge(baseline, aiResult, "Resume Text")).thenReturn(mergedResponse);

		ResumeDraftResponse response = service.parseResume(file);

		assertNotNull(response);
		assertEquals("HYBRID_RULE_AND_AI", response.extractionMetadata().extractionMethod());
		verify(resumeAiExtractionProvider).extractStructuredData("Resume Text");
		verify(hybridResumeMergeService).merge(baseline, aiResult, "Resume Text");
	}

	@Test
	void candidateParseResumeWithAiErrorGracefullyFallsBack() {
		User candidate = new User();
		candidate.setId(10L);
		candidate.setEmail("candidate@example.com");
		candidate.setRole(Role.CANDIDATE);

		when(currentUserService.getCurrentUser()).thenReturn(candidate);
		when(resumeAiExtractionProvider.isEnabled()).thenReturn(true);

		MockMultipartFile file = new MockMultipartFile("file", "resume.pdf", "application/pdf", "%PDF-1.4 sample".getBytes());
		ResumeFileValidator.ValidatedFile meta = new ResumeFileValidator.ValidatedFile(
				ResumeFileValidator.DocumentFormat.PDF, "resume.pdf", 100L
		);

		ResumeDraftResponse baseline = createMockBaseline();

		when(resumeFileValidator.validate(file)).thenReturn(meta);
		when(documentParserService.parseDocument(file, ResumeFileValidator.DocumentFormat.PDF))
				.thenReturn(new DocumentParserService.ParsedDocumentResult("Resume Text", Collections.emptyList()));
		when(ruleBasedResumeExtractor.extract(eq("Resume Text"), eq(meta), any())).thenReturn(baseline);
		when(resumeAiExtractionProvider.extractStructuredData("Resume Text")).thenThrow(new RuntimeException("Simulated timeout"));

		ResumeDraftResponse response = service.parseResume(file);

		assertNotNull(response);
		assertEquals("HYBRID_AI_FALLBACK", response.extractionMetadata().extractionMethod());
		assertTrue(response.warnings().stream().anyMatch(w -> w.contains("AI enhancement encountered an error")));
	}

	@Test
	void candidateParseResumeWithEmptyAiResultGracefullyFallsBack() {
		User candidate = new User();
		candidate.setId(10L);
		candidate.setEmail("candidate@example.com");
		candidate.setRole(Role.CANDIDATE);

		when(currentUserService.getCurrentUser()).thenReturn(candidate);
		when(resumeAiExtractionProvider.isEnabled()).thenReturn(true);

		MockMultipartFile file = new MockMultipartFile("file", "resume.pdf", "application/pdf", "%PDF-1.4 sample".getBytes());
		ResumeFileValidator.ValidatedFile meta = new ResumeFileValidator.ValidatedFile(
				ResumeFileValidator.DocumentFormat.PDF, "resume.pdf", 100L
		);

		ResumeDraftResponse baseline = createMockBaseline();

		when(resumeFileValidator.validate(file)).thenReturn(meta);
		when(documentParserService.parseDocument(file, ResumeFileValidator.DocumentFormat.PDF))
				.thenReturn(new DocumentParserService.ParsedDocumentResult("Resume Text", Collections.emptyList()));
		when(ruleBasedResumeExtractor.extract(eq("Resume Text"), eq(meta), any())).thenReturn(baseline);
		when(resumeAiExtractionProvider.extractStructuredData("Resume Text")).thenReturn(Optional.empty());

		ResumeDraftResponse response = service.parseResume(file);

		assertNotNull(response);
		assertEquals("HYBRID_AI_FALLBACK", response.extractionMetadata().extractionMethod());
		assertTrue(response.warnings().stream().anyMatch(w -> w.contains("AI enhancement was unavailable or returned empty data")));
	}

	@Test
	void recruiterCannotAccessResumeParser() {
		User recruiter = new User();
		recruiter.setId(20L);
		recruiter.setEmail("recruiter@example.com");
		recruiter.setRole(Role.RECRUITER);

		when(currentUserService.getCurrentUser()).thenReturn(recruiter);

		MockMultipartFile file = new MockMultipartFile("file", "resume.pdf", "application/pdf", new byte[10]);

		assertThrows(UnauthorizedActionException.class, () -> service.parseResume(file));
		verify(resumeFileValidator, never()).validate(any());
	}

	@Test
	void adminCannotAccessResumeParser() {
		User admin = new User();
		admin.setId(1L);
		admin.setEmail("admin@careerconnect.com");
		admin.setRole(Role.ADMIN);

		when(currentUserService.getCurrentUser()).thenReturn(admin);

		MockMultipartFile file = new MockMultipartFile("file", "resume.pdf", "application/pdf", new byte[10]);

		assertThrows(UnauthorizedActionException.class, () -> service.parseResume(file));
		verify(resumeFileValidator, never()).validate(any());
	}

	@Test
	void unauthenticatedUserThrowsUnauthorized() {
		when(currentUserService.getCurrentUser()).thenThrow(new UnauthorizedActionException("Authentication is required"));

		MockMultipartFile file = new MockMultipartFile("file", "resume.pdf", "application/pdf", new byte[10]);

		assertThrows(UnauthorizedActionException.class, () -> service.parseResume(file));
		verify(resumeFileValidator, never()).validate(any());
	}
}
