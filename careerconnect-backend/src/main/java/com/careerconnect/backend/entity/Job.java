package com.careerconnect.backend.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

import com.careerconnect.backend.common.enums.EmploymentType;
import com.careerconnect.backend.common.enums.JobStatus;
import com.careerconnect.backend.common.enums.JobType;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "jobs")
@Getter
@Setter
@NoArgsConstructor
public class Job {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "company_id", nullable = false)
	private Company company;

	@Column(nullable = false, length = 200)
	private String title;

	@Column(nullable = false, length = 5000)
	private String description;

	@Column(length = 150)
	private String location;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 30)
	private JobType jobType;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 30)
	private EmploymentType employmentType;

	private Integer minSalary;

	private Integer maxSalary;

	private Integer minExperience;

	private LocalDate applicationDeadline;

	@Column(length = 50)
	private String duration;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 30)
	private JobStatus status = JobStatus.OPEN;

	@Column(nullable = false, updatable = false)
	private LocalDateTime createdAt;

	@Column(nullable = false)
	private LocalDateTime updatedAt;

	@ManyToMany(fetch = FetchType.LAZY)
	@JoinTable(
			name = "job_skills",
			joinColumns = @JoinColumn(name = "job_id"),
			inverseJoinColumns = @JoinColumn(name = "skill_id")
	)
	private Set<Skill> requiredSkills = new HashSet<>();

	@PrePersist
	void onCreate() {
		if (status == null) {
			status = JobStatus.OPEN;
		}
		LocalDateTime now = LocalDateTime.now();
		createdAt = now;
		updatedAt = now;
	}

	@PreUpdate
	void onUpdate() {
		updatedAt = LocalDateTime.now();
	}
}
