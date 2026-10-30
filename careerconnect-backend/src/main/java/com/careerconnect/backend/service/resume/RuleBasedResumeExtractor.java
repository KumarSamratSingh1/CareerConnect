package com.careerconnect.backend.service.resume;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.stereotype.Component;

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
import com.careerconnect.backend.repository.SkillRepository;

@Component
public class RuleBasedResumeExtractor {

	private final SkillRepository skillRepository;

	private static final Pattern EMAIL_PATTERN = Pattern.compile(
			"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}",
			Pattern.CASE_INSENSITIVE
	);

	private static final Pattern PHONE_PATTERN = Pattern.compile(
			"(?:Phone|Tel|Mobile|Cell)?[:\\s]*([+]?[0-9]{1,3}[-.\\s]*)?(?:\\([0-9]{2,4}\\)|[0-9]{2,4})[-.\\s]*[0-9]{3,4}(?:[-.\\s]*[0-9]{3,5})?"
	);

	private static final Pattern LINKEDIN_PATTERN = Pattern.compile(
			"(?:https?:\\/\\/)?(?:www\\.)?linkedin\\.com\\/in\\/([a-zA-Z0-9_-]+)",
			Pattern.CASE_INSENSITIVE
	);

	private static final Pattern GITHUB_PATTERN = Pattern.compile(
			"(?:https?:\\/\\/)?(?:www\\.)?github\\.com\\/([a-zA-Z0-9_-]+)",
			Pattern.CASE_INSENSITIVE
	);

	private static final Pattern URL_PATTERN = Pattern.compile(
			"https?:\\/\\/[^\\s/$.?#].[^\\s]*",
			Pattern.CASE_INSENSITIVE
	);

	// Date range detection (e.g., "Jan 2020 - Present", "2018 - 2022", "2018-08-01 to 2022-05-31", "06/2021 to 08/2023")
	private static final Pattern DATE_RANGE_PATTERN = Pattern.compile(
			"((?:(?:19|20)\\d{2}-(?:0?[1-9]|1[0-2])-(?:[12]\\d|3[01]|0?[1-9])(?!\\d))|" +
			"(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\\.?\\s+)?(?:19|20)\\d{2}(?!-\\d)|" +
			"(?:0?[1-9]|1[0-2])\\/(?:19|20)\\d{2})" +
			"\\s*(?:-|–|—|to)\\s*" +
			"((?:(?:19|20)\\d{2}-(?:0?[1-9]|1[0-2])-(?:[12]\\d|3[01]|0?[1-9])(?!\\d))|" +
			"(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\\.?\\s+)?(?:19|20)\\d{2}(?!-\\d)|" +
			"(?:0?[1-9]|1[0-2])\\/(?:19|20)\\d{2}|Present|Current|Ongoing|Expected|Now)",
			Pattern.CASE_INSENSITIVE
	);

	private static final Pattern EXACT_DATE_PATTERN = Pattern.compile(
			"\\b(?:19|20)\\d{2}-(?:0?[1-9]|1[0-2])-(?:[12]\\d|3[01]|0?[1-9])\\b"
	);
	private static final DateTimeFormatter ISO_FLEX_DATE = DateTimeFormatter.ofPattern("yyyy-M-d");

	private static final Map<String, String> SKILL_TAXONOMY = new LinkedHashMap<>();

