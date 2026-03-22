package com.scholarship.platform.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.scholarship.platform.model.Application;
import com.scholarship.platform.model.enums.ApplicationStatus;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

/**
 * API representation of an Application.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApplicationResponse {

    private String id;
    private String scholarshipId;
    private String userId;
    private ApplicationStatus status;
    private int matchScore;
    private List<Application.DocumentRequirement> documents;
    private List<Application.TimelineEvent> timeline;
    private String notes;
    private LocalDateTime submittedAt;
    private LocalDateTime reviewedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /** Populated when fetching with scholarship details. */
    private ScholarshipResponse scholarship;
}
