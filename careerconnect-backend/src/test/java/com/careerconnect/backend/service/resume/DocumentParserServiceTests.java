package com.careerconnect.backend.service.resume;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.io.ByteArrayOutputStream;
import java.io.IOException;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.encryption.AccessPermission;
import org.apache.pdfbox.pdmodel.encryption.StandardProtectionPolicy;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.usermodel.XWPFParagraph;
import org.apache.poi.xwpf.usermodel.XWPFRun;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import com.careerconnect.backend.exception.BadRequestException;

class DocumentParserServiceTests {

	private DocumentParserService parserService;

	@BeforeEach
	void setUp() {
		parserService = new DocumentParserService(500); // 500 chars limit for testing truncation
	}

	@Test
	void parseValidPdfExtractsTextSuccessfully() throws IOException {
		byte[] pdfBytes = createPdfWithText("Alex Johnson\nSoftware Engineer\nJava, Spring Boot");
		MockMultipartFile file = new MockMultipartFile("file", "resume.pdf", "application/pdf", pdfBytes);

		DocumentParserService.ParsedDocumentResult result = parserService.parseDocument(
				file, ResumeFileValidator.DocumentFormat.PDF
		);

		assertNotNull(result);
		assertTrue(result.text().contains("Alex Johnson"));
		assertTrue(result.text().contains("Software Engineer"));
		assertTrue(result.warnings().isEmpty());
	}

	@Test
	void parseValidDocxExtractsTextSuccessfully() throws IOException {
		byte[] docxBytes = createDocxWithText("Jane Doe\nFull Stack Developer\nReact, TypeScript");
		MockMultipartFile file = new MockMultipartFile("file", "resume.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", docxBytes);

		DocumentParserService.ParsedDocumentResult result = parserService.parseDocument(
				file, ResumeFileValidator.DocumentFormat.DOCX
		);

		assertNotNull(result);
		assertTrue(result.text().contains("Jane Doe"));
		assertTrue(result.text().contains("Full Stack Developer"));
		assertTrue(result.warnings().isEmpty());
	}

	@Test
	void corruptedPdfThrowsBadRequest() {
		byte[] corruptedPdf = "%PDF-1.4 [corrupted binary data that cannot be parsed as a valid pdf tree]".getBytes();
		MockMultipartFile file = new MockMultipartFile("file", "corrupt.pdf", "application/pdf", corruptedPdf);

		assertThrows(BadRequestException.class, () -> parserService.parseDocument(file, ResumeFileValidator.DocumentFormat.PDF));
	}

	@Test
	void corruptedDocxThrowsBadRequest() {
		byte[] corruptedDocx = new byte[] { 0x50, 0x4B, 0x03, 0x04, 0x12, 0x34, 0x56, 0x78 };
		MockMultipartFile file = new MockMultipartFile("file", "corrupt.docx", "application/octet-stream", corruptedDocx);

		assertThrows(BadRequestException.class, () -> parserService.parseDocument(file, ResumeFileValidator.DocumentFormat.DOCX));
	}

	@Test
	void passwordProtectedPdfThrowsBadRequest() throws IOException {
		byte[] encryptedPdf = createEncryptedPdf("Secret resume text", "password123");
		MockMultipartFile file = new MockMultipartFile("file", "locked.pdf", "application/pdf", encryptedPdf);

		BadRequestException ex = assertThrows(BadRequestException.class, () -> parserService.parseDocument(file, ResumeFileValidator.DocumentFormat.PDF));
		assertTrue(ex.getMessage().contains("password-protected or encrypted"));
	}

	@Test
	void imageOnlyPdfReturnsWarning() throws IOException {
		// A PDF with an empty page (0 text instructions)
		byte[] blankPdf = createBlankPdf();
		MockMultipartFile file = new MockMultipartFile("file", "scanned.pdf", "application/pdf", blankPdf);

		DocumentParserService.ParsedDocumentResult result = parserService.parseDocument(file, ResumeFileValidator.DocumentFormat.PDF);

		assertNotNull(result);
		assertTrue(result.text().isEmpty());
		assertFalse(result.warnings().isEmpty());
		assertTrue(result.warnings().get(0).contains("image-only or scanned document"));
	}

	@Test
	void blankDocxReturnsWarning() throws IOException {
		byte[] emptyDocx;
		try (XWPFDocument doc = new XWPFDocument(); ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
			doc.write(baos);
			emptyDocx = baos.toByteArray();
		}

		MockMultipartFile file = new MockMultipartFile("file", "blank.docx", "application/octet-stream", emptyDocx);
		DocumentParserService.ParsedDocumentResult result = parserService.parseDocument(file, ResumeFileValidator.DocumentFormat.DOCX);

		assertNotNull(result);
		assertTrue(result.text().isEmpty());
		assertFalse(result.warnings().isEmpty());
		assertTrue(result.warnings().get(0).contains("contains no extractable text"));
	}

	@Test
	void extremelyLongDocumentIsTruncatedWithWarning() throws IOException {
		// parser configured with max 500 chars limit in setUp()
		StringBuilder sb = new StringBuilder();
		for (int i = 0; i < 100; i++) {
			sb.append("This is line number ").append(i).append(" with verbose text repeating.\n");
		}
		byte[] longDocx = createDocxWithText(sb.toString());
		MockMultipartFile file = new MockMultipartFile("file", "long.docx", "application/octet-stream", longDocx);

		DocumentParserService.ParsedDocumentResult result = parserService.parseDocument(file, ResumeFileValidator.DocumentFormat.DOCX);

		assertNotNull(result);
		assertEquals(500, result.text().length());
		assertFalse(result.warnings().isEmpty());
		assertTrue(result.warnings().get(0).contains("exceeded the maximum safety limit"));
	}

	private byte[] createPdfWithText(String text) throws IOException {
		try (PDDocument doc = new PDDocument(); ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
			PDPage page = new PDPage();
			doc.addPage(page);

			try (PDPageContentStream stream = new PDPageContentStream(doc, page)) {
				stream.beginText();
				stream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 12);
				stream.newLineAtOffset(50, 700);
				for (String line : text.split("\n")) {
					stream.showText(line);
					stream.newLineAtOffset(0, -15);
				}
				stream.endText();
			}
			doc.save(baos);
			return baos.toByteArray();
		}
	}

	private byte[] createBlankPdf() throws IOException {
		try (PDDocument doc = new PDDocument(); ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
			PDPage page = new PDPage();
			doc.addPage(page);
			doc.save(baos);
			return baos.toByteArray();
		}
	}

	private byte[] createEncryptedPdf(String text, String password) throws IOException {
		try (PDDocument doc = new PDDocument(); ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
			PDPage page = new PDPage();
			doc.addPage(page);

			AccessPermission permission = new AccessPermission();
			StandardProtectionPolicy policy = new StandardProtectionPolicy(password, "", permission);
			policy.setEncryptionKeyLength(128);
			doc.protect(policy);

			doc.save(baos);
			return baos.toByteArray();
		}
	}

	private byte[] createDocxWithText(String text) throws IOException {
		try (XWPFDocument doc = new XWPFDocument(); ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
			XWPFParagraph p = doc.createParagraph();
			XWPFRun r = p.createRun();
			r.setText(text);
			doc.write(baos);
			return baos.toByteArray();
		}
	}
}
