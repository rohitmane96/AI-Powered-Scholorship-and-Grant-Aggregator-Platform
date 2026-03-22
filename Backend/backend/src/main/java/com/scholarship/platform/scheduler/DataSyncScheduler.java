package com.scholarship.platform.scheduler;

import com.scholarship.platform.model.Scholarship;
import com.scholarship.platform.repository.ScholarshipRepository;
import com.scholarship.platform.service.ScholarshipService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Periodic maintenance tasks:
 * <ul>
 *   <li>Every Sunday midnight: deactivate expired scholarships</li>
 *   <li>Every Sunday 01:00: evict the featured-scholarships cache</li>
 * </ul>
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DataSyncScheduler {

    private final ScholarshipRepository scholarshipRepository;
    private final ScholarshipService    scholarshipService;

    /**
     * Deactivates scholarships whose deadline has passed.
     * Runs every Sunday at midnight UTC.
     */
    @Scheduled(cron = "0 0 0 * * SUN", zone = "UTC")
    public void deactivateExpiredScholarships() {
        log.info("Running expired-scholarship deactivation job");

        List<Scholarship> active = scholarshipRepository
                .findByDeletedFalseAndActiveTrue(
                        org.springframework.data.domain.PageRequest.of(0, Integer.MAX_VALUE))
                .getContent();

        long count = active.stream()
                .filter(s -> s.getDeadline() != null &&
                             s.getDeadline().isBefore(LocalDateTime.now()))
                .peek(s -> {
                    s.setActive(false);
                    scholarshipRepository.save(s);
                })
                .count();

        log.info("Deactivated {} expired scholarships", count);
    }

    /**
     * Refreshes the featured-scholarship cache.
     * Runs every Sunday at 01:00 UTC.
     */
    @Scheduled(cron = "0 0 1 * * SUN", zone = "UTC")
    public void refreshFeaturedCache() {
        log.info("Evicting featured scholarships cache");
        scholarshipService.evictFeaturedCache();
    }
}
