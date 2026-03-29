package com.scholarship.platform.dto.response;

import com.scholarship.platform.model.enums.UserRole;
import lombok.*;

/**
 * Returned after a successful login or token refresh.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {

    private String   accessToken;
    private String   refreshToken;
    @Builder.Default
    private String   tokenType = "Bearer";
    private long     expiresIn;   // seconds

    private String   userId;
    private String   email;
    private String   fullName;
    private UserRole role;
    private boolean  verified;
    private int      profileCompletion;
    private String   verificationUrl;
}
