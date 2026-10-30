package com.careerconnect.backend.service.resume;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.stereotype.Service;

import com.careerconnect.backend.dto.response.resume.ExtractedCertificationDto;
import com.careerconnect.backend.dto.response.resume.ExtractedEducationDto;
import com.careerconnect.backend.dto.response.resume.ExtractedExperienceDto;
import com.careerconnect.backend.dto.response.resume.ExtractedField;
import com.careerconnect.backend.dto.response.resume.ExtractedProjectDto;
import com.careerconnect.backend.dto.response.resume.ExtractedSkillDto;
import com.careerconnect.backend.dto.response.resume.ExtractedSocialLinksDto;
import com.careerconnect.backend.dto.response.resume.ExtractionMetadataDto;
import com.careerconnect.backend.dto.response.resume.PersonalDetailsDto;
import com.careerconnect.backend.dto.response.resume.ResumeDraftResponse;
import com.careerconnect.backend.service.resume.ai.dto.AiCertification;
import com.careerconnect.backend.service.resume.ai.dto.AiEducation;
import com.careerconnect.backend.service.resume.ai.dto.AiExperience;
import com.careerconnect.backend.service.resume.ai.dto.AiPersonalDetails;
import com.careerconnect.backend.service.resume.ai.dto.AiProject;
import com.careerconnect.backend.service.resume.ai.dto.AiResumeExtractionResult;
import com.careerconnect.backend.service.resume.ai.dto.AiSkill;
import com.careerconnect.backend.service.resume.ai.dto.AiSocialLinks;

/**
 * Merges deterministic rule-based baseline extraction with structured AI extraction.
 *
 * Implements strict Hybrid Merge Rules:
 * A. Preserve reliable exact deterministic extraction.
 * B. Use AI to identify structure and relationships.
 * C. Use AI to help interpret ambiguous sections.
 * D. If AI contradicts deterministic extraction, retain the conflict for candidate review.
 * E. Do not silently replace a reliable value.
 * F. Deduplicate skills case-insensitively.
 * G. Preserve original date text without fabricating day 1.
 * H. Mark uncertain or conflicting fields reviewRequired=true.
 * I. Missing information remains missing.
 */
@Service
public class HybridResumeMergeService {

	private static final Pattern EXACT_ISO_DATE = Pattern.compile(
			"\\b(?:19|20)\\d{2}-(?:0?[1-9]|1[0-2])-(?:[12]\\d|3[01]|0?[1-9])\\b"
	);
	private static final DateTimeFormatter ISO_FLEX_DATE = DateTimeFormatter.ofPattern("yyyy-M-d");

	public ResumeDraftResponse merge(
			ResumeDraftResponse baseline,
			AiResumeExtractionResult aiResult,
			String originalDocumentText
	) {
		if (aiResult == null) {
			return baseline;
		}

		List<String> warnings = new ArrayList<>(baseline.warnings());

		// 1. Personal Details Merge
		PersonalDetailsDto personalDetails = mergePersonalDetails(baseline.personalDetails(), aiResult.personalDetails(), warnings);

		// 2. Professional Summary Merge
		ExtractedField<String> summary = mergeSummary(baseline.professionalSummary(), aiResult.professionalSummary());

		// 3. Social Links Merge
		ExtractedSocialLinksDto socialLinks = mergeSocialLinks(baseline.socialLinks(), aiResult.socialLinks());

		// 4. Skills Merge (Case-insensitive deduplication)
		List<ExtractedSkillDto> skills = mergeSkills(baseline.skills(), aiResult.skills());

		// 5. Education Merge
		List<ExtractedEducationDto> educations = mergeEducations(baseline.educations(), aiResult.educations(), warnings);

		// 6. Experience Merge
		List<ExtractedExperienceDto> experiences = mergeExperiences(baseline.experiences(), aiResult.experiences(), warnings);

		// 7. Projects Merge
		List<ExtractedProjectDto> projects = mergeProjects(baseline.projects(), aiResult.projects());

		// 8. Certifications Merge
		List<ExtractedCertificationDto> certifications = mergeCertifications(baseline.certifications(), aiResult.certifications());

		// 9. Extraction Metadata
		ExtractionMetadataDto baselineMeta = baseline.extractionMetadata();
		ExtractionMetadataDto mergedMeta = new ExtractionMetadataDto(
				baselineMeta.fileName(),
				baselineMeta.fileType(),
				baselineMeta.fileSizeBytes(),
				baselineMeta.characterCount(),
				"HYBRID_RULE_AND_AI",
				baselineMeta.processedAt()
		);

		return new ResumeDraftResponse(
				personalDetails,
				summary,
				skills,
				educations,
				experiences,
				projects,
				certifications,
				socialLinks,
				warnings,
				mergedMeta
		);
	}

