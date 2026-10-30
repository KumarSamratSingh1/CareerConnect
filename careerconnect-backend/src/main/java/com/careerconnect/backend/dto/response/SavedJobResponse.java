package com.careerconnect.backend.dto.response;

import java.time.LocalDateTime;

public record SavedJobResponse(Long id, JobSummaryResponse job, LocalDateTime savedAt) {
}
