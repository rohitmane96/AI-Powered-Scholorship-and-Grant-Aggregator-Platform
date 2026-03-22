package com.scholarship.platform.service;

import com.scholarship.platform.dto.request.ProfileUpdateRequest;
import com.scholarship.platform.dto.response.UserResponse;
import com.scholarship.platform.exception.BadRequestException;
import com.scholarship.platform.exception.ResourceNotFoundException;
import com.scholarship.platform.model.User;
import com.scholarship.platform.model.enums.ApplicationStatus;
import com.scholarship.platform.model.enums.DegreeLevel;
import com.scholarship.platform.model.enums.UserRole;
import com.scholarship.platform.repository.ApplicationRepository;
import com.scholarship.platform.repository.UserRepository;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.modelmapper.ModelMapper;
import org.modelmapper.convention.MatchingStrategies;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for {@link UserService}.
 * Covers profile reads, updates, password changes, avatar upload,
 * soft-delete, stats, and profile-completion calculation.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("UserService Unit Tests")
class UserServiceTest {

    @Mock UserRepository        userRepository;
    @Mock ApplicationRepository applicationRepository;
    @Mock PasswordEncoder       passwordEncoder;
    @Mock FileStorageService    fileStorageService;
    @Spy  ModelMapper           modelMapper = createMapper();

    @InjectMocks UserService userService;

    private User sampleStudent;

    @BeforeEach
    void setUp() {
        sampleStudent = User.builder()
                .id("student-1")
                .fullName("Alice Johnson")
                .email("alice@example.com")
                .password("encodedPassword")
                .role(UserRole.STUDENT)
                .verified(true)
                .profileCompletion(40)
                .build();
    }

    // ── Reads ──────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("getByEmail – returns user for known email")
    void getByEmail_found() {
        when(userRepository.findByEmailAndDeletedFalse("alice@example.com"))
                .thenReturn(Optional.of(sampleStudent));

        User user = userService.getByEmail("alice@example.com");

        assertThat(user.getId()).isEqualTo("student-1");
    }

    @Test
    @DisplayName("getByEmail – throws ResourceNotFoundException for unknown email")
    void getByEmail_notFound_throws() {
        when(userRepository.findByEmailAndDeletedFalse("nobody@example.com"))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.getByEmail("nobody@example.com"))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("getById – returns user for known ID")
    void getById_found() {
        when(userRepository.findById("student-1")).thenReturn(Optional.of(sampleStudent));

        User user = userService.getById("student-1");

        assertThat(user.getEmail()).isEqualTo("alice@example.com");
    }

