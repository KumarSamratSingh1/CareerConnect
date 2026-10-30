package com.careerconnect.backend.dto.request.resume;

import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class SocialLinksImportRequest {

	@Size(max = 500, message = "linkedIn url must not exceed 500 characters")
	private String linkedIn;

	@Size(max = 500, message = "gitHub url must not exceed 500 characters")
	private String gitHub;

	@Size(max = 500, message = "portfolio url must not exceed 500 characters")
	private String portfolio;
}
