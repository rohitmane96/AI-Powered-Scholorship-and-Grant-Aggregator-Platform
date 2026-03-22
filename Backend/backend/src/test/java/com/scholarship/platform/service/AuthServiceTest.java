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
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for {@link AuthService}.
 * Covers registration, login, token refresh, email verification, and password reset flows.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AuthService Unit Tests")
class AuthServiceTest {

    @Mock UserRepository       userRepository;
    @Mock PasswordEncoder      passwordEncoder;
    @Mock AuthenticationManager authManager;
    @Mock JwtTokenProvider     tokenProvider;
    @Mock EmailService         emailService;
    @Mock NotificationService  notificationService;

    @InjectMocks AuthService authService;

    private RegisterRequest validRegisterRequest;
    private User            sampleUser;

    @BeforeEach
    void setUp() {
        validRegisterRequest = new RegisterRequest();
        validRegisterRequest.setFullName("Alice Johnson");
        validRegisterRequest.setEmail("alice@example.com");
        validRegisterRequest.setPassword("Alice@1234");
        validRegisterRequest.setRole(UserRole.STUDENT);

        sampleUser = User.builder()
                .id("user-1")
                .fullName("Alice Johnson")
                .email("alice@example.com")
                .password("encodedPassword")
                .role(UserRole.STUDENT)
                .verified(false)
                .verificationToken("verify-token-123")
                .profileCompletion(20)
                .build();
    }

    // ── Registration ───────────────────────────────────────────────────────────

    @Test
    @DisplayName("register – new user is saved and tokens are returned")
    void register_newUser_success() {
        when(userRepository.existsByEmail("alice@example.com")).thenReturn(false);
        when(passwordEncoder.encode(any())).thenReturn("encodedPassword");
        when(userRepository.save(any(User.class))).thenReturn(sampleUser);
        when(tokenProvider.generateAccessToken("alice@example.com")).thenReturn("access-token");
        when(tokenProvider.generateRefreshToken("alice@example.com")).thenReturn("refresh-token");
        when(tokenProvider.getJwtExpirationMs()).thenReturn(86400000L);
        doNothing().when(emailService).sendVerificationEmail(any());
        doNothing().when(notificationService).sendWelcomeNotification(any());

        AuthResponse response = authService.register(validRegisterRequest);

        assertThat(response.getAccessToken()).isEqualTo("access-token");
        assertThat(response.getRefreshToken()).isEqualTo("refresh-token");
        assertThat(response.getEmail()).isEqualTo("alice@example.com");
        assertThat(response.getRole()).isEqualTo(UserRole.STUDENT);

        verify(userRepository).save(any(User.class));
        verify(emailService).sendVerificationEmail(any(User.class));
        verify(notificationService).sendWelcomeNotification(any(User.class));
    }

    @Test
    @DisplayName("register – duplicate email throws BadRequestException")
    void register_duplicateEmail_throws() {
        when(userRepository.existsByEmail("alice@example.com")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(validRegisterRequest))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("already registered");

        verify(userRepository, never()).save(any());
    }

    // ── Login ──────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("login – valid credentials return tokens")
    void login_validCredentials_success() {
        LoginRequest request = new LoginRequest();
        request.setEmail("alice@example.com");
        request.setPassword("Alice@1234");

        Authentication auth = mock(Authentication.class);
        when(authManager.authenticate(any(UsernamePasswordAuthenticationToken.class))).thenReturn(auth);
        when(userRepository.findByEmailAndDeletedFalse("alice@example.com"))
                .thenReturn(Optional.of(sampleUser));
        when(tokenProvider.generateAccessToken(auth)).thenReturn("access-token");
        when(tokenProvider.generateRefreshToken("alice@example.com")).thenReturn("refresh-token");
        when(tokenProvider.getJwtExpirationMs()).thenReturn(86400000L);
        when(userRepository.save(any())).thenReturn(sampleUser);

        AuthResponse response = authService.login(request);

        assertThat(response.getAccessToken()).isEqualTo("access-token");
        assertThat(response.getEmail()).isEqualTo("alice@example.com");
        verify(userRepository).save(argThat(u -> u.getLastLogin() != null));
    }

    @Test
    @DisplayName("login – bad credentials propagates exception")
    void login_badCredentials_throws() {
        LoginRequest request = new LoginRequest();
        request.setEmail("alice@example.com");
        request.setPassword("wrongPassword");

        when(authManager.authenticate(any())).thenThrow(new BadCredentialsException("Bad credentials"));

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(BadCredentialsException.class);
    }

