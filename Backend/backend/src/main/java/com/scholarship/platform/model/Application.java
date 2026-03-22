package com.scholarship.platform.model;

import com.scholarship.platform.model.enums.ApplicationStatus;
import com.scholarship.platform.model.enums.DocumentType;
import lombok.*;
import org.springframework.data.annotation.*;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Tracks a student's application for a specific scholarship.
 */
@Document(collection = "applications")
@CompoundIndex(name = "user_scholarship_idx", def = "{'userId': 1, 'scholarshipId': 1}", unique = true)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Application {

    @Id
    private String id;

    @Indexed
    private String scholarshipId;

    @Indexed
    private String userId;

    @Builder.Default
    private ApplicationStatus status = ApplicationStatus.DRAFT;

    /** AI-calculated match score (0–100). */
    @Builder.Default
    private int matchScore = 0;

    @Builder.Default
    private List<DocumentRequirement> documents = new ArrayList<>();

    @Builder.Default
    private List<TimelineEvent> timeline = new ArrayList<>();

    private String notes;
    private LocalDateTime submittedAt;
    private LocalDateTime reviewedAt;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    @CreatedBy
    private String createdBy;

    @LastModifiedBy
    private String updatedBy;

    // ── Nested classes ─────────────────────────────────────────────────────────

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DocumentRequirement {
        private DocumentType type;
        private String documentId;
        @Builder.Default
        private boolean uploaded = false;
        @Builder.Default
        private boolean verified = false;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TimelineEvent {
        private ApplicationStatus status;
        private LocalDateTime timestamp;
        private String note;
        private String actorId;
    }
}
