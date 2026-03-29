package com.scholarship.platform.service;

import com.scholarship.platform.dto.response.ApplicationResponse;
import com.scholarship.platform.model.Application;
import com.scholarship.platform.model.Scholarship;
import com.scholarship.platform.model.User;
import com.scholarship.platform.model.enums.ApplicationStatus;
import com.scholarship.platform.model.enums.UserRole;
import com.scholarship.platform.repository.ApplicationRepository;
import com.scholarship.platform.repository.ScholarshipRepository;
import com.scholarship.platform.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Aggregates statistics for student, institution, and admin dashboards.
 */
@Service
@RequiredArgsConstructor
public class DashboardService {

    private final UserRepository userRepository;
    private final ScholarshipRepository scholarshipRepository;
    private final ApplicationRepository applicationRepository;
    private final ApplicationService applicationService;

    public Map<String, Object> getStudentDashboard(String userId) {
        List<Application> applications = applicationRepository.findByUserId(userId);
        long total = applications.size();

        return Map.of(
                "totalApplications", total,
                "submittedApplications", countStatus(applications, ApplicationStatus.SUBMITTED),
                "underReviewApplications", countStatus(applications, ApplicationStatus.UNDER_REVIEW),
                "acceptedApplications", countStatus(applications, ApplicationStatus.ACCEPTED),
                "rejectedApplications", countStatus(applications, ApplicationStatus.REJECTED),
                "shortlistedApplications", 0,
                "successRate", total > 0
                        ? Math.round(countStatus(applications, ApplicationStatus.ACCEPTED) * 100.0 / total)
                        : 0
        );
    }

    @Cacheable("platform_stats")
    public Map<String, Object> getAdminDashboard() {
        long totalStudents = userRepository.countByRoleAndDeletedFalse(UserRole.STUDENT);
        long totalInstitutions = userRepository.countByRoleAndDeletedFalse(UserRole.INSTITUTION);
        long totalScholarships = scholarshipRepository.countByDeletedFalseAndActiveTrue();
        long totalApplications = applicationRepository.count();
        long accepted = applicationRepository.countByStatus(ApplicationStatus.ACCEPTED);
        long rejected = applicationRepository.countByStatus(ApplicationStatus.REJECTED);
        long submitted = applicationRepository.countByStatus(ApplicationStatus.SUBMITTED);
        long underReview = applicationRepository.countByStatus(ApplicationStatus.UNDER_REVIEW);
        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
        long newUsers = userRepository.countByCreatedAtAfter(thirtyDaysAgo);

        List<User> users = userRepository.findAllByDeletedFalse();
        List<Scholarship> scholarships = scholarshipRepository.findAllByDeletedFalse();

        Map<String, Object> dashboard = new LinkedHashMap<>();
        dashboard.put("totalStudents", totalStudents);
        dashboard.put("totalInstitutions", totalInstitutions);
        dashboard.put("totalUsers", totalStudents + totalInstitutions);
        dashboard.put("totalScholarships", totalScholarships);
        dashboard.put("activeScholarships", totalScholarships);
        dashboard.put("totalApplications", totalApplications);
        dashboard.put("acceptedApplications", accepted);
        dashboard.put("rejectedApplications", rejected);
        dashboard.put("newUsersLast30Days", newUsers);
        dashboard.put("applicationStatusData", List.of(
                statusPoint("Submitted", submitted),
                statusPoint("Under Review", underReview),
                statusPoint("Accepted", accepted),
                statusPoint("Rejected", rejected)
        ));
        dashboard.put("platformGrowth", buildGrowthSeries(users, scholarships));
        dashboard.put("recentApplications", applicationService.getAll(0, 8).getContent());
        return dashboard;
    }

    public Map<String, Object> getInstitutionDashboard(String userId) {
        List<Scholarship> scholarships = scholarshipRepository.findByCreatedByAndDeletedFalse(userId);
        List<String> scholarshipIds = scholarships.stream().map(Scholarship::getId).toList();
        List<Application> applications = scholarshipIds.isEmpty()
                ? List.of()
                : applicationRepository.findByScholarshipIdIn(scholarshipIds);

        LocalDateTime startOfMonth = LocalDateTime.now()
                .withDayOfMonth(1)
                .withHour(0)
                .withMinute(0)
                .withSecond(0)
                .withNano(0);

        double avgMatchScore = applications.stream().mapToInt(Application::getMatchScore).average().orElse(0);

        return Map.of(
                "totalScholarships", scholarships.size(),
                "scholarshipsPosted", scholarships.size(),
                "totalApplications", applications.size(),
                "activeScholarships", scholarships.stream().filter(Scholarship::isActive).count(),
                "avgMatchScore", Math.round(avgMatchScore),
                "applicationsThisMonth", applications.stream()
                        .filter(app -> {
                            LocalDateTime stamp = app.getSubmittedAt() != null ? app.getSubmittedAt() : app.getCreatedAt();
                            return stamp != null && !stamp.isBefore(startOfMonth);
                        })
                        .count(),
                "applicationsByScholarship", buildApplicationsByScholarship(scholarships, applications),
                "applicationsOverTime", buildApplicationSeries(applications),
                "recentApplications", applicationService.getRecentByScholarshipIds(scholarshipIds, 8)
        );
    }

    private long countStatus(List<Application> applications, ApplicationStatus status) {
        return applications.stream().filter(app -> app.getStatus() == status).count();
    }

    private Map<String, Object> statusPoint(String name, long value) {
        return Map.of("name", name, "value", value);
    }

    private List<Map<String, Object>> buildGrowthSeries(List<User> users, List<Scholarship> scholarships) {
        List<YearMonth> months = recentMonths(8);
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMM");

        return months.stream()
                .map(month -> Map.<String, Object>of(
                        "month", month.format(formatter),
                        "users", users.stream()
                                .filter(user -> user.getCreatedAt() != null && YearMonth.from(user.getCreatedAt()).equals(month))
                                .count(),
                        "scholarships", scholarships.stream()
                                .filter(scholarship -> scholarship.getCreatedAt() != null && YearMonth.from(scholarship.getCreatedAt()).equals(month))
                                .count()
                ))
                .toList();
    }

    private List<Map<String, Object>> buildApplicationsByScholarship(List<Scholarship> scholarships, List<Application> applications) {
        return scholarships.stream()
                .map(scholarship -> Map.<String, Object>of(
                        "name", scholarship.getName(),
                        "applications", applications.stream()
                                .filter(app -> scholarship.getId().equals(app.getScholarshipId()))
                                .count()
                ))
                .sorted((left, right) -> Long.compare((Long) right.get("applications"), (Long) left.get("applications")))
                .toList();
    }

    private List<Map<String, Object>> buildApplicationSeries(List<Application> applications) {
        List<YearMonth> months = recentMonths(8);
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMM");

        return months.stream()
                .map(month -> Map.<String, Object>of(
                        "month", month.format(formatter),
                        "applications", applications.stream()
                                .filter(app -> {
                                    LocalDateTime stamp = app.getSubmittedAt() != null ? app.getSubmittedAt() : app.getCreatedAt();
                                    return stamp != null && YearMonth.from(stamp).equals(month);
                                })
                                .count()
                ))
                .toList();
    }

    private List<YearMonth> recentMonths(int count) {
        YearMonth current = YearMonth.now();
        List<YearMonth> months = new ArrayList<>();
        for (int index = count - 1; index >= 0; index--) {
            months.add(current.minusMonths(index));
        }
        return months;
    }
}
