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
import com.scholarship.platform.model.enums.UserRole;
import com.scholarship.platform.repository.ApplicationRepository;
import com.scholarship.platform.repository.ScholarshipRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Manages the full lifecycle of scholarship applications.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ApplicationService {

    private final ApplicationRepository  applicationRepository;
    private final ScholarshipRepository  scholarshipRepository;
    private final RecommendationService  recommendationService;
    private final NotificationService    notificationService;
    private final ModelMapper            modelMapper;

    // ── Create ─────────────────────────────────────────────────────────────────

    public ApplicationResponse create(ApplicationRequest request, User user) {
        Scholarship scholarship = scholarshipRepository.findByIdAndDeletedFalse(request.getScholarshipId())
                .orElseThrow(() -> new ResourceNotFoundException("Scholarship", "id", request.getScholarshipId()));

        if (applicationRepository.existsByUserIdAndScholarshipId(
                user.getId(), request.getScholarshipId())) {
            throw new BadRequestException("You have already applied for this scholarship", "DUPLICATE_APPLICATION");
        }

        int matchScore = recommendationService.calculateScore(user, scholarship);

        ApplicationStatus initialStatus = request.getStatus() != null
                ? request.getStatus() : ApplicationStatus.DRAFT;

        List<Application.TimelineEvent> timeline = new ArrayList<>();
        timeline.add(Application.TimelineEvent.builder()
                .status(initialStatus)
                .timestamp(LocalDateTime.now())
                .note("Application created")
                .actorId(user.getId())
                .build());

        Application application = Application.builder()
                .scholarshipId(scholarship.getId())
                .userId(user.getId())
                .status(initialStatus)
                .matchScore(matchScore)
                .notes(request.getNotes())
                .timeline(timeline)
                .build();

        if (initialStatus == ApplicationStatus.SUBMITTED) {
            application.setSubmittedAt(LocalDateTime.now());
            scholarship.setApplicationCount(scholarship.getApplicationCount() + 1);
            scholarshipRepository.save(scholarship);
        }

        Application saved = applicationRepository.save(application);
        log.info("Application {} created by {} for scholarship {}",
                saved.getId(), user.getEmail(), scholarship.getName());

        return toResponse(saved);
    }

    // ── Read ───────────────────────────────────────────────────────────────────

    public Page<ApplicationResponse> getByUser(String userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Application> applications = applicationRepository.findByUserId(userId, pageable);
        Map<String, Scholarship> scholarships = scholarshipRepository.findAllById(
                        applications.getContent().stream().map(Application::getScholarshipId).distinct().toList())
                .stream()
                .collect(Collectors.toMap(Scholarship::getId, Function.identity()));
        return applications.map(app -> toResponse(app, scholarships.get(app.getScholarshipId())));
    }

    public ApplicationResponse getById(String id, User actor) {
        Application app = applicationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Application", "id", id));

        // Students can only see their own applications
        if (actor.getRole() == UserRole.STUDENT && !app.getUserId().equals(actor.getId())) {
            throw new UnauthorizedException();
        }

        return toResponse(app);
    }

    public Page<ApplicationResponse> getByScholarship(String scholarshipId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("submittedAt").descending());
        Scholarship scholarship = scholarshipRepository.findByIdAndDeletedFalse(scholarshipId).orElse(null);
        return applicationRepository.findByScholarshipId(scholarshipId, pageable)
                .map(app -> toResponse(app, scholarship));
    }

    public Page<ApplicationResponse> getAll(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Application> applications = applicationRepository.findAll(pageable);
        Map<String, Scholarship> scholarships = scholarshipRepository.findAllById(
                        applications.getContent().stream().map(Application::getScholarshipId).distinct().toList())
                .stream()
                .collect(Collectors.toMap(Scholarship::getId, Function.identity()));
        return applications.map(app -> toResponse(app, scholarships.get(app.getScholarshipId())));
    }

    public List<ApplicationResponse> getRecentByScholarshipIds(List<String> scholarshipIds, int limit) {
        if (scholarshipIds == null || scholarshipIds.isEmpty()) {
            return List.of();
        }

        Map<String, Scholarship> scholarships = scholarshipRepository.findAllById(scholarshipIds).stream()
                .collect(Collectors.toMap(Scholarship::getId, Function.identity()));

        return applicationRepository.findByScholarshipIdIn(scholarshipIds).stream()
                .sorted((left, right) -> {
                    LocalDateTime leftTime = left.getSubmittedAt() != null ? left.getSubmittedAt() : left.getCreatedAt();
                    LocalDateTime rightTime = right.getSubmittedAt() != null ? right.getSubmittedAt() : right.getCreatedAt();
                    if (leftTime == null && rightTime == null) return 0;
                    if (leftTime == null) return 1;
                    if (rightTime == null) return -1;
                    return rightTime.compareTo(leftTime);
                })
                .limit(limit)
                .map(app -> toResponse(app, scholarships.get(app.getScholarshipId())))
                .toList();
    }

    // ── Update ─────────────────────────────────────────────────────────────────

    public ApplicationResponse update(String id, ApplicationRequest request, User actor) {
        Application app = getOwnedApplication(id, actor);

        if (app.getStatus() != ApplicationStatus.DRAFT) {
            throw new BadRequestException("Only DRAFT applications can be edited", "IMMUTABLE_STATUS");
        }

        if (request.getNotes() != null)  app.setNotes(request.getNotes());
        if (request.getStatus() != null && request.getStatus() == ApplicationStatus.SUBMITTED) {
            submitApplication(app, actor.getId());
        }

        return toResponse(applicationRepository.save(app));
    }

    public ApplicationResponse updateStatus(String id, ApplicationStatus newStatus, String note, User admin) {
        Application app = applicationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Application", "id", id));

        app.getTimeline().add(Application.TimelineEvent.builder()
                .status(newStatus)
                .timestamp(LocalDateTime.now())
                .note(note)
                .actorId(admin.getId())
                .build());

        app.setStatus(newStatus);
        if (newStatus == ApplicationStatus.SUBMITTED) app.setSubmittedAt(LocalDateTime.now());
        if (newStatus == ApplicationStatus.ACCEPTED || newStatus == ApplicationStatus.REJECTED) {
            app.setReviewedAt(LocalDateTime.now());
        }

        Application saved = applicationRepository.save(app);
        notificationService.sendApplicationStatusNotification(saved, newStatus);
        log.info("Application {} status updated to {} by admin {}", id, newStatus, admin.getEmail());
        return toResponse(saved);
    }

    // ── Delete ─────────────────────────────────────────────────────────────────

    public void delete(String id, User actor) {
        Application app = getOwnedApplication(id, actor);
        if (app.getStatus() != ApplicationStatus.DRAFT) {
            throw new BadRequestException("Only DRAFT applications can be deleted", "IMMUTABLE_STATUS");
        }
        applicationRepository.delete(app);
        log.info("Application {} deleted by {}", id, actor.getEmail());
    }

    // ── Timeline ───────────────────────────────────────────────────────────────

    public List<Application.TimelineEvent> getTimeline(String id, User actor) {
        return getById(id, actor).getTimeline();
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    private void submitApplication(Application app, String actorId) {
        app.setStatus(ApplicationStatus.SUBMITTED);
        app.setSubmittedAt(LocalDateTime.now());
        app.getTimeline().add(Application.TimelineEvent.builder()
                .status(ApplicationStatus.SUBMITTED)
                .timestamp(LocalDateTime.now())
                .note("Application submitted")
                .actorId(actorId)
                .build());
    }

    private Application getOwnedApplication(String id, User actor) {
        Application app = applicationRepository.findByIdAndUserId(id, actor.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Application", "id", id));
        return app;
    }

    public ApplicationResponse toResponse(Application app) {
        return toResponse(app, null);
    }

    public ApplicationResponse toResponse(Application app, Scholarship scholarship) {
        ApplicationResponse response = modelMapper.map(app, ApplicationResponse.class);
        if (scholarship != null) {
            response.setScholarship(modelMapper.map(scholarship, com.scholarship.platform.dto.response.ScholarshipResponse.class));
        }
        return response;
    }
}
