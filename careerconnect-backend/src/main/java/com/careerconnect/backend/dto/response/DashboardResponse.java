package com.careerconnect.backend.dto.response;

import java.util.Map;

import com.careerconnect.backend.common.enums.ApplicationStatus;
import com.careerconnect.backend.common.enums.InterviewStatus;

public record DashboardResponse(
		long totalUsers, long totalCandidates, long totalRecruiters, long totalAdmins, long enabledUsers, long disabledUsers,
		long totalCompanies, long verifiedCompanies, long unverifiedCompanies,
		long totalJobs, long openJobs, long closedJobs, long totalInternships, long totalRegularJobs,
		long totalApplications, Map<ApplicationStatus, Long> applicationsByStatus,
		long totalInterviews, Map<InterviewStatus, Long> interviewsByStatus
) {
}
