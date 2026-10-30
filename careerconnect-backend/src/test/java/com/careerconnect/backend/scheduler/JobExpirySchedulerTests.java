package com.careerconnect.backend.scheduler;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import com.careerconnect.backend.common.enums.JobStatus;
import com.careerconnect.backend.entity.Job;
import com.careerconnect.backend.repository.JobRepository;

class JobExpirySchedulerTests {

	@Test
	void schedulerClosesExpiredOpenJobs() {
		JobRepository jobRepository = Mockito.mock(JobRepository.class);
		JobExpiryScheduler scheduler = new JobExpiryScheduler(jobRepository);
		Job expiredJob = new Job();
		expiredJob.setStatus(JobStatus.OPEN);
		when(jobRepository.findByStatusAndApplicationDeadlineBefore(JobStatus.OPEN, LocalDate.now()))
				.thenReturn(List.of(expiredJob));

		scheduler.closeExpiredJobs();

		assertEquals(JobStatus.CLOSED, expiredJob.getStatus());
		verify(jobRepository).saveAll(List.of(expiredJob));
	}

	@Test
	void schedulerDoesNotModifyJobsWithoutExpiredOpenDeadline() {
		JobRepository jobRepository = Mockito.mock(JobRepository.class);
		JobExpiryScheduler scheduler = new JobExpiryScheduler(jobRepository);
		when(jobRepository.findByStatusAndApplicationDeadlineBefore(JobStatus.OPEN, LocalDate.now()))
				.thenReturn(List.of());

		scheduler.closeExpiredJobs();

		verify(jobRepository, never()).saveAll(org.mockito.ArgumentMatchers.any());
	}

	@Test
	void schedulerKeepsJobsOpenOnTheirDeadlineDate() {
		JobRepository jobRepository = Mockito.mock(JobRepository.class);
		JobExpiryScheduler scheduler = new JobExpiryScheduler(jobRepository);
		Job jobDueToday = new Job();
		jobDueToday.setApplicationDeadline(LocalDate.now());
		jobDueToday.setStatus(JobStatus.OPEN);
		when(jobRepository.findByStatusAndApplicationDeadlineBefore(JobStatus.OPEN, LocalDate.now())).thenReturn(List.of());

		scheduler.closeExpiredJobs();

		assertEquals(JobStatus.OPEN, jobDueToday.getStatus());
	}

	@Test
	void schedulerLeavesJobsWithoutDeadlinesAndClosedJobsUnchanged() {
		JobRepository jobRepository = Mockito.mock(JobRepository.class);
		JobExpiryScheduler scheduler = new JobExpiryScheduler(jobRepository);
		Job jobWithoutDeadline = new Job();
		jobWithoutDeadline.setStatus(JobStatus.OPEN);
		Job closedJob = new Job();
		closedJob.setApplicationDeadline(LocalDate.now().minusDays(1));
		closedJob.setStatus(JobStatus.CLOSED);
		when(jobRepository.findByStatusAndApplicationDeadlineBefore(JobStatus.OPEN, LocalDate.now())).thenReturn(List.of());

		scheduler.closeExpiredJobs();

		assertEquals(JobStatus.OPEN, jobWithoutDeadline.getStatus());
		assertEquals(JobStatus.CLOSED, closedJob.getStatus());
	}
}
