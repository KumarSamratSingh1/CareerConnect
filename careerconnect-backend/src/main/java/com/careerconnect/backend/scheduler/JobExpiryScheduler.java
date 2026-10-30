package com.careerconnect.backend.scheduler;

import java.time.LocalDate;
import java.util.List;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.careerconnect.backend.common.enums.JobStatus;
import com.careerconnect.backend.entity.Job;
import com.careerconnect.backend.repository.JobRepository;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class JobExpiryScheduler {

	private final JobRepository jobRepository;

	@Scheduled(cron = "0 0 0 * * *")
	@Transactional
	public void closeExpiredJobs() {
		List<Job> expiredOpenJobs = jobRepository.findByStatusAndApplicationDeadlineBefore(JobStatus.OPEN, LocalDate.now());
		for (Job job : expiredOpenJobs) {
			job.setStatus(JobStatus.CLOSED);
		}
		if (!expiredOpenJobs.isEmpty()) {
			jobRepository.saveAll(expiredOpenJobs);
		}
	}
}
