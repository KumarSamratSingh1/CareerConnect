package com.careerconnect.backend.service.resume.ai;

import java.util.Optional;

import com.careerconnect.backend.service.resume.ai.dto.AiResumeExtractionResult;

/**
 * Fallback provider when AI assistance is disabled or unconfigured.
 */
public class DisabledResumeAiProvider implements ResumeAiExtractionProvider {

	@Override
	public boolean isEnabled() {
		return false;
	}

	@Override
	public String getProviderName() {
		return "DISABLED";
	}

	@Override
	public Optional<AiResumeExtractionResult> extractStructuredData(String normalizedResumeText) {
		return Optional.empty();
	}
}
