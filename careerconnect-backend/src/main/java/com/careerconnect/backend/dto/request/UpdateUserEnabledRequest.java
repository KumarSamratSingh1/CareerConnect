package com.careerconnect.backend.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class UpdateUserEnabledRequest {

	@NotNull(message = "enabled must not be null")
	private Boolean enabled;
}
