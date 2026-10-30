package com.careerconnect.backend.dto.request.resume;

import java.util.List;

import jakarta.validation.Valid;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class ResumeImportRequest {

	@Valid
	private PersonalDetailsImportRequest personalDetails;

	private boolean approvePersonalDetailsOverwrite = false;

	@Valid
	private SocialLinksImportRequest socialLinks;

	private boolean approveSocialLinksOverwrite = false;

	@Valid
	private List<EducationImportItem> educations;

	@Valid
	private List<ExperienceImportItem> experiences;

	@Valid
	private List<SkillImportItem> skills;

	@Valid
	private List<ProjectImportItem> projects;

	@Valid
	private List<CertificationImportItem> certifications;
}