	private PersonalDetailsDto mergePersonalDetails(
			PersonalDetailsDto baseline,
			AiPersonalDetails aiPersonal,
			List<String> warnings
	) {
		if (aiPersonal == null) {
			return baseline;
		}

		// Full Name
		ExtractedField<String> fullName = baseline.fullName();
		if (fullName == null || fullName.value() == null || fullName.value().isBlank()) {
			if (aiPersonal.fullName() != null && !aiPersonal.fullName().isBlank()) {
				fullName = ExtractedField.of(aiPersonal.fullName().trim(), "HYBRID_AI", 0.85, false);
			}
		} else if (aiPersonal.fullName() != null && !aiPersonal.fullName().isBlank()) {
			String baseName = fullName.value().trim();
			String aiName = aiPersonal.fullName().trim();
			if (!baseName.equalsIgnoreCase(aiName)) {
				// Retain conflict for review (Rule D, E)
				warnings.add("Deterministic full name ('" + baseName + "') differs from AI suggested name ('" + aiName + "'). Kept deterministic value for candidate review.");
				fullName = new ExtractedField<>(baseName, fullName.source(), true, fullName.confidence());
			}
		}

		// Email (Informational only; deterministic regex is reliable)
		ExtractedField<String> email = baseline.email();
		if (email == null || email.value() == null || email.value().isBlank()) {
			if (aiPersonal.email() != null && !aiPersonal.email().isBlank() && aiPersonal.email().contains("@")) {
				email = ExtractedField.of(aiPersonal.email().trim(), "HYBRID_AI", 0.85, true);
			}
		} else if (aiPersonal.email() != null && !aiPersonal.email().isBlank()) {
			String baseEmail = email.value().trim();
			String aiEmail = aiPersonal.email().trim();
			if (!baseEmail.equalsIgnoreCase(aiEmail)) {
				warnings.add("Deterministic email ('" + baseEmail + "') differs from AI extracted email ('" + aiEmail + "'). Kept deterministic email.");
			}
		}

		// Phone
		ExtractedField<String> phone = baseline.phone();
		if (phone == null || phone.value() == null || phone.value().isBlank()) {
			if (aiPersonal.phone() != null && !aiPersonal.phone().isBlank()) {
				phone = ExtractedField.of(aiPersonal.phone().trim(), "HYBRID_AI", 0.80, false);
			}
		} else if (aiPersonal.phone() != null && !aiPersonal.phone().isBlank()) {
			String digitsBase = phone.value().replaceAll("[^0-9]", "");
			String digitsAi = aiPersonal.phone().replaceAll("[^0-9]", "");
			if (!digitsBase.isEmpty() && !digitsAi.isEmpty() && !digitsBase.equals(digitsAi)) {
				warnings.add("Deterministic phone ('" + phone.value() + "') differs from AI phone ('" + aiPersonal.phone() + "'). Kept deterministic phone.");
				phone = new ExtractedField<>(phone.value(), phone.source(), true, phone.confidence());
			}
		}

		// Location
		ExtractedField<String> location = baseline.location();
		if (location == null || location.value() == null || location.value().isBlank()) {
			if (aiPersonal.location() != null && !aiPersonal.location().isBlank()) {
				location = ExtractedField.of(aiPersonal.location().trim(), "HYBRID_AI", 0.80, false);
			}
		}

		return new PersonalDetailsDto(fullName, email, phone, location);
	}