	static {
		// Programming Languages
		for (String s : List.of("Java", "Python", "JavaScript", "TypeScript", "C++", "C#", "Golang", "Rust", "Kotlin", "Swift", "PHP", "Ruby", "Scala", "Dart", "R", "Bash", "Shell", "PowerShell")) {
			SKILL_TAXONOMY.put(s, "PROGRAMMING_LANGUAGE");
		}
		// Frameworks & Libraries
		for (String s : List.of("Spring", "Spring Boot", "Spring MVC", "Spring Security", "React", "React.js", "Angular", "Vue.js", "Vue", "Node.js", "Express", "Next.js", "Django", "Flask", "FastAPI", "ASP.NET", "Hibernate", "JPA", "Redux", "Tailwind CSS", "Bootstrap", "GraphQL")) {
			SKILL_TAXONOMY.put(s, "FRAMEWORK");
		}
		// Databases & Stores
		for (String s : List.of("MySQL", "PostgreSQL", "MongoDB", "Redis", "Oracle", "SQLite", "Cassandra", "Elasticsearch", "DynamoDB", "MariaDB", "Kafka", "RabbitMQ")) {
			SKILL_TAXONOMY.put(s, "DATABASE");
		}
		// Cloud & DevOps
		for (String s : List.of("AWS", "Azure", "GCP", "Google Cloud", "Docker", "Kubernetes", "CI/CD", "Jenkins", "GitHub Actions", "GitLab CI", "Terraform", "Ansible", "Linux", "Nginx")) {
			SKILL_TAXONOMY.put(s, "CLOUD_DEVOPS");
		}
		// Methodologies, Tools, Testing
		for (String s : List.of("Git", "GitHub", "Jira", "Postman", "REST", "REST API", "Microservices", "JUnit", "Mockito", "Agile", "Scrum", "Maven", "Gradle", "Selenium")) {
			SKILL_TAXONOMY.put(s, "TOOL");
		}
	}

	public RuleBasedResumeExtractor(SkillRepository skillRepository) {
		this.skillRepository = skillRepository;
	}

	public ResumeDraftResponse extract(
			String documentText,
			ResumeFileValidator.ValidatedFile fileMeta,
			List<String> parserWarnings
	) {
		List<String> warnings = new ArrayList<>(parserWarnings);
		String text = documentText != null ? documentText : "";

		Map<String, String> sections = segmentSections(text);

		// 1. Personal details
		PersonalDetailsDto personalDetails = extractPersonalDetails(text, sections, warnings);

		// 2. Professional summary
		ExtractedField<String> summary = extractProfessionalSummary(sections);

		// 3. Social links
		ExtractedSocialLinksDto socialLinks = extractSocialLinks(text);

		// 4. Skills
		List<ExtractedSkillDto> skills = extractSkills(text, sections);

		// 5. Education
		List<ExtractedEducationDto> educations = extractEducations(sections, warnings);

		// 6. Experience
		List<ExtractedExperienceDto> experiences = extractExperiences(sections, warnings);

		// 7. Projects
		List<ExtractedProjectDto> projects = extractProjects(sections);

		// 8. Certifications
		List<ExtractedCertificationDto> certifications = extractCertifications(sections);

		// Metadata
		ExtractionMetadataDto metadata = new ExtractionMetadataDto(
				fileMeta.sanitizedFileName(),
				fileMeta.format().name(),
				fileMeta.sizeBytes(),
				text.length(),
				"RULE_BASED_DETERMINISTIC",
				java.time.LocalDateTime.now()
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
				metadata
		);
	}

	private Map<String, String> segmentSections(String text) {
		Map<String, String> sections = new LinkedHashMap<>();
		if (text.isBlank()) {
			return sections;
		}

		String[] lines = text.split("\\r?\\n");
		String currentSection = "HEADER";
		StringBuilder currentContent = new StringBuilder();

		Pattern headerPattern = Pattern.compile(
				"^(?:(?:[0-9]\\.\\s*)?)(EDUCATION|EXPERIENCE|WORK EXPERIENCE|PROFESSIONAL EXPERIENCE|EMPLOYMENT HISTORY|" +
				"SKILLS|TECHNICAL SKILLS|PROJECTS|KEY PROJECTS|PERSONAL PROJECTS|CERTIFICATIONS|LICENSES|CERTIFICATES|" +
				"SUMMARY|PROFESSIONAL SUMMARY|ABOUT ME|PROFILE|OBJECTIVE)\\b.*$",
				Pattern.CASE_INSENSITIVE
		);

		for (String line : lines) {
			String trimmed = line.trim();
			Matcher m = headerPattern.matcher(trimmed);
			if (m.matches() && trimmed.length() < 60) {
				sections.put(currentSection, currentContent.toString().trim());
				currentSection = normalizeSectionName(m.group(1));
				currentContent = new StringBuilder();
			} else {
				currentContent.append(line).append("\n");
			}
		}
		sections.put(currentSection, currentContent.toString().trim());
		return sections;
	}

