package com.scholarship.platform.service;

import com.scholarship.platform.model.Application;
import com.scholarship.platform.model.Notification;
import com.scholarship.platform.model.User;
import com.scholarship.platform.model.enums.ApplicationStatus;
import com.scholarship.platform.repository.NotificationRepository;
import com.scholarship.platform.util.Constants;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.*;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.Map;

/**
 * Creates, stores, and delivers in-app and WebSocket notifications.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository  notificationRepository;
    private final SimpMessagingTemplate   messagingTemplate;

    // ── Send methods ───────────────────────────────────────────────────────────

    @Async
    public void sendWelcomeNotification(User user) {
        send(user.getId(), Constants.NOTIF_WELCOME,
             "Welcome to ScholarMatch AI!",
             "Your account has been created. Complete your profile to get personalised recommendations.",
             null);
    }

    @Async
    public void sendApplicationStatusNotification(Application app, ApplicationStatus newStatus) {
        String message = switch (newStatus) {
            case SUBMITTED    -> "Your application has been submitted successfully.";
            case UNDER_REVIEW -> "Your application is now under review.";
            case ACCEPTED     -> "Congratulations! Your application has been accepted.";
            case REJECTED     -> "Unfortunately your application was not successful this time.";
            default           -> "Your application status has been updated to " + newStatus.name();
        };

        send(app.getUserId(), Constants.NOTIF_APPLICATION_STATUS,
             "Application Update",
             message,
             Map.of("applicationId", app.getId(), "scholarshipId", app.getScholarshipId(),
                    "status", newStatus.name()));
    }

    @Async
    public void sendDeadlineReminder(User user, String scholarshipName,
                                     String scholarshipId, long daysLeft) {
        send(user.getId(), Constants.NOTIF_DEADLINE_REMINDER,
             "Scholarship Deadline Reminder",
             scholarshipName + " deadline is in " + daysLeft + " day(s). Don't miss it!",
             Map.of("scholarshipId", scholarshipId, "daysLeft", daysLeft));
    }

    @Async
    public void sendNewMatchNotification(User user, String scholarshipName, String scholarshipId) {
        send(user.getId(), Constants.NOTIF_NEW_MATCH,
             "New Scholarship Match",
             "A new scholarship matches your profile: " + scholarshipName,
             Map.of("scholarshipId", scholarshipId));
    }

    // ── CRUD ───────────────────────────────────────────────────────────────────

    public Page<Notification> getByUser(String userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
    }

    public long countUnread(String userId) {
        return notificationRepository.countByUserIdAndReadFalse(userId);
    }

    public void markRead(String id, String userId) {
        notificationRepository.findById(id).ifPresent(n -> {
            if (n.getUserId().equals(userId)) {
                n.setRead(true);
                notificationRepository.save(n);
            }
        });
    }

    public void markAllRead(String userId) {
        Pageable all = PageRequest.of(0, Integer.MAX_VALUE);
        notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, all)
                .filter(n -> !n.isRead())
                .forEach(n -> {
                    n.setRead(true);
                    notificationRepository.save(n);
                });
    }

    public void delete(String id, String userId) {
        notificationRepository.deleteByUserIdAndId(userId, id);
    }

    // ── Internal ───────────────────────────────────────────────────────────────

    private void send(String userId, String type, String title,
                      String message, Map<String, Object> data) {
        Notification notification = Notification.builder()
                .userId(userId)
                .type(type)
                .title(title)
                .message(message)
                .data(data)
                .read(false)
                .build();

        Notification saved = notificationRepository.save(notification);

        // Push via WebSocket to the connected user
        try {
            messagingTemplate.convertAndSendToUser(userId, "/queue/notifications", saved);
        } catch (Exception ex) {
            log.warn("WebSocket delivery failed for user {}: {}", userId, ex.getMessage());
        }
    }
}
