package com.careerconnect.backend.dto.request;

import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class ApplyJobRequest {

	@Size(max = 4000, message = "coverLetter must not exceed 4000 characters")
	private String coverLetter;
}
