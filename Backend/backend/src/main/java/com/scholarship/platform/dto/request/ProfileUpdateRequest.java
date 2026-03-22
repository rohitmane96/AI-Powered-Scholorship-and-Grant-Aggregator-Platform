package com.scholarship.platform.dto.request;

import com.scholarship.platform.model.User;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Payload for PUT /api/users/me.
 */
@Data
public class ProfileUpdateRequest {

    @Size(min = 2, max = 100, message = "Full name must be between 2 and 100 characters")
    private String fullName;

    private User.Education   education;
    private User.Preferences preferences;

    // Institution fields
    private String institutionName;
    private String institutionType;
    private String country;
    private String website;
}
