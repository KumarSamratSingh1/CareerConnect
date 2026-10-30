package com.careerconnect.backend.entity;

import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "certifications")
@Getter
@Setter
@NoArgsConstructor
public class Certification {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "candidate_profile_id", nullable = false)
	private CandidateProfile candidateProfile;

	@Column(length = 200)
	private String name;

	@Column(name = "issuing_organization", length = 200)
	private String issuingOrganization;

	@Column(name = "issue_date")
	private LocalDate issueDate;

	@Column(name = "expiry_date")
	private LocalDate expiryDate;
}
