package com.scholarship.platform.model;

import com.scholarship.platform.model.enums.DegreeLevel;
import com.scholarship.platform.model.enums.FundingType;
import com.scholarship.platform.model.enums.UserRole;
import lombok.*;
import org.springframework.data.annotation.*;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Represents a platform user (Student, Institution, or Admin).
 */
@Document(collection = "users")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    private String id;

    private String fullName;

    @Indexed(unique = true)
    private String email;

    private String password;

    @Builder.Default
    private UserRole role = UserRole.STUDENT;

    private String avatar;

    @Builder.Default
    private boolean verified = false;

    private String verificationToken;
    private String passwordResetToken;
    private LocalDateTime passwordResetExpiry;

    // ── Student-specific fields ────────────────────────────────────────────────
    private Education education;
    private Preferences preferences;

    @Builder.Default
    private int profileCompletion = 0;

    // ── Institution-specific fields ────────────────────────────────────────────
    private String institutionName;
    private String institutionType;
    private String country;
    private String website;

    // ── Audit fields ───────────────────────────────────────────────────────────
    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    @CreatedBy
    private String createdBy;

    @LastModifiedBy
    private String updatedBy;

    private LocalDateTime lastLogin;

    @Builder.Default
    private boolean deleted = false;

    // ── Nested classes ─────────────────────────────────────────────────────────

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Education {
        private DegreeLevel level;
        private String fieldOfStudy;
        private Double currentGPA;
        private Integer graduationYear;
        private String institution;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Preferences {
        @Builder.Default
        private List<String> targetCountries = new ArrayList<>();
        private DegreeLevel degreeLevel;
        @Builder.Default
        private List<FundingType> fundingTypes = new ArrayList<>();
        @Builder.Default
        private List<String> fieldsOfStudy = new ArrayList<>();
    }
}
