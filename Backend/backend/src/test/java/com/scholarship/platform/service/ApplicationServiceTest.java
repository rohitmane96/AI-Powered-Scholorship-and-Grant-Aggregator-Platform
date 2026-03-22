package com.scholarship.platform.service;

import com.scholarship.platform.dto.request.ApplicationRequest;
import com.scholarship.platform.dto.response.ApplicationResponse;
import com.scholarship.platform.exception.BadRequestException;
import com.scholarship.platform.exception.ResourceNotFoundException;
import com.scholarship.platform.exception.UnauthorizedException;
import com.scholarship.platform.model.Application;
import com.scholarship.platform.model.Scholarship;
import com.scholarship.platform.model.User;
import com.scholarship.platform.model.enums.ApplicationStatus;
import com.scholarship.platform.model.enums.DegreeLevel;
import com.scholarship.platform.model.enums.FundingType;
import com.scholarship.platform.model.enums.UserRole;
import com.scholarship.platform.repository.ApplicationRepository;
import com.scholarship.platform.repository.ScholarshipRepository;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.modelmapper.ModelMapper;
import org.modelmapper.convention.MatchingStrategies;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for {@link ApplicationService}.
 * Covers application creation, retrieval, status transitions, and deletion rules.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ApplicationService Unit Tests")
class ApplicationServiceTest {

    @Mock ApplicationRepository  applicationRepository;
    @Mock ScholarshipRepository  scholarshipRepository;
    @Mock RecommendationService  recommendationService;
    @Mock NotificationService    notificationService;
    @Spy  ModelMapper            modelMapper = createMapper();

    @InjectMocks ApplicationService applicationService;

    private User       student;
    private User       admin;
    private Scholarship scholarship;
    private Application draftApplication;

    @BeforeEach
    void setUp() {
        student = User.builder()
                .id("student-1").email("alice@test.com")
                .role(UserRole.STUDENT).build();

        admin = User.builder()
                .id("admin-1").email("admin@test.com")
                .role(UserRole.ADMIN).build();

        scholarship = Scholarship.builder()
                .id("sch-1").name("Test Scholarship")
                .country("US").degreeLevel(DegreeLevel.UNDERGRADUATE)
                .fieldOfStudy("CS").fundingType(FundingType.FULL_FUNDING)
                .deadline(LocalDateTime.now().plusMonths(3))
                .active(true).deleted(false).applicationCount(0).build();

        draftApplication = Application.builder()
                .id("app-1")
                .scholarshipId("sch-1")
                .userId("student-1")
                .status(ApplicationStatus.DRAFT)
                .matchScore(75)
                .timeline(new ArrayList<>(List.of(
                        Application.TimelineEvent.builder()
                                .status(ApplicationStatus.DRAFT)
                                .timestamp(LocalDateTime.now())
                                .note("Created")
                                .actorId("student-1")
                                .build())))
                .build();
    }

    // ── Create ─────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("create – successfully creates a DRAFT application")
    void create_draft_success() {
        ApplicationRequest request = new ApplicationRequest();
        request.setScholarshipId("sch-1");
        request.setStatus(ApplicationStatus.DRAFT);

        when(scholarshipRepository.findByIdAndDeletedFalse("sch-1"))
                .thenReturn(Optional.of(scholarship));
        when(applicationRepository.existsByUserIdAndScholarshipId("student-1", "sch-1"))
                .thenReturn(false);
        when(recommendationService.calculateScore(student, scholarship)).thenReturn(75);
        when(applicationRepository.save(any(Application.class))).thenReturn(draftApplication);

        ApplicationResponse response = applicationService.create(request, student);

        assertThat(response.getScholarshipId()).isEqualTo("sch-1");
        assertThat(response.getStatus()).isEqualTo(ApplicationStatus.DRAFT);
        verify(applicationRepository).save(any(Application.class));
    }

    @Test
    @DisplayName("create – submitting immediately increments scholarship applicationCount")
    void create_submitted_incrementsCount() {
        ApplicationRequest request = new ApplicationRequest();
        request.setScholarshipId("sch-1");
        request.setStatus(ApplicationStatus.SUBMITTED);

        Application submittedApp = Application.builder()
                .id("app-2").scholarshipId("sch-1").userId("student-1")
                .status(ApplicationStatus.SUBMITTED).matchScore(75)
                .timeline(new ArrayList<>()).build();

        when(scholarshipRepository.findByIdAndDeletedFalse("sch-1"))
                .thenReturn(Optional.of(scholarship));
        when(applicationRepository.existsByUserIdAndScholarshipId("student-1", "sch-1"))
                .thenReturn(false);
        when(recommendationService.calculateScore(student, scholarship)).thenReturn(75);
        when(scholarshipRepository.save(any())).thenReturn(scholarship);
        when(applicationRepository.save(any(Application.class))).thenReturn(submittedApp);

        ApplicationResponse response = applicationService.create(request, student);

        assertThat(response.getStatus()).isEqualTo(ApplicationStatus.SUBMITTED);
        verify(scholarshipRepository).save(argThat(s -> s.getApplicationCount() == 1));
    }

    @Test
    @DisplayName("create – duplicate application throws BadRequestException")
    void create_duplicate_throws() {
        ApplicationRequest request = new ApplicationRequest();
        request.setScholarshipId("sch-1");

        when(scholarshipRepository.findByIdAndDeletedFalse("sch-1"))
                .thenReturn(Optional.of(scholarship));
        when(applicationRepository.existsByUserIdAndScholarshipId("student-1", "sch-1"))
                .thenReturn(true);

        assertThatThrownBy(() -> applicationService.create(request, student))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("already applied");
    }