	private ExtractedField<String> mergeSummary(
			ExtractedField<String> baselineSummary,
			String aiSummary
	) {
		if (baselineSummary != null && baselineSummary.value() != null && !baselineSummary.value().isBlank()) {
			return baselineSummary;
		}
		if (aiSummary != null && !aiSummary.isBlank()) {
			return ExtractedField.of(aiSummary.trim(), "HYBRID_AI", 0.85, false);
		}
		return baselineSummary != null ? baselineSummary : ExtractedField.empty();
	}

	private ExtractedSocialLinksDto mergeSocialLinks(
			ExtractedSocialLinksDto baseline,
			AiSocialLinks aiSocial
	) {
		if (aiSocial == null) {
			return baseline;
		}

		ExtractedField<String> linkedIn = baseline.linkedIn();
		if (linkedIn == null || linkedIn.value() == null || linkedIn.value().isBlank()) {
			if (aiSocial.linkedIn() != null && !aiSocial.linkedIn().isBlank()) {
				linkedIn = ExtractedField.of(aiSocial.linkedIn().trim(), "HYBRID_AI", 0.90, false);
			}
		}

		ExtractedField<String> gitHub = baseline.gitHub();
		if (gitHub == null || gitHub.value() == null || gitHub.value().isBlank()) {
			if (aiSocial.gitHub() != null && !aiSocial.gitHub().isBlank()) {
				gitHub = ExtractedField.of(aiSocial.gitHub().trim(), "HYBRID_AI", 0.90, false);
			}
		}

		ExtractedField<String> portfolio = baseline.portfolio();
		if (portfolio == null || portfolio.value() == null || portfolio.value().isBlank()) {
			if (aiSocial.portfolio() != null && !aiSocial.portfolio().isBlank()) {
				portfolio = ExtractedField.of(aiSocial.portfolio().trim(), "HYBRID_AI", 0.75, true);
			}
		}

		return new ExtractedSocialLinksDto(
				linkedIn != null ? linkedIn : ExtractedField.empty(),
				gitHub != null ? gitHub : ExtractedField.empty(),
				portfolio != null ? portfolio : ExtractedField.empty()
		);
	}

	private List<ExtractedSkillDto> mergeSkills(
			List<ExtractedSkillDto> baselineSkills,
			List<AiSkill> aiSkills
	) {
		Set<String> seen = new LinkedHashSet<>();
		List<ExtractedSkillDto> merged = new ArrayList<>();

		// Preserve baseline deterministic skills first
		if (baselineSkills != null) {
			for (ExtractedSkillDto skill : baselineSkills) {
				if (skill != null && skill.name() != null && !skill.name().isBlank()) {
					if (seen.add(skill.name().trim().toLowerCase(Locale.ROOT))) {
						merged.add(skill);
					}
				}
			}
		}

		// Merge AI skills case-insensitively
		if (aiSkills != null) {
			for (AiSkill aiSkill : aiSkills) {
				if (aiSkill != null && aiSkill.name() != null && !aiSkill.name().isBlank()) {
					String key = aiSkill.name().trim().toLowerCase(Locale.ROOT);
					if (seen.add(key)) {
						String category = aiSkill.category() != null && !aiSkill.category().isBlank()
								? aiSkill.category().trim().toUpperCase(Locale.ROOT)
								: "OTHER";
						merged.add(new ExtractedSkillDto(aiSkill.name().trim(), category, 0.85));
					}
				}
			}
		}

		return merged;
	}

