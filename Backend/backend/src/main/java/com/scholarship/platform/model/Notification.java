package com.scholarship.platform.model;

import lombok.*;
import org.springframework.data.annotation.*;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * In-app notification sent to a user.
 */
@Document(collection = "notifications")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Notification {

    @Id
    private String id;

    @Indexed
    private String userId;

    /** Notification category (e.g. APPLICATION_STATUS, DEADLINE_REMINDER). */
    private String type;
    private String title;
    private String message;

    /** Optional metadata (scholarshipId, applicationId, etc.). */
    private Map<String, Object> data;

    @Builder.Default
    private boolean read = false;

    @CreatedDate
    private LocalDateTime createdAt;
}
