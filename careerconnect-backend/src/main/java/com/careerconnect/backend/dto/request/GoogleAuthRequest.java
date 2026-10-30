package com.careerconnect.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class GoogleAuthRequest {

	@NotBlank(message = "idToken must not be blank")
	private String idToken;

	public void setCredential(String credential) {
		if (this.idToken == null || this.idToken.isBlank()) {
			this.idToken = credential;
		}
	}

	public String getCredential() {
		return this.idToken;
	}
}
