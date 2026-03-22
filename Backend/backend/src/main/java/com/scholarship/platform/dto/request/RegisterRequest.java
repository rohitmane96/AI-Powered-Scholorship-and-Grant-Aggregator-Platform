package com.scholarship.platform.dto.request;

import com.scholarship.platform.model.enums.UserRole;
import jakarta.validation.constraints.*;
import lombok.Data;

/**
 * Payload for POST /api/auth/register.
 */
@Data
public class RegisterRequest {

    @NotBlank(message = "Full name is required")
    @Size(min = 2, max = 100, message = "Full name must be between 2 and 100 characters")
    private String fullName;

    @NotBlank(message = "Email is required")
    @Email(message = "Please provide a valid email address")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 8, max = 60, message = "Password must be between 8 and 60 characters")
    @Pattern(
        regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).*$",
        message = "Password must contain at least one uppercase letter, one lowercase letter, and one digit"
    )
    private String password;

    @NotNull(message = "Role is required")
    private UserRole role;

    // Optional institution fields (required when role = INSTITUTION)
    private String institutionName;
    private String institutionType;
    private String country;
}
