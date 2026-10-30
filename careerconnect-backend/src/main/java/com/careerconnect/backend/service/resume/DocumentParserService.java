package com.careerconnect.backend.service.resume;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.io.RandomAccessReadBuffer;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.encryption.InvalidPasswordException;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.EncryptedDocumentException;
import org.apache.poi.openxml4j.util.ZipSecureFile;
import org.apache.poi.xwpf.extractor.XWPFWordExtractor;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.careerconnect.backend.exception.BadRequestException;

@Service
public class DocumentParserService {

	public record ParsedDocumentResult(
			String text,
			List<String> warnings
	) {
	}

	private final int maxExtractedCharacters;

	public DocumentParserService(
			@Value("${app.resume.max-extracted-characters:100000}") int maxExtractedCharacters
	) {
		this.maxExtractedCharacters = maxExtractedCharacters;
	}

	public ParsedDocumentResult parseDocument(MultipartFile file, ResumeFileValidator.DocumentFormat format) {
		byte[] fileBytes;
		try {
			fileBytes = file.getBytes();
		} catch (IOException e) {
			throw new BadRequestException("Failed to read uploaded resume file: " + e.getMessage());
		}

		return switch (format) {
			case PDF -> parsePdf(fileBytes);
			case DOCX -> parseDocx(fileBytes);
		};
	}

	private ParsedDocumentResult parsePdf(byte[] fileBytes) {
		List<String> warnings = new ArrayList<>();
		String rawText;

		try (RandomAccessReadBuffer buffer = new RandomAccessReadBuffer(fileBytes);
			 PDDocument document = Loader.loadPDF(buffer)) {

			if (document.isEncrypted()) {
				throw new BadRequestException(
						"The uploaded PDF is password-protected or encrypted. Please remove password protection and try again."
				);
			}

			int totalPages = document.getNumberOfPages();
			PDFTextStripper stripper = new PDFTextStripper();
			stripper.setSortByPosition(true);
			rawText = stripper.getText(document);

			if ((rawText == null || rawText.trim().isEmpty()) && totalPages > 0) {
				warnings.add(
						"The uploaded PDF appears to be an image-only or scanned document with no extractable text layer. " +
						"Scanned resumes cannot be processed without OCR."
				);
				rawText = "";
			}
		} catch (InvalidPasswordException e) {
			throw new BadRequestException(
					"The uploaded PDF is password-protected or encrypted. Please remove password protection and try again."
			);
		} catch (BadRequestException e) {
			throw e;
		} catch (Exception e) {
			throw new BadRequestException("Unable to read or parse PDF document: " + e.getMessage());
		}

		return sanitizeAndEnforceTextLimit(rawText, warnings);
	}

	private ParsedDocumentResult parseDocx(byte[] fileBytes) {
		List<String> warnings = new ArrayList<>();
		String rawText;

		// Protect against Zip bomb attacks in Office OpenXML documents
		ZipSecureFile.setMinInflateRatio(0.005);

		try (InputStream bais = new ByteArrayInputStream(fileBytes);
			 XWPFDocument document = new XWPFDocument(bais);
			 XWPFWordExtractor extractor = new XWPFWordExtractor(document)) {

			rawText = extractor.getText();

			if (rawText == null || rawText.trim().isEmpty()) {
				warnings.add("The uploaded DOCX document contains no extractable text.");
				rawText = "";
			}
		} catch (EncryptedDocumentException e) {
			throw new BadRequestException(
					"The uploaded DOCX document is password-protected or encrypted. Please remove password protection and try again."
			);
		} catch (BadRequestException e) {
			throw e;
		} catch (Exception e) {
			throw new BadRequestException("Unable to read or parse DOCX document: " + e.getMessage());
		}

		return sanitizeAndEnforceTextLimit(rawText, warnings);
	}

	private ParsedDocumentResult sanitizeAndEnforceTextLimit(String rawText, List<String> warnings) {
		if (rawText == null) {
			return new ParsedDocumentResult("", warnings);
		}

		String cleanText = rawText.replace("\u0000", "").trim();

		if (cleanText.length() > maxExtractedCharacters) {
			cleanText = cleanText.substring(0, maxExtractedCharacters);
			warnings.add(String.format(
					"Extracted document text exceeded the maximum safety limit of %d characters and was truncated.",
					maxExtractedCharacters
			));
		}

		return new ParsedDocumentResult(cleanText, warnings);
	}
}