	private String normalizeSectionName(String raw) {
		String upper = raw.toUpperCase(Locale.ROOT);
		if (upper.contains("EDUCATION")) return "EDUCATION";
		if (upper.contains("EXPERIENCE") || upper.contains("EMPLOYMENT")) return "EXPERIENCE";
		if (upper.contains("SKILL")) return "SKILLS";
		if (upper.contains("PROJECT")) return "PROJECTS";
		if (upper.contains("CERTIF")) return "CERTIFICATIONS";
		if (upper.contains("SUMMARY") || upper.contains("ABOUT") || upper.contains("PROFILE") || upper.contains("OBJECTIVE")) return "SUMMARY";
		return upper;
	}

	private PersonalDetailsDto extractPersonalDetails(String fullText, Map<String, String> sections, List<String> warnings) {
		// Email
		String email = null;
		Matcher emailMatcher = EMAIL_PATTERN.matcher(fullText);
		if (emailMatcher.find()) {
			email = emailMatcher.group().trim();
		} else {
			warnings.add("No contact email address was found in the uploaded resume.");
		}

		// Phone
		String phone = null;
		Matcher phoneMatcher = PHONE_PATTERN.matcher(fullText);
		while (phoneMatcher.find()) {
			String rawMatch = phoneMatcher.group().trim();
			String candidate = rawMatch.replaceAll("^(?i)(?:Phone|Tel|Mobile|Cell)?[:\\s]*", "").trim();
			// Ensure it is not a pure 4-digit year or year range like "2020-2024"
			String digitsOnly = candidate.replaceAll("\\D", "");
			if (digitsOnly.length() >= 7 && digitsOnly.length() <= 15 && !candidate.matches("^(?:19|20)\\d{2}\\s*[-–]\\s*(?:19|20)?\\d{2}$")) {
				phone = candidate;
				break;
			}
		}

		// Full Name from HEADER section
		String fullName = null;
		String headerText = sections.getOrDefault("HEADER", "");
		String[] headerLines = headerText.split("\\r?\\n");
		for (String line : headerLines) {
			String trimmed = line.trim();
			if (trimmed.isBlank() || trimmed.contains("@") || trimmed.toLowerCase().contains("resume") ||
				trimmed.toLowerCase().contains("curriculum vitae") || trimmed.toLowerCase().contains("linkedin.com") ||
				trimmed.toLowerCase().contains("github.com") || trimmed.toLowerCase().contains("phone") ||
				trimmed.length() > 60 || trimmed.matches("^[0-9+\\-().\\s]+$")) {
				continue;
			}
			// Must have at least one space or standard name structure
			if (trimmed.matches("^[A-Z][a-zA-Z.'\\-]+(\\s+[A-Z][a-zA-Z.'\\-]+)+$") ||
				(trimmed.length() >= 3 && trimmed.split("\\s+").length <= 4 && !trimmed.contains(":") && !trimmed.contains("/"))) {
				fullName = trimmed;
				break;
			}
		}

		// Location
		String location = null;
		Pattern locationPattern = Pattern.compile("(?i)(?:Location|Address)?[:\\s]*([A-Z][a-zA-Z\\s]+,\\s*[A-Z]{2,}|[A-Z][a-zA-Z\\s]+,\\s*[A-Z][a-zA-Z\\s]+)");
		Matcher locMatcher = locationPattern.matcher(headerText);
		if (locMatcher.find()) {
			String locGroup = locMatcher.group(1).trim();
			if (locGroup.length() < 50 && !locGroup.toLowerCase().contains("university") && !locGroup.toLowerCase().contains("technologies")) {
				location = locGroup;
			}
		}

		return new PersonalDetailsDto(
				fullName != null ? ExtractedField.of(fullName, 0.85) : ExtractedField.empty(),
				email != null ? ExtractedField.of(email, 0.95) : ExtractedField.empty(),
				phone != null ? ExtractedField.of(phone, 0.85) : ExtractedField.empty(),
				location != null ? ExtractedField.of(location, 0.70, true) : ExtractedField.empty()
		);
	}

