package com.careerconnect.backend.service.resume;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.careerconnect.backend.common.enums.Role;
import com.careerconnect.backend.dto.response.resume.ExtractionMetadataDto;
import com.careerconnect.backend.dto.response.resume.ResumeDraftResponse;
import com.careerconnect.backend.entity.User;
import com.careerconnect.backend.exception.UnauthorizedActionException;
import com.careerconnect.backend.service.CurrentUserService;
import com.careerconnect.backend.service.resume.ai.ResumeAiExtractionProvider;
import com.careerconnect.backend.service.resume.ai.dto.AiResumeExtractionResult;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ResumeIntelligenceService {

	private static final Logger log = LoggerFactory.getLogger(ResumeIntelligenceService.class);

	private final CurrentUserService currentUserService;
	private final ResumeFileValidator resumeFileValidator;
	private final DocumentParserService documentParserService;
	private final RuleBasedResumeExtractor ruleBasedResumeExtractor;
	private final ResumeAiExtractionProvider resumeAiExtractionProvider;
	private final HybridResumeMergeService hybridResumeMergeService;

	/**
	 * Parses a candidate's resume (PDF/DOCX) in memory and generates a reviewable draft.
	 * 
	 * Privacy and Architectural Guarantees:
	 * - Temporary, in-memory processing only.
	 * - No permanent file upload or public URL generated.
	 * - Does NOT alter the CandidateProfile or user account.
	 * - Candidate identity derived strictly from Spring Security context.
	 * - Hybrid pipeline: Deterministic extraction baseline -> Optional AI enhancement -> Bounded fallback.
	 */
	public ResumeDraftResponse parseResume(MultipartFile file) {
		User candidateUser = currentUserService.getCurrentUser();
		if (candidateUser.getRole() != Role.CANDIDATE) {
			throw new UnauthorizedActionException("Only candidates can access resume intelligence features");
		}

		// 1. Validate file (type, magic bytes, size, path safety)
		ResumeFileValidator.ValidatedFile validated = resumeFileValidator.validate(file);

		// 2. Parse document text safely in memory
		DocumentParserService.ParsedDocumentResult parsed = documentParserService.parseDocument(file, validated.format());

		// 3. Extract structured draft using deterministic rule-based heuristics (baseline)
		ResumeDraftResponse draftResponse = ruleBasedResumeExtractor.extract(
				parsed.text(),
				validated,
				parsed.warnings()
		);

		// 4. Optional AI Enhancement (Hybrid Pipeline with bounded fallback)
		if (resumeAiExtractionProvider != null && resumeAiExtractionProvider.isEnabled()) {
			try {
				Optional<AiResumeExtractionResult> aiResultOpt = resumeAiExtractionProvider.extractStructuredData(parsed.text());
				if (aiResultOpt.isPresent()) {
					draftResponse = hybridResumeMergeService.merge(draftResponse, aiResultOpt.get(), parsed.text());
				} else {
					draftResponse = withAiFallback(
							draftResponse,
							"AI enhancement was unavailable or returned empty data. Retained deterministic rule-based draft."
					);
				}
			} catch (Exception e) {
				log.warn("AI enhancement failed: {}", e.getMessage());
				draftResponse = withAiFallback(
						draftResponse,
						"AI enhancement encountered an error (" + e.getClass().getSimpleName() + "). Retained deterministic rule-based draft."
				);
			}
		}

		// Telemetry: Log only safe operational metrics, never private candidate details or raw resume text
		log.info("Candidate user ID {} parsed resume draft: file={}, format={}, sizeBytes={}, method={}, skillsFound={}, warningsCount={}",
				candidateUser.getId(),
				validated.sanitizedFileName(),
				validated.format(),
				validated.sizeBytes(),
				draftResponse.extractionMetadata().extractionMethod(),
				draftResponse.skills().size(),
				draftResponse.warnings().size());

		return draftResponse;
	}

	private ResumeDraftResponse withAiFallback(ResumeDraftResponse baseline, String fallbackWarning) {
		List<String> warnings = new ArrayList<>(baseline.warnings());
		warnings.add(fallbackWarning);

		ExtractionMetadataDto meta = baseline.extractionMetadata();
		ExtractionMetadataDto fallbackMeta = new ExtractionMetadataDto(
				meta.fileName(),
				meta.fileType(),
				meta.fileSizeBytes(),
				meta.characterCount(),
				"HYBRID_AI_FALLBACK",
				meta.processedAt()
		);

		return new ResumeDraftResponse(
				baseline.personalDetails(),
				baseline.professionalSummary(),
				baseline.skills(),
				baseline.educations(),
				baseline.experiences(),
				baseline.projects(),
				baseline.certifications(),
				baseline.socialLinks(),
				warnings,
				fallbackMeta
		);
	}
}
