package com.scholarship.platform.scheduler;

import com.scholarship.platform.model.Application;
import com.scholarship.platform.model.Scholarship;
import com.scholarship.platform.model.User;
import com.scholarship.platform.model.enums.ApplicationStatus;
import com.scholarship.platform.repository.ApplicationRepository;
import com.scholarship.platform.repository.ScholarshipRepository;
import com.scholarship.platform.repository.UserRepository;
import com.scholarship.platform.service.EmailService;
import com.scholarship.platform.service.NotificationService;
import com.scholarship.platform.util.DateUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Scheduled job that sends deadline reminder notifications and emails.
 * Runs daily at 08:00 UTC.
 *
 * <p>Sends reminders at 7 days, 3 days, and 1 day before the deadline.</p>
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DeadlineReminderScheduler {

    private static final int[] REMINDER_DAYS = {7, 3, 1};

    private final ScholarshipRepository  scholarshipRepository;
    private final ApplicationRepository  applicationRepository;
    private final UserRepository         userRepository;
    private final NotificationService    notificationService;
    private final EmailService           emailService;

    @Scheduled(cron = "0 0 8 * * *", zone = "UTC")
    public void sendDeadlineReminders() {
        log.info("Starting deadline reminder scheduler job");
        int count = 0;

        for (int days : REMINDER_DAYS) {
            LocalDateTime windowStart = LocalDateTime.now().plusDays(days).withHour(0).withMinute(0);
            LocalDateTime windowEnd   = windowStart.plusDays(1);

            List<Scholarship> upcoming = scholarshipRepository
                    .findByDeadlineBetween(windowStart, windowEnd);

            for (Scholarship scholarship : upcoming) {
                List<Application> applications = applicationRepository
                        .findByScholarshipIdAndStatus(scholarship.getId(), ApplicationStatus.SUBMITTED);

                for (Application application : applications) {
                    userRepository.findById(application.getUserId()).ifPresent(user -> {
                        notificationService.sendDeadlineReminder(
                                user, scholarship.getName(), scholarship.getId(), days);
                        emailService.sendDeadlineReminderEmail(
                                user, scholarship.getName(),
                                scholarship.getApplicationUrl(), days);
                    });
                    count++;
                }
            }
        }

        log.info("Deadline reminder job complete – {} reminders sent", count);
    }
}
