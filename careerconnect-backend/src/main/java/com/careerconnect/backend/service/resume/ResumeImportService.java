package com.careerconnect.backend.service.resume;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.careerconnect.backend.dto.request.resume.CertificationImportItem;
import com.careerconnect.backend.dto.request.resume.EducationImportItem;
import com.careerconnect.backend.dto.request.resume.ExperienceImportItem;
import com.careerconnect.backend.dto.request.resume.PersonalDetailsImportRequest;
import com.careerconnect.backend.dto.request.resume.ProjectImportItem;
import com.careerconnect.backend.dto.request.resume.ResumeImportRequest;
import com.careerconnect.backend.dto.request.resume.SkillImportItem;
import com.careerconnect.backend.dto.request.resume.SocialLinksImportRequest;
import com.careerconnect.backend.dto.response.resume.ImportRecordError;
import com.careerconnect.backend.dto.response.resume.ImportSectionSummary;
import com.careerconnect.backend.dto.response.resume.ResumeImportResponse;
import com.careerconnect.backend.entity.CandidateProfile;
import com.careerconnect.backend.entity.Certification;
import com.careerconnect.backend.entity.Education;
import com.careerconnect.backend.entity.Experience;
import com.careerconnect.backend.entity.Project;
import com.careerconnect.backend.entity.Skill;
import com.careerconnect.backend.entity.User;
import com.careerconnect.backend.exception.ResourceNotFoundException;
import com.careerconnect.backend.repository.CandidateProfileRepository;
import com.careerconnect.backend.repository.CertificationRepository;
import com.careerconnect.backend.repository.EducationRepository;
import com.careerconnect.backend.repository.ExperienceRepository;
import com.careerconnect.backend.repository.ProjectRepository;
import com.careerconnect.backend.repository.SkillRepository;
import com.careerconnect.backend.service.CurrentUserService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class ResumeImportService {

	private final CurrentUserService currentUserService;
	private final CandidateProfileRepository candidateProfileRepository;
	private final EducationRepository educationRepository;
	private final ExperienceRepository experienceRepository;
	private final SkillRepository skillRepository;
	private final ProjectRepository projectRepository;
	private final CertificationRepository certificationRepository;

	@Transactional
	public ResumeImportResponse importResume(ResumeImportRequest request) {
		User currentUser = currentUserService.getCurrentUser();
		CandidateProfile profile = candidateProfileRepository.findByUserId(currentUser.getId())
				.orElseThrow(() -> new ResourceNotFoundException("Candidate profile not found. Please create your basic profile first."));

		List<ImportRecordError> errors = new ArrayList<>();

		ImportSectionSummary personalDetailsSummary = processPersonalDetails(profile, request, errors);
		ImportSectionSummary socialLinksSummary = processSocialLinks(profile, request, errors);
		ImportSectionSummary educationSummary = processEducations(profile, request.getEducations(), errors);
		ImportSectionSummary experienceSummary = processExperiences(profile, request.getExperiences(), errors);
		ImportSectionSummary skillSummary = processSkills(profile, request.getSkills(), errors);
		ImportSectionSummary projectSummary = processProjects(profile, request.getProjects(), errors);
		ImportSectionSummary certificationSummary = processCertifications(profile, request.getCertifications(), errors);

		candidateProfileRepository.save(profile);

		log.info("Candidate ID {} imported resume: educations={}, experiences={}, skills={}, projects={}, certifications={}",
				currentUser.getId(), educationSummary.imported(), experienceSummary.imported(),
				skillSummary.imported(), projectSummary.imported(), certificationSummary.imported());

		return new ResumeImportResponse(
				personalDetailsSummary,
				educationSummary,
				experienceSummary,
				skillSummary,
				projectSummary,
				certificationSummary,
				socialLinksSummary,
				errors
		);
	}

	private ImportSectionSummary processPersonalDetails(
			CandidateProfile profile,
			ResumeImportRequest request,
			List<ImportRecordError> errors
	) {
		PersonalDetailsImportRequest pd = request.getPersonalDetails();
		if (pd == null) {
			return new ImportSectionSummary(0, 0, 0);
		}

		boolean hasName = pd.getFullName() != null && !pd.getFullName().trim().isEmpty();
		boolean hasPhone = pd.getPhone() != null && !pd.getPhone().trim().isEmpty();

		if (!hasName && !hasPhone) {
			return new ImportSectionSummary(0, 0, 0);
		}

		int requested = 1;
		boolean conflict = false;

		if (hasName && profile.getFullName() != null && !profile.getFullName().trim().isEmpty()
				&& !profile.getFullName().trim().equalsIgnoreCase(pd.getFullName().trim())) {
			if (!request.isApprovePersonalDetailsOverwrite()) {
				errors.add(new ImportRecordError("personalDetails", 0, "Overwrite not approved for existing full name"));
				conflict = true;
			}
		}

		if (hasPhone && profile.getPhone() != null && !profile.getPhone().trim().isEmpty()
				&& !profile.getPhone().trim().equals(pd.getPhone().trim())) {
			if (!request.isApprovePersonalDetailsOverwrite()) {
				errors.add(new ImportRecordError("personalDetails", 0, "Overwrite not approved for existing phone number"));
				conflict = true;
			}
		}

		if (conflict) {
			return new ImportSectionSummary(requested, 0, 1);
		}

		if (hasName) {
			profile.setFullName(pd.getFullName().trim());
		}
		if (hasPhone) {
			profile.setPhone(pd.getPhone().trim());
		}

		return new ImportSectionSummary(requested, 1, 0);
	}

	private ImportSectionSummary processSocialLinks(
			CandidateProfile profile,
			ResumeImportRequest request,
			List<ImportRecordError> errors
	) {
		SocialLinksImportRequest sl = request.getSocialLinks();
		if (sl == null) {
			return new ImportSectionSummary(0, 0, 0);
		}

		boolean hasLinkedIn = sl.getLinkedIn() != null && !sl.getLinkedIn().trim().isEmpty();
		boolean hasGitHub = sl.getGitHub() != null && !sl.getGitHub().trim().isEmpty();
		boolean hasPortfolio = sl.getPortfolio() != null && !sl.getPortfolio().trim().isEmpty();

		if (!hasLinkedIn && !hasGitHub && !hasPortfolio) {
			return new ImportSectionSummary(0, 0, 0);
		}

		int requested = 1;
		boolean conflict = false;

		if (hasLinkedIn && profile.getLinkedInUrl() != null && !profile.getLinkedInUrl().trim().isEmpty()
				&& !profile.getLinkedInUrl().trim().equalsIgnoreCase(sl.getLinkedIn().trim())) {
			if (!request.isApproveSocialLinksOverwrite()) {
				errors.add(new ImportRecordError("socialLinks", 0, "Overwrite not approved for existing LinkedIn URL"));
				conflict = true;
			}
		}

		if (hasGitHub && profile.getGitHubUrl() != null && !profile.getGitHubUrl().trim().isEmpty()
				&& !profile.getGitHubUrl().trim().equalsIgnoreCase(sl.getGitHub().trim())) {
			if (!request.isApproveSocialLinksOverwrite()) {
				errors.add(new ImportRecordError("socialLinks", 0, "Overwrite not approved for existing GitHub URL"));
				conflict = true;
			}
		}

		if (hasPortfolio && profile.getPortfolioUrl() != null && !profile.getPortfolioUrl().trim().isEmpty()
				&& !profile.getPortfolioUrl().trim().equalsIgnoreCase(sl.getPortfolio().trim())) {
			if (!request.isApproveSocialLinksOverwrite()) {
				errors.add(new ImportRecordError("socialLinks", 0, "Overwrite not approved for existing portfolio URL"));
				conflict = true;
			}
		}

		if (conflict) {
			return new ImportSectionSummary(requested, 0, 1);
		}

		if (hasLinkedIn) {
			profile.setLinkedInUrl(sl.getLinkedIn().trim());
		}
		if (hasGitHub) {
			profile.setGitHubUrl(sl.getGitHub().trim());
		}
		if (hasPortfolio) {
			profile.setPortfolioUrl(sl.getPortfolio().trim());
		}

		return new ImportSectionSummary(requested, 1, 0);
	}

	private ImportSectionSummary processEducations(
			CandidateProfile profile,
			List<EducationImportItem> items,
			List<ImportRecordError> errors
	) {
		if (items == null || items.isEmpty()) {
			return new ImportSectionSummary(0, 0, 0);
		}

		List<Education> existingEducations = educationRepository.findByCandidateProfileIdOrderByIdAsc(profile.getId());
		Set<String> existingKeys = existingEducations.stream()
				.map(e -> buildEducationKey(e.getInstitution(), e.getDegree(), e.getFieldOfStudy(), e.getStartDate(), e.getEndDate(), e.getCurrentlyStudying()))
				.collect(Collectors.toSet());

		Set<String> withinRequestKeys = new HashSet<>();
		List<Education> toSave = new ArrayList<>();
		int requested = 0;
		int skipped = 0;

		LocalDate today = LocalDate.now();

		for (int i = 0; i < items.size(); i++) {
			EducationImportItem item = items.get(i);
			if (!Boolean.TRUE.equals(item.getSelected())) {
				continue;
			}
			requested++;

			String institution = item.getInstitution() != null ? item.getInstitution().trim() : "";
			String degree = item.getDegree() != null ? item.getDegree().trim() : "";

			if (institution.isEmpty()) {
				errors.add(new ImportRecordError("educations", i, "institution must not be blank"));
				skipped++;
				continue;
			}
			if (degree.isEmpty()) {
				errors.add(new ImportRecordError("educations", i, "degree must not be blank"));
				skipped++;
				continue;
			}

			boolean currentlyStudying = Boolean.TRUE.equals(item.getCurrentlyStudying());
			if (item.getStartDate() != null && item.getEndDate() != null && item.getStartDate().isAfter(item.getEndDate()) && !currentlyStudying) {
				errors.add(new ImportRecordError("educations", i, "startDate must not be after endDate"));
				skipped++;
				continue;
			}
			if (item.getEndDate() != null && item.getEndDate().isAfter(today) && !currentlyStudying) {
				errors.add(new ImportRecordError("educations", i, "endDate cannot be a future date when not currently enrolled"));
				skipped++;
				continue;
			}
			if (currentlyStudying && item.getEndDate() != null) {
				errors.add(new ImportRecordError("educations", i, "endDate must be null when currentlyStudying is true"));
				skipped++;
				continue;
			}

			String key = buildEducationKey(institution, degree, item.getFieldOfStudy(), item.getStartDate(), item.getEndDate(), currentlyStudying);

			if (withinRequestKeys.contains(key)) {
				errors.add(new ImportRecordError("educations", i, "Duplicate education within import request"));
				skipped++;
				continue;
			}
			withinRequestKeys.add(key);

			if (existingKeys.contains(key)) {
				errors.add(new ImportRecordError("educations", i, "Education record already exists in candidate profile"));
				skipped++;
				continue;
			}

			Education education = new Education();
			education.setCandidateProfile(profile);
			education.setInstitution(institution);
			education.setDegree(degree);
			education.setFieldOfStudy(item.getFieldOfStudy() != null && !item.getFieldOfStudy().trim().isEmpty() ? item.getFieldOfStudy().trim() : null);
			education.setStartDate(item.getStartDate());
			education.setEndDate(currentlyStudying ? null : item.getEndDate());
			education.setCurrentlyStudying(currentlyStudying);
			toSave.add(education);
		}

		if (!toSave.isEmpty()) {
			educationRepository.saveAll(toSave);
		}

		return new ImportSectionSummary(requested, toSave.size(), skipped);
	}

	private ImportSectionSummary processExperiences(
			CandidateProfile profile,
			List<ExperienceImportItem> items,
			List<ImportRecordError> errors
	) {
		if (items == null || items.isEmpty()) {
			return new ImportSectionSummary(0, 0, 0);
		}

		List<Experience> existingExperiences = experienceRepository.findByCandidateProfileIdOrderByIdAsc(profile.getId());
		Set<String> existingKeys = existingExperiences.stream()
				.map(e -> buildExperienceKey(e.getCompanyName(), e.getJobTitle(), e.getStartDate(), e.getEndDate(), e.getCurrentlyWorking()))
				.collect(Collectors.toSet());

		Set<String> withinRequestKeys = new HashSet<>();
		List<Experience> toSave = new ArrayList<>();
		int requested = 0;
		int skipped = 0;

		LocalDate today = LocalDate.now();

		for (int i = 0; i < items.size(); i++) {
			ExperienceImportItem item = items.get(i);
			if (!Boolean.TRUE.equals(item.getSelected())) {
				continue;
			}
			requested++;

			String companyName = item.getCompanyName() != null ? item.getCompanyName().trim() : "";
			String jobTitle = item.getJobTitle() != null ? item.getJobTitle().trim() : "";

			if (companyName.isEmpty()) {
				errors.add(new ImportRecordError("experiences", i, "companyName must not be blank"));
				skipped++;
				continue;
			}
			if (jobTitle.isEmpty()) {
				errors.add(new ImportRecordError("experiences", i, "jobTitle must not be blank"));
				skipped++;
				continue;
			}

			boolean currentlyWorking = Boolean.TRUE.equals(item.getCurrentlyWorking());
			if (item.getStartDate() != null && item.getEndDate() != null && item.getStartDate().isAfter(item.getEndDate()) && !currentlyWorking) {
				errors.add(new ImportRecordError("experiences", i, "startDate must not be after endDate"));
				skipped++;
				continue;
			}
			if (item.getEndDate() != null && item.getEndDate().isAfter(today) && !currentlyWorking) {
				errors.add(new ImportRecordError("experiences", i, "endDate cannot be a future date when not currently working"));
				skipped++;
				continue;
			}
			if (currentlyWorking && item.getEndDate() != null) {
				errors.add(new ImportRecordError("experiences", i, "endDate must be null when currentlyWorking is true"));
				skipped++;
				continue;
			}

			String key = buildExperienceKey(companyName, jobTitle, item.getStartDate(), item.getEndDate(), currentlyWorking);

			if (withinRequestKeys.contains(key)) {
				errors.add(new ImportRecordError("experiences", i, "Duplicate experience within import request"));
				skipped++;
				continue;
			}
			withinRequestKeys.add(key);

			if (existingKeys.contains(key)) {
				errors.add(new ImportRecordError("experiences", i, "Experience record already exists in candidate profile"));
				skipped++;
				continue;
			}

			Experience experience = new Experience();
			experience.setCandidateProfile(profile);
			experience.setCompanyName(companyName);
			experience.setJobTitle(jobTitle);
			experience.setDescription(item.getDescription() != null && !item.getDescription().trim().isEmpty() ? item.getDescription().trim() : null);
			experience.setStartDate(item.getStartDate());
			experience.setEndDate(currentlyWorking ? null : item.getEndDate());
			experience.setCurrentlyWorking(currentlyWorking);
			toSave.add(experience);
		}

		if (!toSave.isEmpty()) {
			experienceRepository.saveAll(toSave);
		}

		return new ImportSectionSummary(requested, toSave.size(), skipped);
	}

	private ImportSectionSummary processSkills(
			CandidateProfile profile,
			List<SkillImportItem> items,
			List<ImportRecordError> errors
	) {
		if (items == null || items.isEmpty()) {
			return new ImportSectionSummary(0, 0, 0);
		}

		Set<String> existingSkillNames = profile.getSkills().stream()
				.map(s -> s.getName().toLowerCase(Locale.ROOT))
				.collect(Collectors.toSet());

		Set<String> withinRequestSkillNames = new HashSet<>();
		int requested = 0;
		int imported = 0;
		int skipped = 0;

		for (int i = 0; i < items.size(); i++) {
			SkillImportItem item = items.get(i);
			if (!Boolean.TRUE.equals(item.getSelected())) {
				continue;
			}
			requested++;

			String rawName = item.getName() != null ? item.getName().trim() : "";
			if (rawName.isEmpty()) {
				errors.add(new ImportRecordError("skills", i, "Skill name must not be blank"));
				skipped++;
				continue;
			}

			String normalized = rawName.toLowerCase(Locale.ROOT);

			if (withinRequestSkillNames.contains(normalized)) {
				errors.add(new ImportRecordError("skills", i, "Duplicate skill within import request: " + rawName));
				skipped++;
				continue;
			}
			withinRequestSkillNames.add(normalized);

			if (existingSkillNames.contains(normalized)) {
				errors.add(new ImportRecordError("skills", i, "Skill already attached to profile: " + rawName));
				skipped++;
				continue;
			}

			Skill skill = skillRepository.findByName(normalized)
					.orElseGet(() -> {
						Skill newSkill = new Skill();
						newSkill.setName(normalized);
						return skillRepository.save(newSkill);
					});

			profile.getSkills().add(skill);
			existingSkillNames.add(normalized);
			imported++;
		}

		return new ImportSectionSummary(requested, imported, skipped);
	}

	private ImportSectionSummary processProjects(
			CandidateProfile profile,
			List<ProjectImportItem> items,
			List<ImportRecordError> errors
	) {
		if (items == null || items.isEmpty()) {
			return new ImportSectionSummary(0, 0, 0);
		}

		List<Project> existingProjects = projectRepository.findByCandidateProfileIdOrderByIdAsc(profile.getId());
		Set<String> existingTitles = existingProjects.stream()
				.map(p -> p.getTitle() != null ? p.getTitle().trim().toLowerCase(Locale.ROOT) : "")
				.filter(t -> !t.isEmpty())
				.collect(Collectors.toSet());

		Set<String> withinRequestTitles = new HashSet<>();
		List<Project> toSave = new ArrayList<>();
		int requested = 0;
		int skipped = 0;

		for (int i = 0; i < items.size(); i++) {
			ProjectImportItem item = items.get(i);
			if (!Boolean.TRUE.equals(item.getSelected())) {
				continue;
			}
			requested++;

			String title = item.getTitle() != null ? item.getTitle().trim() : "";
			if (title.isEmpty()) {
				errors.add(new ImportRecordError("projects", i, "Project title must not be blank"));
				skipped++;
				continue;
			}

			String normalizedTitle = title.toLowerCase(Locale.ROOT);

			if (withinRequestTitles.contains(normalizedTitle)) {
				errors.add(new ImportRecordError("projects", i, "Duplicate project title within import request: " + title));
				skipped++;
				continue;
			}
			withinRequestTitles.add(normalizedTitle);

			if (existingTitles.contains(normalizedTitle)) {
				errors.add(new ImportRecordError("projects", i, "Project with this title already exists in candidate profile"));
				skipped++;
				continue;
			}

			Project project = new Project();
			project.setCandidateProfile(profile);
			project.setTitle(title);
			project.setDescription(item.getDescription() != null && !item.getDescription().trim().isEmpty() ? item.getDescription().trim() : null);

			if (item.getTechnologies() != null && !item.getTechnologies().isEmpty()) {
				String techString = item.getTechnologies().stream()
						.filter(Objects::nonNull)
						.map(String::trim)
						.map(t -> t.toLowerCase(Locale.ROOT))
						.filter(t -> !t.isEmpty())
						.distinct()
						.collect(Collectors.joining(","));
				project.setTechnologies(techString.isEmpty() ? null : techString);
			}

			toSave.add(project);
		}

		if (!toSave.isEmpty()) {
			projectRepository.saveAll(toSave);
		}

		return new ImportSectionSummary(requested, toSave.size(), skipped);
	}

	private ImportSectionSummary processCertifications(
			CandidateProfile profile,
			List<CertificationImportItem> items,
			List<ImportRecordError> errors
	) {
		if (items == null || items.isEmpty()) {
			return new ImportSectionSummary(0, 0, 0);
		}

		List<Certification> existingCerts = certificationRepository.findByCandidateProfileIdOrderByIdAsc(profile.getId());
		Set<String> existingKeys = existingCerts.stream()
				.map(c -> buildCertificationKey(c.getName(), c.getIssuingOrganization()))
				.collect(Collectors.toSet());

		Set<String> withinRequestKeys = new HashSet<>();
		List<Certification> toSave = new ArrayList<>();
		int requested = 0;
		int skipped = 0;

		for (int i = 0; i < items.size(); i++) {
			CertificationImportItem item = items.get(i);
			if (!Boolean.TRUE.equals(item.getSelected())) {
				continue;
			}
			requested++;

			String name = item.getName() != null ? item.getName().trim() : "";
			if (name.isEmpty()) {
				errors.add(new ImportRecordError("certifications", i, "Certification name must not be blank"));
				skipped++;
				continue;
			}

			if (item.getIssueDate() != null && item.getExpiryDate() != null && item.getIssueDate().isAfter(item.getExpiryDate())) {
				errors.add(new ImportRecordError("certifications", i, "issueDate must not be after expiryDate"));
				skipped++;
				continue;
			}

			String key = buildCertificationKey(name, item.getIssuingOrganization());

			if (withinRequestKeys.contains(key)) {
				errors.add(new ImportRecordError("certifications", i, "Duplicate certification within import request: " + name));
				skipped++;
				continue;
			}
			withinRequestKeys.add(key);

			if (existingKeys.contains(key)) {
				errors.add(new ImportRecordError("certifications", i, "Certification already exists in candidate profile"));
				skipped++;
				continue;
			}

			Certification cert = new Certification();
			cert.setCandidateProfile(profile);
			cert.setName(name);
			cert.setIssuingOrganization(item.getIssuingOrganization() != null && !item.getIssuingOrganization().trim().isEmpty() ? item.getIssuingOrganization().trim() : null);
			cert.setIssueDate(item.getIssueDate());
			cert.setExpiryDate(item.getExpiryDate());
			toSave.add(cert);
		}

		if (!toSave.isEmpty()) {
			certificationRepository.saveAll(toSave);
		}

		return new ImportSectionSummary(requested, toSave.size(), skipped);
	}

	private String buildEducationKey(String institution, String degree, String fieldOfStudy, LocalDate startDate, LocalDate endDate, Boolean currentlyStudying) {
		String inst = institution != null ? institution.trim().toLowerCase(Locale.ROOT) : "";
		String deg = degree != null ? degree.trim().toLowerCase(Locale.ROOT) : "";
		String field = fieldOfStudy != null ? fieldOfStudy.trim().toLowerCase(Locale.ROOT) : "";
		String start = startDate != null ? startDate.getYear() + "-" + startDate.getMonthValue() : "";
		String end = Boolean.TRUE.equals(currentlyStudying) ? "present" : (endDate != null ? endDate.getYear() + "-" + endDate.getMonthValue() : "");
		return inst + "|" + deg + "|" + field + "|" + start + "|" + end;
	}

	private String buildExperienceKey(String companyName, String jobTitle, LocalDate startDate, LocalDate endDate, Boolean currentlyWorking) {
		String comp = companyName != null ? companyName.trim().toLowerCase(Locale.ROOT) : "";
		String title = jobTitle != null ? jobTitle.trim().toLowerCase(Locale.ROOT) : "";
		String start = startDate != null ? startDate.getYear() + "-" + startDate.getMonthValue() : "";
		String end = Boolean.TRUE.equals(currentlyWorking) ? "present" : (endDate != null ? endDate.getYear() + "-" + endDate.getMonthValue() : "");
		String working = String.valueOf(Boolean.TRUE.equals(currentlyWorking));
		return comp + "|" + title + "|" + start + "|" + end + "|" + working;
	}

	private String buildCertificationKey(String name, String issuingOrganization) {
		String certName = name != null ? name.trim().toLowerCase(Locale.ROOT) : "";
		String org = issuingOrganization != null ? issuingOrganization.trim().toLowerCase(Locale.ROOT) : "";
		return certName + "|" + org;
	}
}
