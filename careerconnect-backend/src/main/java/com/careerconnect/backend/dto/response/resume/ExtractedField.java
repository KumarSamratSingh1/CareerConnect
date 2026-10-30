package com.careerconnect.backend.dto.response.resume;

public record ExtractedField<T>(
		T value,
		String source,
		boolean reviewRequired,
		double confidence
) {
	public static <T> ExtractedField<T> of(T value, String source, double confidence, boolean reviewRequired) {
		return new ExtractedField<>(value, source, reviewRequired, confidence);
	}

	public static <T> ExtractedField<T> of(T value, double confidence, boolean reviewRequired) {
		return new ExtractedField<>(value, "RULE_BASED", reviewRequired, confidence);
	}

	public static <T> ExtractedField<T> of(T value, double confidence) {
		return new ExtractedField<>(value, "RULE_BASED", false, confidence);
	}

	public static <T> ExtractedField<T> empty() {
		return new ExtractedField<>(null, "RULE_BASED", false, 0.0);
	}
}