	private ExtractedField<String> extractProfessionalSummary(Map<String, String> sections) {
		String summary = sections.get("SUMMARY");
		if (summary != null && !summary.isBlank()) {
			String clean = summary.replaceAll("\\r?\\n", " ").trim();
			if (clean.length() > 2000) {
				clean = clean.substring(0, 2000).trim();
			}
			return ExtractedField.of(clean, 0.85);
		}
		return ExtractedField.empty();
	}

	private ExtractedSocialLinksDto extractSocialLinks(String text) {
		String linkedIn = null;
		Matcher liMatcher = LINKEDIN_PATTERN.matcher(text);
		if (liMatcher.find()) {
			linkedIn = "https://linkedin.com/in/" + liMatcher.group(1);
		}

		String gitHub = null;
		Matcher ghMatcher = GITHUB_PATTERN.matcher(text);
		if (ghMatcher.find()) {
			gitHub = "https://github.com/" + ghMatcher.group(1);
		}

		String portfolio = null;
		Matcher urlMatcher = URL_PATTERN.matcher(text);
		while (urlMatcher.find()) {
			String url = urlMatcher.group();
			String lower = url.toLowerCase(Locale.ROOT);
			if (!lower.contains("linkedin.com") && !lower.contains("github.com") &&
				!lower.contains("schema.org") && !lower.contains("w3.org") && !lower.contains("example.com")) {
				portfolio = url;
				break;
			}
		}

		return new ExtractedSocialLinksDto(
				linkedIn != null ? ExtractedField.of(linkedIn, 0.95) : ExtractedField.empty(),
				gitHub != null ? ExtractedField.of(gitHub, 0.95) : ExtractedField.empty(),
				portfolio != null ? ExtractedField.of(portfolio, 0.75, true) : ExtractedField.empty()
		);
	}

	private List<ExtractedSkillDto> extractSkills(String fullText, Map<String, String> sections) {
		Set<String> detectedNames = new LinkedHashSet<>();
		List<ExtractedSkillDto> result = new ArrayList<>();

		// 1. Search taxonomy in skills section first (higher confidence), then whole text
		String skillsSection = sections.getOrDefault("SKILLS", "");

		for (Map.Entry<String, String> entry : SKILL_TAXONOMY.entrySet()) {
			String skill = entry.getKey();
			String category = entry.getValue();

			Pattern p = Pattern.compile("\\b" + Pattern.quote(skill) + "\\b", Pattern.CASE_INSENSITIVE);
			if (p.matcher(skillsSection).find()) {
				if (detectedNames.add(skill.toLowerCase(Locale.ROOT))) {
					result.add(new ExtractedSkillDto(skill, category, 0.95));
				}
			} else if (p.matcher(fullText).find()) {
				if (detectedNames.add(skill.toLowerCase(Locale.ROOT))) {
					result.add(new ExtractedSkillDto(skill, category, 0.80));
				}
			}
		}

		// 2. Search registered skills from database
		try {
			skillRepository.findAll().forEach(dbSkill -> {
				String name = dbSkill.getName();
				if (name != null && !name.isBlank() && !detectedNames.contains(name.toLowerCase(Locale.ROOT))) {
					Pattern p = Pattern.compile("\\b" + Pattern.quote(name) + "\\b", Pattern.CASE_INSENSITIVE);
					if (p.matcher(fullText).find()) {
						if (detectedNames.add(name.toLowerCase(Locale.ROOT))) {
							result.add(new ExtractedSkillDto(name, "CUSTOM", 0.75));
						}
					}
				}
			});
		} catch (Exception ignored) {
			// gracefully handle when repository is mock or unavailable
		}

		return result;
	}

