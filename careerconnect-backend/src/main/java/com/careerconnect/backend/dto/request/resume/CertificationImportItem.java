package com.careerconnect.backend.dto.request.resume;

import java.time.LocalDate;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class CertificationImportItem {

	@NotNull(message = "selected flag is required")
	private Boolean selected;

	@Size(max = 200, message = "certification name must not exceed 200 characters")
	private String name;

	@Size(max = 200, message = "issuingOrganization must not exceed 200 characters")
	private String issuingOrganization;

	private LocalDate issueDate;

	private LocalDate expiryDate;
}
