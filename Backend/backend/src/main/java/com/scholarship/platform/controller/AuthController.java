package com.scholarship.platform.controller;

import com.scholarship.platform.dto.request.LoginRequest;
import com.scholarship.platform.dto.request.RegisterRequest;
import com.scholarship.platform.dto.response.ApiResponse;
import com.scholarship.platform.dto.response.AuthResponse;
import com.scholarship.platform.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.Map;

/**
 * Authentication endpoints – registration, login, token refresh,
 * email verification, and password management.
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Register, login, and manage credentials")
public class AuthController {

    private final AuthService authService;

    @Operation(summary = "Register a new user account")
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(
            @Valid @RequestBody RegisterRequest request,
            HttpServletRequest httpRequest) {

        AuthResponse response = authService.register(request, resolveFrontendUrl(httpRequest));
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Account created successfully. Please verify your email.", response));
    }

    @Operation(summary = "Authenticate and receive JWT tokens")
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody LoginRequest request) {

        return ResponseEntity.ok(ApiResponse.ok("Login successful", authService.login(request)));
    }

    @Operation(summary = "Refresh an expired access token using a refresh token")
    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthResponse>> refresh(
            @RequestBody Map<String, String> body) {

        String refreshToken = body.get("refreshToken");
        if (refreshToken == null || refreshToken.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.<AuthResponse>builder()
                            .success(false).message("refreshToken is required").build());
        }
        return ResponseEntity.ok(ApiResponse.ok("Token refreshed", authService.refreshToken(refreshToken)));
    }

    @Operation(summary = "Logout – client should discard tokens")
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout() {
        // Stateless JWT – actual invalidation is done client-side.
        // For token blacklisting, add a Redis blocklist here.
        return ResponseEntity.ok(ApiResponse.ok("Logged out successfully"));
    }

    @Operation(summary = "Verify email address with the token from the email")
    @PostMapping("/verify-email")
    public ResponseEntity<ApiResponse<Void>> verifyEmail(
            @RequestBody Map<String, String> body) {

        authService.verifyEmail(body.get("token"));
        return ResponseEntity.ok(ApiResponse.ok("Email verified successfully"));
    }

    @Operation(summary = "Request a password-reset email")
    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<Void>> forgotPassword(
            @RequestBody Map<String, String> body,
            HttpServletRequest httpRequest) {

        authService.forgotPassword(body.get("email"), resolveFrontendUrl(httpRequest));
        return ResponseEntity.ok(ApiResponse.ok(
                "If that email is registered, a reset link has been sent."));
    }

    @Operation(summary = "Reset the password using the token from the reset email")
    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<Void>> resetPassword(
            @RequestBody Map<String, String> body) {

        authService.resetPassword(body.get("token"), body.get("newPassword"));
        return ResponseEntity.ok(ApiResponse.ok("Password reset successfully. Please log in."));
    }

    private String resolveFrontendUrl(HttpServletRequest request) {
        String origin = request.getHeader("Origin");
        if (origin != null && !origin.isBlank() && !"null".equalsIgnoreCase(origin)) {
            return trimTrailingSlash(origin);
        }

        String referer = request.getHeader("Referer");
        if (referer != null && !referer.isBlank()) {
            try {
                URI uri = URI.create(referer);
                if (uri.getScheme() != null && uri.getHost() != null) {
                    String authority = uri.getPort() > 0
                            ? uri.getScheme() + "://" + uri.getHost() + ":" + uri.getPort()
                            : uri.getScheme() + "://" + uri.getHost();
                    return trimTrailingSlash(authority);
                }
            } catch (IllegalArgumentException ignored) {
                // Fall back to configured frontend URL inside the service.
            }
        }

        return null;
    }

    private String trimTrailingSlash(String value) {
        return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
    }
}
