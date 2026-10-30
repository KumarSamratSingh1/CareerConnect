package com.careerconnect.backend.service.resume;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import com.careerconnect.backend.exception.BadRequestException;

class ResumeFileValidatorTests {

	private ResumeFileValidator validator;

	@BeforeEach
	void setUp() {
		// 10 MB limit = 10,485,760 bytes
		validator = new ResumeFileValidator(10485760L);
	}

	@Test
	void validPdfPassesValidation() {
		byte[] pdfBytes = "%PDF-1.4 sample content".getBytes();
		MockMultipartFile file = new MockMultipartFile("file", "resume.pdf", "application/pdf", pdfBytes);

		ResumeFileValidator.ValidatedFile result = validator.validate(file);

		assertNotNull(result);
		assertEquals(ResumeFileValidator.DocumentFormat.PDF, result.format());
		assertEquals("resume.pdf", result.sanitizedFileName());
		assertEquals(pdfBytes.length, result.sizeBytes());
	}

	@Test
	void validDocxPassesValidation() {
		// PK\x03\x04 zip header
		byte[] docxBytes = new byte[] { 0x50, 0x4B, 0x03, 0x04, 0x00, 0x00, 0x00, 0x00 };
		MockMultipartFile file = new MockMultipartFile("file", "cv.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", docxBytes);

		ResumeFileValidator.ValidatedFile result = validator.validate(file);

		assertNotNull(result);
		assertEquals(ResumeFileValidator.DocumentFormat.DOCX, result.format());
		assertEquals("cv.docx", result.sanitizedFileName());
	}

	@Test
	void emptyFileThrowsBadRequest() {
		MockMultipartFile file = new MockMultipartFile("file", "empty.pdf", "application/pdf", new byte[0]);

		BadRequestException ex = assertThrows(BadRequestException.class, () -> validator.validate(file));
		assertEquals("Uploaded resume file is empty or missing", ex.getMessage());
	}

	@Test
	void oversizedFileThrowsBadRequest() {
		ResumeFileValidator smallValidator = new ResumeFileValidator(100L);
		byte[] bigBytes = new byte[150];
		MockMultipartFile file = new MockMultipartFile("file", "big.pdf", "application/pdf", bigBytes);

		BadRequestException ex = assertThrows(BadRequestException.class, () -> smallValidator.validate(file));
		assertEquals("File size (150 bytes) exceeds the maximum allowed limit of 100 bytes (10 MB)", ex.getMessage());
	}

	@Test
	void invalidExtensionThrowsBadRequest() {
		MockMultipartFile file = new MockMultipartFile("file", "script.exe", "application/octet-stream", "%PDF-1.4".getBytes());

		BadRequestException ex = assertThrows(BadRequestException.class, () -> validator.validate(file));
		assertEquals("Unsupported file extension. Only .pdf and .docx files are permitted.", ex.getMessage());
	}

	@Test
	void contentSignatureMismatchThrowsBadRequest() {
		// .pdf extension but content is NOT a PDF header
		MockMultipartFile file = new MockMultipartFile("file", "fake.pdf", "application/pdf", "Just plain text".getBytes());

		BadRequestException ex = assertThrows(BadRequestException.class, () -> validator.validate(file));
		assertEquals("Unsupported or corrupted document format. File header does not match valid PDF or DOCX signatures.", ex.getMessage());
	}

	@Test
	void extensionAndSignatureMismatchThrowsBadRequest() {
		// .pdf extension with DOCX PK zip signature
		byte[] zipHeader = new byte[] { 0x50, 0x4B, 0x03, 0x04, 0x00, 0x00 };
		MockMultipartFile file = new MockMultipartFile("file", "mismatch.pdf", "application/pdf", zipHeader);

		BadRequestException ex = assertThrows(BadRequestException.class, () -> validator.validate(file));
		assertEquals("File extension does not match the actual file content signature. Uploaded file may be renamed or corrupted.", ex.getMessage());
	}

	@Test
	void pathTraversalInFilenameThrowsBadRequest() {
		byte[] pdfBytes = "%PDF-1.4 test".getBytes();
		MockMultipartFile file = new MockMultipartFile("file", "../../secret.pdf", "application/pdf", pdfBytes);

		BadRequestException ex = assertThrows(BadRequestException.class, () -> validator.validate(file));
		assertEquals("Filename contains invalid or dangerous characters", ex.getMessage());
	}
}
