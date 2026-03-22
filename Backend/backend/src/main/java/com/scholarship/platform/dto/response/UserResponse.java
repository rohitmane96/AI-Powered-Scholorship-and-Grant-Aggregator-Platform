package com.scholarship.platform.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.scholarship.platform.model.User;
import com.scholarship.platform.model.enums.UserRole;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Public-facing representation of a User (no sensitive fields).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class UserResponse {

    private String   id;
    private String   fullName;
    private String   email;
    private UserRole role;
    private String   avatar;
    private boolean  verified;
    private int      profileCompletion;

    // Student fields
    private User.Education   education;
    private User.Preferences preferences;

    // Institution fields
    private String institutionName;
    private String institutionType;
    private String country;
    private String website;

    private LocalDateTime createdAt;
    private LocalDateTime lastLogin;
}
