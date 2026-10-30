package com.careerconnect.backend.service.resume.ai;

import java.util.Optional;

import com.careerconnect.backend.service.resume.ai.dto.AiResumeExtractionResult;

/**
 * Provider abstraction for AI-assisted structured resume extraction.
 */
public interface ResumeAiExtractionProvider {

	/**
	 * Returns true if this provider is actively configured and enabled.
	 */
	boolean isEnabled();

	/**
	 * Unique identifier for the provider (e.g. GEMINI, OPENAI, DISABLED).
	 */
	String getProviderName();

	/**
	 * Extracts structured resume data from normalized text content.
	 *
	 * @param normalizedResumeText untrusted resume text content
	 * @return structured result if successful, or empty Optional on failure/disabled
	 */
	Optional<AiResumeExtractionResult> extractStructuredData(String normalizedResumeText);
}
