package com.careerconnect.backend.service.resume.ai;

import java.time.Duration;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;

import com.careerconnect.backend.service.resume.ai.dto.AiResumeExtractionResult;
import tools.jackson.databind.DeserializationFeature;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

/**
 * Gemini-based implementation of ResumeAiExtractionProvider.
 * Uses structured JSON generation with bounded timeouts and failure isolation.
 */
@Component
public class GeminiResumeAiProvider implements ResumeAiExtractionProvider {

	private static final Logger log = LoggerFactory.getLogger(GeminiResumeAiProvider.class);

	private final boolean enabled;
	private final String apiKey;
	private final String model;
	private final String baseUrl;
	private final int timeoutMs;
	private final RestClient restClient;
	private final ObjectMapper objectMapper;

	@Autowired
	public GeminiResumeAiProvider(
			@Value("${app.resume.ai.enabled:false}") boolean enabled,
			@Value("${app.resume.ai.api-key:}") String apiKey,
			@Value("${app.resume.ai.model:gemini-3.8-flash}") String model,
			@Value("${app.resume.ai.base-url:https://generativelanguage.googleapis.com}") String baseUrl,
			@Value("${app.resume.ai.timeout-ms:8000}") int timeoutMs,
			ObjectMapper objectMapper
	) {
		this.enabled = enabled;
		this.apiKey = apiKey != null ? apiKey.trim() : "";
		this.model = model != null && !model.isBlank() ? model.trim() : "gemini-3.8-flash";
		this.baseUrl = baseUrl != null && !baseUrl.isBlank() ? baseUrl.trim() : "https://generativelanguage.googleapis.com";
		this.timeoutMs = timeoutMs > 0 ? timeoutMs : 8000;
		this.objectMapper = objectMapper;

		SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
		requestFactory.setConnectTimeout(Duration.ofMillis(Math.min(this.timeoutMs, 5000)));
		requestFactory.setReadTimeout(Duration.ofMillis(this.timeoutMs));

		this.restClient = RestClient.builder()
				.baseUrl(this.baseUrl)
				.requestFactory(requestFactory)
				.build();
	}

	// Secondary constructor for testing with custom RestClient
	public GeminiResumeAiProvider(
			boolean enabled,
			String apiKey,
			String model,
			String baseUrl,
			int timeoutMs,
			RestClient restClient,
			ObjectMapper objectMapper
	) {
		this.enabled = enabled;
		this.apiKey = apiKey != null ? apiKey.trim() : "";
		this.model = model != null && !model.isBlank() ? model.trim() : "gemini-3.8-flash";
		this.baseUrl = baseUrl != null && !baseUrl.isBlank() ? baseUrl.trim() : "https://generativelanguage.googleapis.com";
		this.timeoutMs = timeoutMs > 0 ? timeoutMs : 8000;
		this.restClient = restClient;
		this.objectMapper = objectMapper;
	}

	@Override
	public boolean isEnabled() {
		return enabled && !apiKey.isBlank();
	}

	@Override
	public String getProviderName() {
		return "GEMINI";
	}

	@Override
	public Optional<AiResumeExtractionResult> extractStructuredData(String normalizedResumeText) {
		if (!isEnabled()) {
			return Optional.empty();
		}

		if (normalizedResumeText == null || normalizedResumeText.isBlank()) {
			return Optional.empty();
		}

		String prompt = AiPromptBuilder.buildPrompt(normalizedResumeText);

		Map<String, Object> requestBody = Map.of(
				"contents", List.of(
						Map.of(
								"role", "user",
								"parts", List.of(Map.of("text", prompt))
						)
				),
				"generationConfig", Map.of(
						"responseMimeType", "application/json"
				)
		);

		try {
			String endpoint = "/v1beta/models/" + model + ":generateContent";

			String responseBody = restClient.post()
					.uri(endpoint)
					.header("x-goog-api-key", apiKey)
					.contentType(MediaType.APPLICATION_JSON)
					.body(requestBody)
					.retrieve()
					.body(String.class);

			if (responseBody == null || responseBody.isBlank()) {
				log.warn("Gemini AI provider returned an empty response body");
				return Optional.empty();
			}

			String jsonText = extractJsonFromGeminiResponse(responseBody);
			if (jsonText == null || jsonText.isBlank()) {
				log.warn("Gemini AI response contained no valid text candidate");
				return Optional.empty();
			}

			AiResumeExtractionResult result = objectMapper.readValue(jsonText, AiResumeExtractionResult.class);
			return Optional.ofNullable(result);

		} catch (ResourceAccessException e) {
			log.warn("Gemini AI provider request timed out or network error occurred: {}", e.getMessage());
			return Optional.empty();
		} catch (HttpClientErrorException.TooManyRequests e) {
			log.warn("Gemini AI provider rate limit exceeded (429)");
			return Optional.empty();
		} catch (HttpClientErrorException | HttpServerErrorException e) {
			log.warn("Gemini AI provider HTTP error: status={}", e.getStatusCode());
			return Optional.empty();
		} catch (Exception e) {
			log.warn("Failed to parse or process Gemini AI resume extraction response: {}", e.getMessage());
			return Optional.empty();
		}
	}

	private String extractJsonFromGeminiResponse(String responseBody) {
		try {
			JsonNode root = objectMapper.readTree(responseBody);
			JsonNode candidates = root.path("candidates");
			if (candidates.isArray() && !candidates.isEmpty()) {
				JsonNode parts = candidates.get(0).path("content").path("parts");
				if (parts.isArray() && !parts.isEmpty()) {
					String text = parts.get(0).path("text").asText();
					return cleanJsonMarkdownFences(text);
				}
			}
		} catch (Exception e) {
			log.debug("Error parsing root Gemini JSON structure: {}", e.getMessage());
		}
		return null;
	}

	private String cleanJsonMarkdownFences(String text) {
		if (text == null) return null;
		String trimmed = text.trim();
		if (trimmed.startsWith("```json")) {
			trimmed = trimmed.substring(7);
		} else if (trimmed.startsWith("```")) {
			trimmed = trimmed.substring(3);
		}
		if (trimmed.endsWith("```")) {
			trimmed = trimmed.substring(0, trimmed.length() - 3);
		}
		return trimmed.trim();
	}
}