	private List<ExtractedEducationDto> extractEducations(Map<String, String> sections, List<String> warnings) {
		List<ExtractedEducationDto> list = new ArrayList<>();
		String eduText = sections.get("EDUCATION");
		if (eduText == null || eduText.isBlank()) {
			return list;
		}

		String[] blocks = eduText.split("\\n\\s*\\n");
		if (blocks.length == 1 && eduText.contains("\n")) {
			String[] candidateBlocks = eduText.split("(?m)(?=^\\s*(?:[•\\-*]|(?:Bachelor|Master|B\\.Tech|M\\.Tech|B\\.E|B\\.Sc|Ph\\.?D|Associate|Diploma)\\b))");
			if (candidateBlocks.length > 1) {
				blocks = candidateBlocks;
			}
		}

		for (String block : blocks) {
			if (block.isBlank()) continue;

			String institution = null;
			String degree = null;
			String fieldOfStudy = null;
			String rawDateRange = null;
			boolean currentlyStudying = false;

			Matcher dateMatcher = DATE_RANGE_PATTERN.matcher(block);
			if (dateMatcher.find()) {
				rawDateRange = dateMatcher.group().trim();
				String endStr = dateMatcher.group(2).toLowerCase(Locale.ROOT);
				if (endStr.contains("present") || endStr.contains("current") || endStr.contains("ongoing") || endStr.contains("now")) {
					currentlyStudying = true;
				}
			}

			// Institution heuristics
			Pattern instPattern = Pattern.compile("(?i)^.*\\b(University|College|Institute|School|Academy|Polytechnic)\\b.*$", Pattern.MULTILINE);
			Matcher instMatcher = instPattern.matcher(block);
			if (instMatcher.find()) {
				institution = instMatcher.group().trim();
			}

			// Degree heuristics
			Pattern degreePattern = Pattern.compile("(?i)\\b(Bachelor(?:'s)?|Master(?:'s)?|B\\.Tech|M\\.Tech|B\\.E\\.?|B\\.Sc\\.?|M\\.Sc\\.?|BCA|MCA|MBA|Ph\\.?D\\.?|Associate|Diploma)\\b.*");
			Matcher degMatcher = degreePattern.matcher(block);
			if (degMatcher.find()) {
				String matched = degMatcher.group().trim();
				// Split on " in " for field of study (e.g. "Bachelor of Technology in Computer Science")
				int inIdx = matched.toLowerCase().indexOf(" in ");
				if (inIdx > 0) {
					degree = matched.substring(0, inIdx).trim();
					fieldOfStudy = matched.substring(inIdx + 4).trim();
				} else {
					degree = matched;
				}
			}

			if (institution != null || degree != null) {
				// Exact date conversion: defensible only if exact YYYY-MM-DD was present
				LocalDate startDate = parseDefensibleDate(rawDateRange, true, warnings);
				LocalDate endDate = currentlyStudying ? null : parseDefensibleDate(rawDateRange, false, warnings);

				list.add(new ExtractedEducationDto(
						institution != null ? ExtractedField.of(cleanLength(institution, 200), 0.85) : ExtractedField.empty(),
						degree != null ? ExtractedField.of(cleanLength(degree, 150), 0.85) : ExtractedField.empty(),
						fieldOfStudy != null ? ExtractedField.of(cleanLength(fieldOfStudy, 150), 0.80) : ExtractedField.empty(),
						startDate != null ? ExtractedField.of(startDate, 0.90) : ExtractedField.of(null, 0.50, rawDateRange != null),
						endDate != null ? ExtractedField.of(endDate, 0.90) : ExtractedField.of(null, 0.50, rawDateRange != null && !currentlyStudying),
						rawDateRange,
						ExtractedField.of(currentlyStudying, 0.90)
				));
			}
		}

		return list;
	}

