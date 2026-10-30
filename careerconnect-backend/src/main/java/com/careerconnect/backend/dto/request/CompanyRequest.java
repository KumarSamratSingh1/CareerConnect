package com.careerconnect.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class CompanyRequest {

	@NotBlank(message = "name must not be blank")
	@Size(max = 200, message = "name must not exceed 200 characters")
	private String name;

	@Size(max = 2000, message = "description must not exceed 2000 characters")
	private String description;

	@Size(max = 255, message = "website must not exceed 255 characters")
	@Pattern(regexp = "https?://\\S+", message = "website must be a valid URL")
	private String website;

	@NotBlank(message = "location must not be blank")
	@Size(max = 150, message = "location must not exceed 150 characters")
	private String location;

	@NotBlank(message = "industry must not be blank")
	@Size(max = 100, message = "industry must not exceed 100 characters")
	private String industry;
}
