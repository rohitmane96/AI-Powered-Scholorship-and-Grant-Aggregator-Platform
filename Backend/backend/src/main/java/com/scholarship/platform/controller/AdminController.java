package com.scholarship.platform.controller;

import com.scholarship.platform.dto.response.ApiResponse;
import com.scholarship.platform.dto.response.PageResponse;
import com.scholarship.platform.dto.response.ApplicationResponse;
import com.scholarship.platform.dto.response.ScholarshipResponse;
import com.scholarship.platform.dto.response.UserResponse;
import com.scholarship.platform.service.ApplicationService;
import com.scholarship.platform.service.DashboardService;
import com.scholarship.platform.service.ScholarshipService;
import com.scholarship.platform.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Admin-only consolidated management endpoints.
 */
@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
@Tag(name = "Admin", description = "Platform administration – users, scholarships, analytics")
@SecurityRequirement(name = "bearerAuth")
public class AdminController {

    private final UserService        userService;
    private final ScholarshipService scholarshipService;
    private final ApplicationService applicationService;
    private final DashboardService   dashboardService;

    @Operation(summary = "List all users")
    @GetMapping("/users")
    public ResponseEntity<ApiResponse<PageResponse<UserResponse>>> listUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        return ResponseEntity.ok(ApiResponse.ok(
                PageResponse.of(userService.listAll(page, size))));
    }

    @Operation(summary = "List all scholarships (including inactive)")
    @GetMapping("/scholarships")
    public ResponseEntity<ApiResponse<PageResponse<ScholarshipResponse>>> listScholarships(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(ApiResponse.ok(
                PageResponse.of(scholarshipService.listAll(page, size))));
    }

    @Operation(summary = "List all applications")
    @GetMapping("/applications")
    public ResponseEntity<ApiResponse<PageResponse<ApplicationResponse>>> listApplications(
            @RequestParam(required = false) String scholarshipId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        return ResponseEntity.ok(ApiResponse.ok(
                PageResponse.of(
                        scholarshipId != null && !scholarshipId.isBlank()
                                ? applicationService.getByScholarship(scholarshipId, page, size)
                                : applicationService.getAll(page, size))));
    }

    @Operation(summary = "Platform analytics / statistics")
    @GetMapping("/analytics")
    public ResponseEntity<ApiResponse<Map<String, Object>>> analytics() {
        return ResponseEntity.ok(ApiResponse.ok(dashboardService.getAdminDashboard()));
    }
}
