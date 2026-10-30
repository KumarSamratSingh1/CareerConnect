package com.careerconnect.backend.dto.request.resume;

import java.util.List;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class ProjectImportItem {

	@NotNull(message = "selected flag is required")
	private Boolean selected;

	@Size(max = 200, message = "title must not exceed 200 characters")
	private String title;

	@Size(max = 3000, message = "description must not exceed 3000 characters")
	private String description;

	private List<@Size(max = 100, message = "technology name must not exceed 100 characters") String> technologies;
}