    @Test
    @DisplayName("create – scholarship not found throws ResourceNotFoundException")
    void create_scholarshipNotFound_throws() {
        ApplicationRequest request = new ApplicationRequest();
        request.setScholarshipId("bad-id");

        when(scholarshipRepository.findByIdAndDeletedFalse("bad-id")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> applicationService.create(request, student))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    // ── Read ───────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("getById – student can view own application")
    void getById_ownApplication_success() {
        when(applicationRepository.findById("app-1")).thenReturn(Optional.of(draftApplication));

        ApplicationResponse response = applicationService.getById("app-1", student);

        assertThat(response.getId()).isEqualTo("app-1");
    }

    @Test
    @DisplayName("getById – student cannot view another user's application")
    void getById_otherUserApplication_throws() {
        Application otherApp = Application.builder()
                .id("app-9").scholarshipId("sch-1").userId("other-user")
                .status(ApplicationStatus.DRAFT).matchScore(0)
                .timeline(new ArrayList<>()).build();

        when(applicationRepository.findById("app-9")).thenReturn(Optional.of(otherApp));

        assertThatThrownBy(() -> applicationService.getById("app-9", student))
                .isInstanceOf(UnauthorizedException.class);
    }

    @Test
    @DisplayName("getById – admin can view any application")
    void getById_adminViewsAny_success() {
        Application otherApp = Application.builder()
                .id("app-9").scholarshipId("sch-1").userId("other-user")
                .status(ApplicationStatus.SUBMITTED).matchScore(50)
                .timeline(new ArrayList<>()).build();

        when(applicationRepository.findById("app-9")).thenReturn(Optional.of(otherApp));

        ApplicationResponse response = applicationService.getById("app-9", admin);

        assertThat(response.getId()).isEqualTo("app-9");
    }

    // ── Update ─────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("update – can update notes on a DRAFT application")
    void update_draftApplication_updatesNotes() {
        ApplicationRequest request = new ApplicationRequest();
        request.setScholarshipId("sch-1");
        request.setNotes("Updated notes");

        when(applicationRepository.findByIdAndUserId("app-1", "student-1"))
                .thenReturn(Optional.of(draftApplication));
        when(applicationRepository.save(any())).thenReturn(draftApplication);

        ApplicationResponse response = applicationService.update("app-1", request, student);

        assertThat(response).isNotNull();
        verify(applicationRepository).save(any(Application.class));
    }

    @Test
    @DisplayName("update – cannot update a SUBMITTED application")
    void update_submittedApplication_throws() {
        draftApplication.setStatus(ApplicationStatus.SUBMITTED);
        ApplicationRequest request = new ApplicationRequest();
        request.setScholarshipId("sch-1");
        request.setNotes("Try to update");

        when(applicationRepository.findByIdAndUserId("app-1", "student-1"))
                .thenReturn(Optional.of(draftApplication));

        assertThatThrownBy(() -> applicationService.update("app-1", request, student))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Only DRAFT");
    }

    // ── Admin status update ────────────────────────────────────────────────────

    @Test
    @DisplayName("updateStatus – admin transitions application to ACCEPTED")
    void updateStatus_toAccepted_success() {
        Application submittedApp = Application.builder()
                .id("app-1").scholarshipId("sch-1").userId("student-1")
                .status(ApplicationStatus.SUBMITTED).matchScore(75)
                .timeline(new ArrayList<>()).build();

        when(applicationRepository.findById("app-1")).thenReturn(Optional.of(submittedApp));
        when(applicationRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        doNothing().when(notificationService).sendApplicationStatusNotification(any(), any());

        ApplicationResponse response = applicationService.updateStatus(
                "app-1", ApplicationStatus.ACCEPTED, "Congratulations!", admin);

        assertThat(response.getStatus()).isEqualTo(ApplicationStatus.ACCEPTED);
        verify(notificationService).sendApplicationStatusNotification(any(), eq(ApplicationStatus.ACCEPTED));
    }

    // ── Delete ─────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("delete – student can delete own DRAFT application")
    void delete_draftByOwner_success() {
        when(applicationRepository.findByIdAndUserId("app-1", "student-1"))
                .thenReturn(Optional.of(draftApplication));
        doNothing().when(applicationRepository).delete(any());

        assertThatCode(() -> applicationService.delete("app-1", student))
                .doesNotThrowAnyException();

        verify(applicationRepository).delete(draftApplication);
    }

    @Test
    @DisplayName("delete – cannot delete a SUBMITTED application")
    void delete_submitted_throws() {
        draftApplication.setStatus(ApplicationStatus.SUBMITTED);

        when(applicationRepository.findByIdAndUserId("app-1", "student-1"))
                .thenReturn(Optional.of(draftApplication));

        assertThatThrownBy(() -> applicationService.delete("app-1", student))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Only DRAFT");
    }

    // ── Timeline ───────────────────────────────────────────────────────────────

    @Test
    @DisplayName("getTimeline – returns timeline events")
    void getTimeline_returnsEvents() {
        when(applicationRepository.findById("app-1")).thenReturn(Optional.of(draftApplication));

        var timeline = applicationService.getTimeline("app-1", student);

        assertThat(timeline).isNotEmpty();
        assertThat(timeline.get(0).getStatus()).isEqualTo(ApplicationStatus.DRAFT);
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    private static ModelMapper createMapper() {
        ModelMapper mm = new ModelMapper();
        mm.getConfiguration().setMatchingStrategy(MatchingStrategies.STRICT).setSkipNullEnabled(true);
        return mm;
    }
}
