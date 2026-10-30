package com.careerconnect.backend.service.resume;

import java.io.IOException;
import java.io.InputStream;
import java.util.Locale;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import com.careerconnect.backend.exception.BadRequestException;

@Component
public class ResumeFileValidator {

	public enum DocumentFormat {
		PDF,
		DOCX
	}

	public record ValidatedFile(
			DocumentFormat format,
			String sanitizedFileName,
			long sizeBytes
	) {
	}

	private final long maxFileSizeBytes;

	public ResumeFileValidator(
			@Value("${app.resume.max-file-size-bytes:10485760}") long maxFileSizeBytes
	) {
		this.maxFileSizeBytes = maxFileSizeBytes;
	}

	public ValidatedFile validate(MultipartFile file) {
		if (file == null || file.isEmpty()) {
			throw new BadRequestException("Uploaded resume file is empty or missing");
		}

		if (file.getSize() > maxFileSizeBytes) {
			throw new BadRequestException(String.format(
					"File size (%d bytes) exceeds the maximum allowed limit of %d bytes (10 MB)",
					file.getSize(), maxFileSizeBytes
			));
		}

		String rawFileName = file.getOriginalFilename();
		String sanitizedFileName = sanitizeAndValidateFilename(rawFileName);

		DocumentFormat extensionFormat = determineFormatFromExtension(sanitizedFileName);
		DocumentFormat signatureFormat = verifyMagicBytes(file);

		if (extensionFormat != signatureFormat) {
			throw new BadRequestException(
					"File extension does not match the actual file content signature. Uploaded file may be renamed or corrupted."
			);
		}

		return new ValidatedFile(signatureFormat, sanitizedFileName, file.getSize());
	}

	private String sanitizeAndValidateFilename(String rawFileName) {
		if (rawFileName == null || rawFileName.isBlank()) {
			throw new BadRequestException("Uploaded file must have a valid filename");
		}

		String trimmed = rawFileName.trim();

		// Prevent path traversal
		if (trimmed.contains("..") || trimmed.contains("/") || trimmed.contains("\\") || trimmed.contains("\0")) {
			throw new BadRequestException("Filename contains invalid or dangerous characters");
		}

		// Strip any remaining unwanted leading/trailing path components if present
		int lastSep = Math.max(trimmed.lastIndexOf('/'), trimmed.lastIndexOf('\\'));
		String cleanName = lastSep >= 0 ? trimmed.substring(lastSep + 1) : trimmed;

		if (cleanName.isBlank()) {
			throw new BadRequestException("Invalid filename");
		}

		return cleanName;
	}

	private DocumentFormat determineFormatFromExtension(String filename) {
		String lower = filename.toLowerCase(Locale.ROOT);
		if (lower.endsWith(".pdf")) {
			return DocumentFormat.PDF;
		}
		if (lower.endsWith(".docx")) {
			return DocumentFormat.DOCX;
		}
		throw new BadRequestException("Unsupported file extension. Only .pdf and .docx files are permitted.");
	}

	private DocumentFormat verifyMagicBytes(MultipartFile file) {
		byte[] header = new byte[8];
		int bytesRead;
		try (InputStream is = file.getInputStream()) {
			bytesRead = is.read(header);
		} catch (IOException e) {
			throw new BadRequestException("Unable to read file content for format validation: " + e.getMessage());
		}

		if (bytesRead < 4) {
			throw new BadRequestException("File is too small or truncated to be a valid document");
		}

		// PDF magic bytes: %PDF- (0x25 0x50 0x44 0x46 0x2D)
		if (header[0] == 0x25 && header[1] == 0x50 && header[2] == 0x44 && header[3] == 0x46) {
			return DocumentFormat.PDF;
		}

		// DOCX is a ZIP container: PK\x03\x04, PK\x05\x06, or PK\x07\x08
		if (header[0] == 0x50 && header[1] == 0x4B &&
				((header[2] == 0x03 && header[3] == 0x04) ||
				 (header[2] == 0x05 && header[3] == 0x06) ||
				 (header[2] == 0x07 && header[3] == 0x08))) {
			return DocumentFormat.DOCX;
		}

		throw new BadRequestException("Unsupported or corrupted document format. File header does not match valid PDF or DOCX signatures.");
	}
}
