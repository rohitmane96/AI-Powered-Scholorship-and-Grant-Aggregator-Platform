package com.scholarship.platform.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.scholarship.platform.model.Scholarship;
import com.scholarship.platform.model.enums.DegreeLevel;
import com.scholarship.platform.model.enums.FundingType;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * API representation of a Scholarship (no internal audit fields).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ScholarshipResponse {

    private String id;
    private String name;
    private String provider;
    private String description;
    private String country;
    private DegreeLevel degreeLevel;
    private String fieldOfStudy;
    private FundingType fundingType;
    private Scholarship.FundingAmount fundingAmount;
    private LocalDateTime deadline;
    private List<String> eligibility;
    private List<String> requirements;
    private String applicationUrl;
    private boolean featured;
    private boolean active;
    private List<String> tags;
    private int viewCount;
    private int applicationCount;

    /** Days until deadline (negative means past). */
    private long daysUntilDeadline;

    /** AI match score for the current user (only in recommendation context). */
    private Integer matchScore;

    /**
     * Per-criterion score breakdown – only populated in recommendation responses.
     * Keys: "country", "degreeLevel", "fieldOfStudy", "gpa", "fundingType",
     *       "tagMatch", "deadlineUrgency", "historyBoost"
     */
    private Map<String, Integer> scoreBreakdown;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