	private List<ExtractedExperienceDto> extractExperiences(Map<String, String> sections, List<String> warnings) {
		List<ExtractedExperienceDto> list = new ArrayList<>();
		String expText = sections.get("EXPERIENCE");
		if (expText == null || expText.isBlank()) {
			return list;
		}

		String[] blocks = expText.split("\\n\\s*\\n");
		if (blocks.length == 1 && expText.contains("\n")) {
			String[] candidateBlocks = expText.split("(?m)(?=^\\s*(?:[•\\-*]|(?:Senior|Junior|Lead|Principal|Chief)?\\s*(?:Software Engineer|Developer|Backend|Frontend|Full Stack|Data Scientist|DevOps|Manager|Intern|Architect|Consultant|Analyst)\\b))");
			if (candidateBlocks.length > 1) {
				blocks = candidateBlocks;
			}
		}

		Pattern titlePattern = Pattern.compile("(?i)\\b(Software Engineer|Developer|Backend|Frontend|Full Stack|Data Scientist|DevOps|Manager|Intern|Architect|Consultant|Analyst|Lead|Specialist|Administrator)\\b");

		for (String block : blocks) {
			if (block.isBlank()) continue;

			String jobTitle = null;
			String companyName = null;
			String rawDateRange = null;
			boolean currentlyWorking = false;

			Matcher dateMatcher = DATE_RANGE_PATTERN.matcher(block);
			if (dateMatcher.find()) {
				rawDateRange = dateMatcher.group().trim();
				String endStr = dateMatcher.group(2).toLowerCase(Locale.ROOT);
				if (endStr.contains("present") || endStr.contains("current") || endStr.contains("ongoing") || endStr.contains("now")) {
					currentlyWorking = true;
				}
			}

			String[] lines = block.split("\\r?\\n");
			for (String line : lines) {
				String trimmed = line.trim();
				Matcher tMatcher = titlePattern.matcher(trimmed);
				if (tMatcher.find() && jobTitle == null) {
					// Check for " at " or " - " company separation, e.g. "Software Engineer at Google"
					int atIdx = trimmed.toLowerCase().indexOf(" at ");
					int dashIdx = trimmed.indexOf(" - ");
					if (atIdx > 0) {
						jobTitle = trimmed.substring(0, atIdx).trim();
						companyName = trimmed.substring(atIdx + 4).trim();
					} else if (dashIdx > 0) {
						jobTitle = trimmed.substring(0, dashIdx).trim();
						companyName = trimmed.substring(dashIdx + 3).trim();
					} else {
						jobTitle = trimmed;
					}
					break;
				}
			}

			if (companyName == null && lines.length > 1) {
				// Second line often contains company if not on title line
				String line2 = lines[1].trim();
				if (!line2.isBlank() && !line2.startsWith("•") && !line2.startsWith("-") && line2.length() < 100) {
					companyName = line2;
				}
			}

			if (jobTitle != null || companyName != null) {
				LocalDate startDate = parseDefensibleDate(rawDateRange, true, warnings);
				LocalDate endDate = currentlyWorking ? null : parseDefensibleDate(rawDateRange, false, warnings);

				String description = cleanLength(block.replaceAll("\\r?\\n", " ").trim(), 2000);

				list.add(new ExtractedExperienceDto(
						companyName != null ? ExtractedField.of(cleanLength(companyName, 200), 0.80) : ExtractedField.empty(),
						jobTitle != null ? ExtractedField.of(cleanLength(jobTitle, 150), 0.85) : ExtractedField.empty(),
						ExtractedField.of(description, 0.75),
						startDate != null ? ExtractedField.of(startDate, 0.90) : ExtractedField.of(null, 0.50, rawDateRange != null),
						endDate != null ? ExtractedField.of(endDate, 0.90) : ExtractedField.of(null, 0.50, rawDateRange != null && !currentlyWorking),
						rawDateRange,
						ExtractedField.of(currentlyWorking, 0.90)
				));
			}
		}

		return list;
	}

	private List<ExtractedProjectDto> extractProjects(Map<String, String> sections) {
		List<ExtractedProjectDto> list = new ArrayList<>();
		String projText = sections.get("PROJECTS");
		if (projText == null || projText.isBlank()) {
			return list;
		}

		String[] blocks = projText.split("\\n\\s*\\n");
		for (String block : blocks) {
			if (block.isBlank()) continue;
			String[] lines = block.split("\\r?\\n");
			String title = lines[0].trim();

			// Detect technologies in project description
			List<String> techList = new ArrayList<>();
			for (String skill : SKILL_TAXONOMY.keySet()) {
				if (Pattern.compile("\\b" + Pattern.quote(skill) + "\\b", Pattern.CASE_INSENSITIVE).matcher(block).find()) {
					techList.add(skill);
				}
			}

			String desc = cleanLength(block.replaceAll("\\r?\\n", " ").trim(), 2000);
			list.add(new ExtractedProjectDto(
					ExtractedField.of(cleanLength(title, 150), 0.85),
					ExtractedField.of(desc, 0.75),
					techList
			));
		}
		return list;
	}