	private List<ExtractedEducationDto> mergeEducations(
			List<ExtractedEducationDto> baselineEdu,
			List<AiEducation> aiEdu,
			List<String> warnings
	) {
		if (aiEdu == null || aiEdu.isEmpty()) {
			return baselineEdu;
		}

		if (baselineEdu == null || baselineEdu.isEmpty()) {
			// Populate from AI
			List<ExtractedEducationDto> list = new ArrayList<>();
			for (AiEducation ai : aiEdu) {
				if (ai == null || (ai.institution() == null && ai.degree() == null)) continue;

				boolean currentlyStudying = Boolean.TRUE.equals(ai.currentlyStudying());
				LocalDate startDate = parseDefensibleDate(ai.rawDateRange(), true, warnings);
				LocalDate endDate = currentlyStudying ? null : parseDefensibleDate(ai.rawDateRange(), false, warnings);
				boolean dateReviewRequired = ai.rawDateRange() != null && (startDate == null || (!currentlyStudying && endDate == null));

				list.add(new ExtractedEducationDto(
						ai.institution() != null ? ExtractedField.of(ai.institution().trim(), "HYBRID_AI", 0.85, false) : ExtractedField.empty(),
						ai.degree() != null ? ExtractedField.of(ai.degree().trim(), "HYBRID_AI", 0.85, false) : ExtractedField.empty(),
						ai.fieldOfStudy() != null ? ExtractedField.of(ai.fieldOfStudy().trim(), "HYBRID_AI", 0.80, false) : ExtractedField.empty(),
						startDate != null ? ExtractedField.of(startDate, "HYBRID_AI", 0.90, false) : ExtractedField.of(null, "HYBRID_AI", 0.50, dateReviewRequired),
						endDate != null ? ExtractedField.of(endDate, "HYBRID_AI", 0.90, false) : ExtractedField.of(null, "HYBRID_AI", 0.50, dateReviewRequired && !currentlyStudying),
						ai.rawDateRange(),
						ExtractedField.of(currentlyStudying, "HYBRID_AI", 0.85, false)
				));
			}
			return list;
		}

		// Baseline has education: enrich missing fieldOfStudy if present in AI
		List<ExtractedEducationDto> enriched = new ArrayList<>();
		for (ExtractedEducationDto base : baselineEdu) {
			ExtractedField<String> fieldOfStudy = base.fieldOfStudy();
			if (fieldOfStudy == null || fieldOfStudy.value() == null || fieldOfStudy.value().isBlank()) {
				for (AiEducation ai : aiEdu) {
					if (ai != null && ai.fieldOfStudy() != null && !ai.fieldOfStudy().isBlank()) {
						if (base.degree() != null && base.degree().value() != null && ai.degree() != null
								&& base.degree().value().toLowerCase(Locale.ROOT).contains(ai.degree().toLowerCase(Locale.ROOT))) {
							fieldOfStudy = ExtractedField.of(ai.fieldOfStudy().trim(), "HYBRID_AI", 0.80, false);
							break;
						}
					}
				}
			}

			enriched.add(new ExtractedEducationDto(
					base.institution(),
					base.degree(),
					fieldOfStudy,
					base.startDate(),
					base.endDate(),
					base.rawDateRange(),
					base.currentlyStudying()
			));
		}

		return enriched;
	}

	private List<ExtractedExperienceDto> mergeExperiences(
			List<ExtractedExperienceDto> baselineExp,
			List<AiExperience> aiExp,
			List<String> warnings
	) {
		if (aiExp == null || aiExp.isEmpty()) {
			return baselineExp;
		}

		if (baselineExp == null || baselineExp.isEmpty()) {
			// Populate from AI
			List<ExtractedExperienceDto> list = new ArrayList<>();
			for (AiExperience ai : aiExp) {
				if (ai == null || (ai.companyName() == null && ai.jobTitle() == null)) continue;

				boolean currentlyWorking = Boolean.TRUE.equals(ai.currentlyWorking());
				LocalDate startDate = parseDefensibleDate(ai.rawDateRange(), true, warnings);
				LocalDate endDate = currentlyWorking ? null : parseDefensibleDate(ai.rawDateRange(), false, warnings);
				boolean dateReviewRequired = ai.rawDateRange() != null && (startDate == null || (!currentlyWorking && endDate == null));

				list.add(new ExtractedExperienceDto(
						ai.companyName() != null ? ExtractedField.of(ai.companyName().trim(), "HYBRID_AI", 0.85, false) : ExtractedField.empty(),
						ai.jobTitle() != null ? ExtractedField.of(ai.jobTitle().trim(), "HYBRID_AI", 0.85, false) : ExtractedField.empty(),
						ai.description() != null ? ExtractedField.of(ai.description().trim(), "HYBRID_AI", 0.80, false) : ExtractedField.empty(),
						startDate != null ? ExtractedField.of(startDate, "HYBRID_AI", 0.90, false) : ExtractedField.of(null, "HYBRID_AI", 0.50, dateReviewRequired),
						endDate != null ? ExtractedField.of(endDate, "HYBRID_AI", 0.90, false) : ExtractedField.of(null, "HYBRID_AI", 0.50, dateReviewRequired && !currentlyWorking),
						ai.rawDateRange(),
						ExtractedField.of(currentlyWorking, "HYBRID_AI", 0.85, false)
				));
			}
			return list;
		}

		// Baseline has experiences: enrich missing descriptions if baseline was empty or truncated
		List<ExtractedExperienceDto> enriched = new ArrayList<>();
		for (ExtractedExperienceDto base : baselineExp) {
			ExtractedField<String> desc = base.description();
			if (desc == null || desc.value() == null || desc.value().isBlank()) {
				for (AiExperience ai : aiExp) {
					if (ai != null && ai.description() != null && !ai.description().isBlank()) {
						if (base.jobTitle() != null && base.jobTitle().value() != null && ai.jobTitle() != null
								&& base.jobTitle().value().toLowerCase(Locale.ROOT).contains(ai.jobTitle().toLowerCase(Locale.ROOT))) {
							desc = ExtractedField.of(ai.description().trim(), "HYBRID_AI", 0.80, false);
							break;
						}
					}
				}
			}

			enriched.add(new ExtractedExperienceDto(
					base.companyName(),
					base.jobTitle(),
					desc,
					base.startDate(),
					base.endDate(),
					base.rawDateRange(),
					base.currentlyWorking()
			));
		}

		return enriched;
	}

