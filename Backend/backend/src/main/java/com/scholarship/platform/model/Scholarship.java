package com.scholarship.platform.model;

import com.scholarship.platform.model.enums.DegreeLevel;
import com.scholarship.platform.model.enums.FundingType;
import lombok.*;
import org.springframework.data.annotation.*;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.index.TextIndexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Represents a scholarship / grant opportunity posted on the platform.
 */
@Document(collection = "scholarships")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Scholarship {

    @Id
    private String id;

    @TextIndexed(weight = 3)
    private String name;

    @TextIndexed(weight = 2)
    private String provider;

    @TextIndexed
    private String description;

    @Indexed
    private String country;

    @Indexed
    private DegreeLevel degreeLevel;

    @Indexed
    private String fieldOfStudy;

    private FundingType fundingType;

    private FundingAmount fundingAmount;

    @Indexed
    private LocalDateTime deadline;

    @Builder.Default
    private List<String> eligibility = new ArrayList<>();

    @Builder.Default
    private List<String> requirements = new ArrayList<>();

    private String applicationUrl;

    @Builder.Default
    private boolean featured = false;

    @Builder.Default
    private boolean active = true;

    @Builder.Default
    private List<String> tags = new ArrayList<>();

    @Builder.Default
    private int viewCount = 0;

    @Builder.Default
    private int applicationCount = 0;

    /** Reference to the User who created this scholarship. */
    private String createdBy;

    @Builder.Default
    private boolean deleted = false;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    // ── Nested classes ─────────────────────────────────────────────────────────

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FundingAmount {
        private Double min;
        private Double max;
        @Builder.Default
        private String currency = "USD";
    }
}