    // ── Token refresh ──────────────────────────────────────────────────────────

    @Test
    @DisplayName("refreshToken – valid refresh token returns new token pair")
    void refreshToken_valid_success() {
        when(tokenProvider.validateToken("valid-refresh")).thenReturn(true);
        when(tokenProvider.getEmailFromToken("valid-refresh")).thenReturn("alice@example.com");
        when(userRepository.findByEmailAndDeletedFalse("alice@example.com"))
                .thenReturn(Optional.of(sampleUser));
        when(tokenProvider.generateAccessToken("alice@example.com")).thenReturn("new-access");
        when(tokenProvider.generateRefreshToken("alice@example.com")).thenReturn("new-refresh");
        when(tokenProvider.getJwtExpirationMs()).thenReturn(86400000L);

        AuthResponse response = authService.refreshToken("valid-refresh");

        assertThat(response.getAccessToken()).isEqualTo("new-access");
        assertThat(response.getRefreshToken()).isEqualTo("new-refresh");
    }

    @Test
    @DisplayName("refreshToken – invalid token throws BadRequestException")
    void refreshToken_invalid_throws() {
        when(tokenProvider.validateToken("bad-token")).thenReturn(false);

        assertThatThrownBy(() -> authService.refreshToken("bad-token"))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Invalid or expired");
    }

    // ── Email verification ─────────────────────────────────────────────────────

    @Test
    @DisplayName("verifyEmail – valid token marks user as verified")
    void verifyEmail_validToken_success() {
        when(userRepository.findByVerificationToken("verify-token-123"))
                .thenReturn(Optional.of(sampleUser));
        when(userRepository.save(any())).thenReturn(sampleUser);

        authService.verifyEmail("verify-token-123");

        verify(userRepository).save(argThat(u -> u.isVerified() && u.getVerificationToken() == null));
    }

    @Test
    @DisplayName("verifyEmail – invalid token throws BadRequestException")
    void verifyEmail_invalidToken_throws() {
        when(userRepository.findByVerificationToken("bad-token")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.verifyEmail("bad-token"))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Invalid verification token");
    }

    // ── Password reset ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("forgotPassword – sends email for known user (no exception for unknown user)")
    void forgotPassword_knownUser_emailSent() {
        when(userRepository.findByEmailAndDeletedFalse("alice@example.com"))
                .thenReturn(Optional.of(sampleUser));
        when(userRepository.save(any())).thenReturn(sampleUser);
        doNothing().when(emailService).sendPasswordResetEmail(any(), anyString());

        assertThatCode(() -> authService.forgotPassword("alice@example.com"))
                .doesNotThrowAnyException();

        verify(emailService).sendPasswordResetEmail(any(), anyString());
    }

    @Test
    @DisplayName("forgotPassword – unknown email does NOT throw (prevents enumeration)")
    void forgotPassword_unknownEmail_noException() {
        when(userRepository.findByEmailAndDeletedFalse("unknown@example.com"))
                .thenReturn(Optional.empty());

        assertThatCode(() -> authService.forgotPassword("unknown@example.com"))
                .doesNotThrowAnyException();

        verify(emailService, never()).sendPasswordResetEmail(any(), any());
    }

    @Test
    @DisplayName("resetPassword – valid non-expired token updates password")
    void resetPassword_validToken_updatesPassword() {
        sampleUser.setPasswordResetToken("reset-token");
        sampleUser.setPasswordResetExpiry(LocalDateTime.now().plusHours(1));

        when(userRepository.findByPasswordResetToken("reset-token"))
                .thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.encode("NewPass@1234")).thenReturn("encodedNew");
        when(userRepository.save(any())).thenReturn(sampleUser);

        authService.resetPassword("reset-token", "NewPass@1234");

        verify(userRepository).save(argThat(u ->
                u.getPasswordResetToken() == null && u.getPasswordResetExpiry() == null));
    }

    @Test
    @DisplayName("resetPassword – expired token throws BadRequestException")
    void resetPassword_expiredToken_throws() {
        sampleUser.setPasswordResetToken("expired-token");
        sampleUser.setPasswordResetExpiry(LocalDateTime.now().minusMinutes(1));

        when(userRepository.findByPasswordResetToken("expired-token"))
                .thenReturn(Optional.of(sampleUser));

        assertThatThrownBy(() -> authService.resetPassword("expired-token", "NewPass@1234"))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("expired");
    }
}
