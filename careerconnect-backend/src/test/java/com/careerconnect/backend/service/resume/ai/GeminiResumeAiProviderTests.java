package com.careerconnect.backend.service.resume.ai;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.jsonPath;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withServerError;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withStatus;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

import java.io.IOException;
import java.net.SocketTimeoutException;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.test.web.client.response.MockRestResponseCreators;
import org.springframework.web.client.RestClient;

import com.careerconnect.backend.service.resume.ai.dto.AiResumeExtractionResult;
import tools.jackson.databind.ObjectMapper;

class GeminiResumeAiProviderTests {

	private static final String BASE_URL = "https://generativelanguage.googleapis.com";
	private static final String API_KEY = "test-gemini-key";
	private static final String MODEL = "gemini-3.8-flash";
	private static final String EXPECTED_URI = BASE_URL + "/v1beta/models/" + MODEL + ":generateContent";

	private MockRestServiceServer mockServer;
	private GeminiResumeAiProvider provider;
	private ObjectMapper objectMapper;

	@BeforeEach
	void setUp() {
		objectMapper = new ObjectMapper();
		RestClient.Builder builder = RestClient.builder().baseUrl(BASE_URL);
		mockServer = MockRestServiceServer.bindTo(builder).build();
		RestClient restClient = builder.build();

		provider = new GeminiResumeAiProvider(
				true,
				API_KEY,
				MODEL,
				BASE_URL,
				5000,
				restClient,
				objectMapper
		);
	}

	@Test
	void disabledWhenConfiguredFalse() {
		GeminiResumeAiProvider disabled = new GeminiResumeAiProvider(
				false,
				API_KEY,
				MODEL,
				BASE_URL,
				5000,
				RestClient.builder().build(),
				objectMapper
		);
		assertFalse(disabled.isEnabled());
		assertEquals("GEMINI", disabled.getProviderName());
		assertTrue(disabled.extractStructuredData("Sample Resume").isEmpty());
	}

	@Test
	void disabledWhenApiKeyMissing() {
		GeminiResumeAiProvider missingKey = new GeminiResumeAiProvider(
				true,
				"",
				MODEL,
				BASE_URL,
				5000,
				RestClient.builder().build(),
				objectMapper
		);
		assertFalse(missingKey.isEnabled());
		assertTrue(missingKey.extractStructuredData("Sample Resume").isEmpty());
	}

	@Test
	void enabledWhenConfiguredWithKey() {
		assertTrue(provider.isEnabled());
	}

	@Test
	void successfulAiResponseParsesStructuredData() {
		String geminiJson = """
				{
				  "candidates": [
				    {
				      "content": {
				        "parts": [
				          {
				            "text": "{\\"personalDetails\\":{\\"fullName\\":\\"Jane Doe\\",\\"email\\":\\"jane@example.com\\",\\"phone\\":\\"+1-555-0199\\",\\"location\\":\\"Seattle, WA\\"},\\"professionalSummary\\":\\"Senior Cloud Architect\\",\\"skills\\":[{\\"name\\":\\"AWS\\",\\"category\\":\\"CLOUD_DEVOPS\\"},{\\"name\\":\\"Java\\",\\"category\\":\\"PROGRAMMING_LANGUAGE\\"}],\\"educations\\":[],\\"experiences\\":[],\\"projects\\":[],\\"certifications\\":[],\\"socialLinks\\":{\\"linkedIn\\":\\"https://linkedin.com/in/janedoe\\"}}"
				          }
				        ]
				      }
				    }
				  ]
				}
				""";

		mockServer.expect(requestTo(EXPECTED_URI))
				.andExpect(method(HttpMethod.POST))
				.andExpect(header("x-goog-api-key", API_KEY))
				.andRespond(withSuccess(geminiJson, MediaType.APPLICATION_JSON));

		Optional<AiResumeExtractionResult> result = provider.extractStructuredData("Sample resume text");

		mockServer.verify();
		assertTrue(result.isPresent());
		AiResumeExtractionResult extraction = result.get();
		assertNotNull(extraction.personalDetails());
		assertEquals("Jane Doe", extraction.personalDetails().fullName());
		assertEquals("Senior Cloud Architect", extraction.professionalSummary());
		assertEquals(2, extraction.skills().size());
		assertEquals("AWS", extraction.skills().get(0).name());
		assertEquals("https://linkedin.com/in/janedoe", extraction.socialLinks().linkedIn());
	}

	@Test
	void apiKeySentViaHeaderAndNotInUrlQuery() {
		String minimalJson = """
				{
				  "candidates": [
				    {
				      "content": {
				        "parts": [{ "text": "{}" }]
				      }
				    }
				  ]
				}
				""";

		// Verifies exact URI has NO query params (no ?key=) and key is strictly in the header
		mockServer.expect(requestTo(EXPECTED_URI))
				.andExpect(method(HttpMethod.POST))
				.andExpect(header("x-goog-api-key", API_KEY))
				.andRespond(withSuccess(minimalJson, MediaType.APPLICATION_JSON));

		provider.extractStructuredData("Sample resume text");

		mockServer.verify();
		assertFalse(EXPECTED_URI.contains("key="));
	}