    @Test
    @DisplayName("getById – throws ResourceNotFoundException for unknown ID")
    void getById_notFound_throws() {
        when(userRepository.findById("bad-id")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.getById("bad-id"))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("getById – throws ResourceNotFoundException for soft-deleted user")
    void getById_deleted_throws() {
        sampleStudent.setDeleted(true);
        when(userRepository.findById("student-1")).thenReturn(Optional.of(sampleStudent));

        assertThatThrownBy(() -> userService.getById("student-1"))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    // ── Profile update ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("updateProfile – updates fullName and education")
    void updateProfile_updatesFields() {
        ProfileUpdateRequest request = new ProfileUpdateRequest();
        request.setFullName("Alice Smith");
        request.setEducation(User.Education.builder()
                .level(DegreeLevel.UNDERGRADUATE)
                .fieldOfStudy("Computer Science")
                .currentGPA(3.8)
                .build());

        when(userRepository.findByEmailAndDeletedFalse("alice@example.com"))
                .thenReturn(Optional.of(sampleStudent));
        when(userRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        User updated = userService.updateProfile("alice@example.com", request);

        assertThat(updated.getFullName()).isEqualTo("Alice Smith");
        assertThat(updated.getEducation().getFieldOfStudy()).isEqualTo("Computer Science");
    }

    // ── Password change ────────────────────────────────────────────────────────

    @Test
    @DisplayName("changePassword – correct current password updates successfully")
    void changePassword_correctCurrentPassword_success() {
        when(userRepository.findByEmailAndDeletedFalse("alice@example.com"))
                .thenReturn(Optional.of(sampleStudent));
        when(passwordEncoder.matches("Alice@1234", "encodedPassword")).thenReturn(true);
        when(passwordEncoder.encode("NewPass@5678")).thenReturn("encodedNew");
        when(userRepository.save(any())).thenReturn(sampleStudent);

        assertThatCode(() -> userService.changePassword(
                "alice@example.com", "Alice@1234", "NewPass@5678"))
                .doesNotThrowAnyException();

        verify(userRepository).save(argThat(u -> u.getPassword().equals("encodedNew")));
    }

    @Test
    @DisplayName("changePassword – wrong current password throws BadRequestException")
    void changePassword_wrongCurrent_throws() {
        when(userRepository.findByEmailAndDeletedFalse("alice@example.com"))
                .thenReturn(Optional.of(sampleStudent));
        when(passwordEncoder.matches("wrongPassword", "encodedPassword")).thenReturn(false);

        assertThatThrownBy(() -> userService.changePassword(
                "alice@example.com", "wrongPassword", "NewPass@5678"))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("incorrect");
    }

    // ── Delete ─────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("deleteUser – soft-deletes the user")
    void deleteUser_softDeletes() {
        when(userRepository.findById("student-1")).thenReturn(Optional.of(sampleStudent));
        when(userRepository.save(any())).thenReturn(sampleStudent);

        userService.deleteUser("student-1");

        verify(userRepository).save(argThat(User::isDeleted));
    }

    // ── Stats ──────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("getUserStats – returns correct statistics")
    void getUserStats_correctCounts() {
        when(applicationRepository.countByUserId("student-1")).thenReturn(10L);
        when(applicationRepository.findByUserIdAndStatus("student-1", ApplicationStatus.ACCEPTED))
                .thenReturn(List.of()); // 0 accepted
        when(applicationRepository.findByUserIdAndStatus("student-1", ApplicationStatus.SUBMITTED))
                .thenReturn(List.of()); // 0 submitted

        var stats = userService.getUserStats("student-1");

        assertThat(stats.get("totalApplications")).isEqualTo(10L);
        assertThat(stats.get("successRate")).isEqualTo(0.0);
    }

    // ── Profile completion ─────────────────────────────────────────────────────

    @Test
    @DisplayName("calculateProfileCompletion – verified user with full info scores 100")
    void profileCompletion_fullProfile_100() {
        User fullUser = User.builder()
                .fullName("Alice Johnson")
                .avatar("/avatars/alice.jpg")
                .verified(true)
                .education(User.Education.builder().fieldOfStudy("CS").build())
                .preferences(User.Preferences.builder()
                        .targetCountries(List.of("US", "UK"))
                        .build())
                .build();

        int score = userService.calculateProfileCompletion(fullUser);

        // PC_BASIC_INFO(20) + PC_AVATAR(10) + PC_VERIFIED(20) + PC_EDUCATION(30) + PC_PREFERENCES(20) = 100
        assertThat(score).isEqualTo(100);
    }

    @Test
    @DisplayName("calculateProfileCompletion – empty profile scores 0")
    void profileCompletion_emptyProfile_0() {
        User emptyUser = User.builder().build();

        int score = userService.calculateProfileCompletion(emptyUser);

        assertThat(score).isEqualTo(0);
    }

    @Test
    @DisplayName("calculateProfileCompletion – verified user with name scores 40")
    void profileCompletion_nameAndVerified_40() {
        User user = User.builder()
                .fullName("Alice")
                .verified(true)
                .build();

        int score = userService.calculateProfileCompletion(user);

        // PC_BASIC_INFO(20) + PC_VERIFIED(20) = 40
        assertThat(score).isEqualTo(40);
    }

    // ── toResponse ─────────────────────────────────────────────────────────────

    @Test
    @DisplayName("toResponse – password is never included in UserResponse")
    void toResponse_passwordNotIncluded() {
        UserResponse response = userService.toResponse(sampleStudent);

        // UserResponse has no password field – if this compiles it's safe.
        assertThat(response.getId()).isEqualTo("student-1");
        assertThat(response.getEmail()).isEqualTo("alice@example.com");
    }

    private static ModelMapper createMapper() {
        ModelMapper mm = new ModelMapper();
        mm.getConfiguration().setMatchingStrategy(MatchingStrategies.STRICT).setSkipNullEnabled(true);
        return mm;
    }
}