	private List<ExtractedProjectDto> mergeProjects(
			List<ExtractedProjectDto> baselineProjects,
			List<AiProject> aiProjects
	) {
		if (aiProjects == null || aiProjects.isEmpty()) {
			return baselineProjects;
		}

		if (baselineProjects == null || baselineProjects.isEmpty()) {
			List<ExtractedProjectDto> list = new ArrayList<>();
			for (AiProject ai : aiProjects) {
				if (ai == null || ai.title() == null || ai.title().isBlank()) continue;
				list.add(new ExtractedProjectDto(
						ExtractedField.of(ai.title().trim(), "HYBRID_AI", 0.85, false),
						ai.description() != null ? ExtractedField.of(ai.description().trim(), "HYBRID_AI", 0.80, false) : ExtractedField.empty(),
						ai.technologies() != null ? ai.technologies() : List.of()
				));
			}
			return list;
		}

		return baselineProjects;
	}

	private List<ExtractedCertificationDto> mergeCertifications(
			List<ExtractedCertificationDto> baselineCerts,
			List<AiCertification> aiCerts
	) {
		if (aiCerts == null || aiCerts.isEmpty()) {
			return baselineCerts;
		}

		if (baselineCerts == null || baselineCerts.isEmpty()) {
			List<ExtractedCertificationDto> list = new ArrayList<>();
			for (AiCertification ai : aiCerts) {
				if (ai == null || ai.name() == null || ai.name().isBlank()) continue;
				list.add(new ExtractedCertificationDto(
						ExtractedField.of(ai.name().trim(), "HYBRID_AI", 0.85, false),
						ai.issuingOrganization() != null ? ExtractedField.of(ai.issuingOrganization().trim(), "HYBRID_AI", 0.80, false) : ExtractedField.empty()
				));
			}
			return list;
		}

		return baselineCerts;
	}

	private LocalDate parseDefensibleDate(String dateRangeStr, boolean isStart, List<String> warnings) {
		if (dateRangeStr == null || dateRangeStr.isBlank()) {
			return null;
		}

		List<LocalDate> exactDates = new ArrayList<>();
		Matcher matcher = EXACT_ISO_DATE.matcher(dateRangeStr);
		while (matcher.find()) {
			try {
				exactDates.add(LocalDate.parse(matcher.group(), ISO_FLEX_DATE));
			} catch (Exception ignored) {
			}
		}

		if (isStart && !exactDates.isEmpty()) {
			return exactDates.get(0);
		}
		if (!isStart && exactDates.size() > 1) {
			return exactDates.get(1);
		}

		warnings.add("Partial date encountered (" + dateRangeStr + "). Original text preserved; exact day requires candidate review.");
		return null;
	}
}
