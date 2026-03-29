package com.scholarship.platform.service;

import com.scholarship.platform.dto.request.LoginRequest;
import com.scholarship.platform.dto.request.RegisterRequest;
import com.scholarship.platform.dto.response.AuthResponse;
import com.scholarship.platform.exception.BadRequestException;
import com.scholarship.platform.exception.ResourceNotFoundException;
import com.scholarship.platform.model.User;
import com.scholarship.platform.model.enums.UserRole;
import com.scholarship.platform.repository.UserRepository;
import com.scholarship.platform.security.JwtTokenProvider;
import com.scholarship.platform.util.Constants;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Handles registration, login, token refresh, and password management.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository      userRepository;
    private final PasswordEncoder     passwordEncoder;
    private final AuthenticationManager authManager;
    private final JwtTokenProvider    tokenProvider;
    private final EmailService        emailService;
    private final NotificationService notificationService;

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    // ── Registration ───────────────────────────────────────────────────────────

    public AuthResponse register(RegisterRequest request) {
        String normalizedEmail = request.getEmail().toLowerCase().trim();

        userRepository.findByEmail(normalizedEmail).ifPresent(existing -> {
            if (existing.isDeleted()) {
                userRepository.delete(existing);
                log.info("Removed previously deleted user record for email: {}", normalizedEmail);
            } else {
                throw new BadRequestException("Email is already registered", "EMAIL_TAKEN");
            }
        });

        User user = User.builder()
                .fullName(request.getFullName())
                .email(normalizedEmail)
                .password(passwordEncoder.encode(request.getPassword()))
                .role(request.getRole())
                .verified(false)
                .verificationToken(UUID.randomUUID().toString())
                .institutionName(request.getInstitutionName())
                .institutionType(request.getInstitutionType())
                .country(request.getCountry())
                .build();

        user = userRepository.save(user);

        // Send verification email asynchronously
        emailService.sendVerificationEmail(user);
        notificationService.sendWelcomeNotification(user);

        log.info("New user registered: {} ({})", user.getEmail(), user.getRole());

        String accessToken  = tokenProvider.generateAccessToken(user.getEmail());
        String refreshToken = tokenProvider.generateRefreshToken(user.getEmail());

        return buildAuthResponse(user, accessToken, refreshToken);
    }

    // ── Login ──────────────────────────────────────────────────────────────────

    public AuthResponse login(LoginRequest request) {
        Authentication auth = authManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail().toLowerCase().trim(),
                        request.getPassword()));

        User user = userRepository.findByEmailAndDeletedFalse(
                request.getEmail().toLowerCase().trim())
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", request.getEmail()));

        // Update last-login timestamp
        user.setLastLogin(LocalDateTime.now());
        userRepository.save(user);

        String accessToken  = tokenProvider.generateAccessToken(auth);
        String refreshToken = tokenProvider.generateRefreshToken(user.getEmail());

        log.info("User logged in: {}", user.getEmail());
        return buildAuthResponse(user, accessToken, refreshToken);
    }

    // ── Token refresh ──────────────────────────────────────────────────────────

    public AuthResponse refreshToken(String refreshToken) {
        if (!tokenProvider.validateToken(refreshToken)) {
            throw new BadRequestException("Invalid or expired refresh token", "INVALID_REFRESH_TOKEN");
        }

        String email = tokenProvider.getEmailFromToken(refreshToken);
        User user = userRepository.findByEmailAndDeletedFalse(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        String newAccess  = tokenProvider.generateAccessToken(email);
        String newRefresh = tokenProvider.generateRefreshToken(email);
        return buildAuthResponse(user, newAccess, newRefresh);
    }

    // ── Email verification ─────────────────────────────────────────────────────

    public void verifyEmail(String token) {
        User user = userRepository.findByVerificationToken(token)
                .orElseThrow(() -> new BadRequestException("Invalid verification token", "INVALID_TOKEN"));

        user.setVerified(true);
        user.setVerificationToken(null);
        userRepository.save(user);

        log.info("Email verified for user: {}", user.getEmail());
    }

    // ── Password reset ─────────────────────────────────────────────────────────

    public void forgotPassword(String email) {
        userRepository.findByEmailAndDeletedFalse(email.toLowerCase().trim())
                .ifPresent(user -> {
                    String token = UUID.randomUUID().toString();
                    user.setPasswordResetToken(token);
                    user.setPasswordResetExpiry(LocalDateTime.now().plusHours(2));
                    userRepository.save(user);
                    emailService.sendPasswordResetEmail(user, token);
                });
        // Always return success to prevent email enumeration
    }

    public void resetPassword(String token, String newPassword) {
        User user = userRepository.findByPasswordResetToken(token)
                .orElseThrow(() -> new BadRequestException("Invalid or expired reset token", "INVALID_TOKEN"));

        if (user.getPasswordResetExpiry() == null ||
                user.getPasswordResetExpiry().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("Password reset token has expired", "TOKEN_EXPIRED");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setPasswordResetToken(null);
        user.setPasswordResetExpiry(null);
        userRepository.save(user);

        log.info("Password reset completed for user: {}", user.getEmail());
    }

    // ── Helper ─────────────────────────────────────────────────────────────────

    private AuthResponse buildAuthResponse(User user, String accessToken, String refreshToken) {
        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .expiresIn(tokenProvider.getJwtExpirationMs() / 1000)
                .userId(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole())
                .verified(user.isVerified())
                .profileCompletion(user.getProfileCompletion())
                .verificationUrl(user.getVerificationToken() == null
                        ? null
                        : frontendUrl + "/verify-email?token=" + user.getVerificationToken())
                .build();
    }
}
