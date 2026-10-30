package com.careerconnect.backend.entity;

import java.time.LocalDateTime;

import com.careerconnect.backend.common.enums.InterviewMode;
import com.careerconnect.backend.common.enums.InterviewStatus;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "interviews")
@Getter
@Setter
@NoArgsConstructor
public class Interview {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "application_id", nullable = false)
	private Application application;

	@Column(nullable = false)
	private LocalDateTime scheduledDateTime;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 30)
	private InterviewMode interviewMode;

	@Column(length = 500)
	private String meetingLink;

	@Column(length = 255)
	private String location;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 30)
	private InterviewStatus status = InterviewStatus.SCHEDULED;

	@Column(length = 2000)
	private String notes;

	@Column(nullable = false, updatable = false)
	private LocalDateTime createdAt;

	@Column(nullable = false)
	private LocalDateTime updatedAt;

	@PrePersist
	void onCreate() {
		if (status == null) {
			status = InterviewStatus.SCHEDULED;
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
