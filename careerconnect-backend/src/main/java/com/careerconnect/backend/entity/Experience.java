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
@Table(name = "experiences")
@Getter
@Setter
@NoArgsConstructor
public class Experience {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "candidate_profile_id", nullable = false)
	private CandidateProfile candidateProfile;

	@Column(nullable = false, length = 200)
	private String companyName;

	@Column(nullable = false, length = 150)
	private String jobTitle;

	@Column(length = 2000)
	private String description;

	private LocalDate startDate;

	private LocalDate endDate;

	@Column(nullable = false)
	private Boolean currentlyWorking = false;
}