	@Test
	void requestPayloadPreservesResponseMimeTypeAndOmitsDeprecatedSamplingParameters() {
		String minimalJson = """
				{
				  "candidates": [
				    {
				      "content": {
				        "parts": [{ "text": "{}" }]
				      }
				    }
				  ]
				}
				""";

		mockServer.expect(requestTo(EXPECTED_URI))
				.andExpect(method(HttpMethod.POST))
				.andExpect(header("x-goog-api-key", API_KEY))
				.andExpect(jsonPath("$.generationConfig.responseMimeType").value("application/json"))
				.andExpect(jsonPath("$.generationConfig.temperature").doesNotExist())
				.andExpect(jsonPath("$.generationConfig.topP").doesNotExist())
				.andExpect(jsonPath("$.generationConfig.top_p").doesNotExist())
				.andExpect(jsonPath("$.generationConfig.topK").doesNotExist())
				.andExpect(jsonPath("$.generationConfig.top_k").doesNotExist())
				.andExpect(jsonPath("$.generationConfig.candidateCount").doesNotExist())
				.andExpect(jsonPath("$.generationConfig.candidate_count").doesNotExist())
				.andExpect(jsonPath("$.temperature").doesNotExist())
				.andExpect(jsonPath("$.topP").doesNotExist())
				.andExpect(jsonPath("$.topK").doesNotExist())
				.andExpect(jsonPath("$.candidateCount").doesNotExist())
				.andExpect(jsonPath("$.candidate_count").doesNotExist())
				.andRespond(withSuccess(minimalJson, MediaType.APPLICATION_JSON));

		Optional<AiResumeExtractionResult> result = provider.extractStructuredData("Sample resume text");

		mockServer.verify();
		assertTrue(result.isPresent());
	}

	@Test
	void handlesMarkdownCodeFencesInResponse() {
		String geminiJson = """
				{
				  "candidates": [
				    {
				      "content": {
				        "parts": [
				          {
				            "text": "```json\\n{\\"personalDetails\\":{\\"fullName\\":\\"Alex Smith\\"},\\"skills\\":[]}\\n```"
				          }
				        ]
				      }
				    }
				  ]
				}
				""";

		mockServer.expect(requestTo(EXPECTED_URI))
				.andExpect(method(HttpMethod.POST))
				.andExpect(header("x-goog-api-key", API_KEY))
				.andRespond(withSuccess(geminiJson, MediaType.APPLICATION_JSON));

		Optional<AiResumeExtractionResult> result = provider.extractStructuredData("Sample resume text");

		mockServer.verify();
		assertTrue(result.isPresent());
		assertEquals("Alex Smith", result.get().personalDetails().fullName());
	}

	@Test
	void handlesMalformedJsonGracefully() {
		String geminiJson = """
				{
				  "candidates": [
				    {
				      "content": {
				        "parts": [
				          {
				            "text": "NOT_VALID_JSON_AT_ALL{broken"
				          }
				        ]
				      }
				    }
				  ]
				}
				""";

		mockServer.expect(requestTo(EXPECTED_URI))
				.andExpect(method(HttpMethod.POST))
				.andExpect(header("x-goog-api-key", API_KEY))
				.andRespond(withSuccess(geminiJson, MediaType.APPLICATION_JSON));

		Optional<AiResumeExtractionResult> result = provider.extractStructuredData("Sample resume text");

		mockServer.verify();
		assertTrue(result.isEmpty());
	}

	@Test
	void handlesProvider429RateLimitGracefully() {
		mockServer.expect(requestTo(EXPECTED_URI))
				.andExpect(method(HttpMethod.POST))
				.andExpect(header("x-goog-api-key", API_KEY))
				.andRespond(withStatus(HttpStatus.TOO_MANY_REQUESTS));

		Optional<AiResumeExtractionResult> result = provider.extractStructuredData("Sample resume text");

		mockServer.verify();
		assertTrue(result.isEmpty());
	}

	@Test
	void handlesProvider5xxServerErrorGracefully() {
		mockServer.expect(requestTo(EXPECTED_URI))
				.andExpect(method(HttpMethod.POST))
				.andExpect(header("x-goog-api-key", API_KEY))
				.andRespond(withServerError());

		Optional<AiResumeExtractionResult> result = provider.extractStructuredData("Sample resume text");

		mockServer.verify();
		assertTrue(result.isEmpty());
	}

	@Test
	void handlesProviderTimeoutGracefully() {
		mockServer.expect(requestTo(EXPECTED_URI))
				.andExpect(method(HttpMethod.POST))
				.andExpect(header("x-goog-api-key", API_KEY))
				.andRespond(request -> {
					throw new org.springframework.web.client.ResourceAccessException("Read timed out", new SocketTimeoutException("Read timed out"));
				});

		Optional<AiResumeExtractionResult> result = provider.extractStructuredData("Sample resume text");

		mockServer.verify();
		assertTrue(result.isEmpty());
	}

	@Test
	void handlesMissingResponseFieldsAndInvalidSchema() {
		String partialJson = """
				{
				  "candidates": [
				    {
				      "content": {
				        "parts": [
				          {
				            "text": "{\\"unexpectedField\\":\\"someValue\\"}"
				          }
				        ]
				      }
				    }
				  ]
				}
				""";

		mockServer.expect(requestTo(EXPECTED_URI))
				.andExpect(method(HttpMethod.POST))
				.andExpect(header("x-goog-api-key", API_KEY))
				.andRespond(withSuccess(partialJson, MediaType.APPLICATION_JSON));

		Optional<AiResumeExtractionResult> result = provider.extractStructuredData("Sample resume text");

		mockServer.verify();
		assertTrue(result.isPresent());
		// Missing fields should safely be null without throwing
		assertNotNull(result.get());
	}
}
