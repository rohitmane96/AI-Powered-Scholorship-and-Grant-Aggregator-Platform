package com.scholarship.platform.service;

import com.scholarship.platform.model.enums.ApplicationStatus;
import com.scholarship.platform.model.enums.UserRole;
import com.scholarship.platform.repository.*;
import com.scholarship.platform.util.DateUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * Aggregates statistics for student, institution, and admin dashboards.
 */
@Service
@RequiredArgsConstructor
public class DashboardService {

    private final UserRepository         userRepository;
    private final ScholarshipRepository  scholarshipRepository;
    private final ApplicationRepository  applicationRepository;

    // ── Student dashboard ──────────────────────────────────────────────────────

    public Map<String, Object> getStudentDashboard(String userId) {
        long total       = applicationRepository.countByUserId(userId);
        long active      = applicationRepository
                .findByUserIdAndStatus(userId, ApplicationStatus.SUBMITTED).size();
        long accepted    = applicationRepository
                .findByUserIdAndStatus(userId, ApplicationStatus.ACCEPTED).size();
        long underReview = applicationRepository
                .findByUserIdAndStatus(userId, ApplicationStatus.UNDER_REVIEW).size();

        return Map.of(
                "totalApplications",    total,
                "activeApplications",   active,
                "acceptedApplications", accepted,
                "underReview",          underReview,
                "successRate",          total > 0 ? Math.round(accepted * 100.0 / total) : 0
        );
    }

    // ── Admin dashboard ────────────────────────────────────────────────────────

    @Cacheable("platform_stats")
    public Map<String, Object> getAdminDashboard() {
        long totalUsers       = userRepository.countByRoleAndDeletedFalse(UserRole.STUDENT);
        long totalInstitutions= userRepository.countByRoleAndDeletedFalse(UserRole.INSTITUTION);
        long totalScholarships= scholarshipRepository.countByDeletedFalseAndActiveTrue();
        long totalApplications= applicationRepository.count();
        long accepted         = applicationRepository.countByStatus(ApplicationStatus.ACCEPTED);
        long rejected         = applicationRepository.countByStatus(ApplicationStatus.REJECTED);

        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
        long newUsers        = userRepository.countByCreatedAtAfter(thirtyDaysAgo);

        return Map.of(
                "totalStudents",       totalUsers,
                "totalInstitutions",   totalInstitutions,
                "totalScholarships",   totalScholarships,
                "totalApplications",   totalApplications,
                "acceptedApplications",accepted,
                "rejectedApplications",rejected,
                "newUsersLast30Days",  newUsers
        );
    }

    // ── Institution dashboard ──────────────────────────────────────────────────

    public Map<String, Object> getInstitutionDashboard(String userId) {
        long posted      = scholarshipRepository.countByCreatedByAndDeletedFalse(userId);

        return Map.of(
                "scholarshipsPosted",  posted
        );
    }
}