	private List<ExtractedCertificationDto> extractCertifications(Map<String, String> sections) {
		List<ExtractedCertificationDto> list = new ArrayList<>();
		String certText = sections.get("CERTIFICATIONS");
		if (certText == null || certText.isBlank()) {
			return list;
		}

		String[] lines = certText.split("\\r?\\n");
		for (String line : lines) {
			String trimmed = line.trim().replaceFirst("^[•\\-*]\\s*", "");
			if (trimmed.isBlank() || trimmed.length() < 3) continue;

			String name = trimmed;
			String org = null;

			if (trimmed.contains(" - ")) {
				String[] parts = trimmed.split(" - ", 2);
				String part0 = parts[0].trim();
				String part1 = parts[1].trim();

				if (isCertificationName(part0)) {
					name = part0;
					org = part1;
				} else if (isCertificationName(part1)) {
					name = part1;
					org = part0;
				} else if (isKnownCertificationOrg(part0)) {
					org = part0;
					name = part1;
				} else {
					name = part0;
					org = part1;
				}
			} else if (trimmed.toLowerCase().contains("aws") || trimmed.toLowerCase().contains("amazon")) {
				org = "Amazon Web Services (AWS)";
			} else if (trimmed.toLowerCase().contains("microsoft") || trimmed.toLowerCase().contains("azure")) {
				org = "Microsoft";
			} else if (trimmed.toLowerCase().contains("google") || trimmed.toLowerCase().contains("gcp")) {
				org = "Google Cloud";
			} else if (trimmed.toLowerCase().contains("oracle")) {
				org = "Oracle";
			}

			list.add(new ExtractedCertificationDto(
					ExtractedField.of(cleanLength(name, 150), 0.85),
					org != null ? ExtractedField.of(cleanLength(org, 150), 0.80) : ExtractedField.empty()
			));
		}
		return list;
	}

	private boolean isCertificationName(String text) {
		if (text == null) return false;
		String lower = text.toLowerCase(Locale.ROOT);
		return lower.contains("certif") || lower.contains("architect") || lower.contains("developer") ||
				lower.contains("engineer") || lower.contains("practitioner") || lower.contains("associate") ||
				lower.contains("professional") || lower.contains("specialist") || lower.contains("administrator") ||
				lower.contains("foundation") || lower.contains("expert");
	}

	private boolean isKnownCertificationOrg(String text) {
		if (text == null) return false;
		String lower = text.toLowerCase(Locale.ROOT);
		return lower.contains("amazon web services") || lower.contains("microsoft") ||
				lower.contains("google cloud") || lower.contains("oracle") || lower.contains("cisco") ||
				lower.contains("comptia") || lower.contains("scrum alliance") || lower.contains("coursera");
	}

	private LocalDate parseDefensibleDate(String dateRangeStr, boolean isStart, List<String> warnings) {
		if (dateRangeStr == null || dateRangeStr.isBlank()) {
			return null;
		}

		List<LocalDate> exactDates = new ArrayList<>();
		Matcher exactMatcher = EXACT_DATE_PATTERN.matcher(dateRangeStr);
		while (exactMatcher.find()) {
			try {
				exactDates.add(LocalDate.parse(exactMatcher.group(), ISO_FLEX_DATE));
			} catch (DateTimeParseException ignored) {
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

	private String cleanLength(String input, int maxLen) {
		if (input == null) return null;
		String trimmed = input.trim();
		return trimmed.length() > maxLen ? trimmed.substring(0, maxLen).trim() : trimmed;
	}
}
