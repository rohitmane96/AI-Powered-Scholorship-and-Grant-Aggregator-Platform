package com.scholarship.platform.controller;

import com.scholarship.platform.dto.response.ApiResponse;
import com.scholarship.platform.model.User;
import com.scholarship.platform.service.DashboardService;
import com.scholarship.platform.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Role-specific dashboard endpoints.
 */
@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
@Tag(name = "Dashboard", description = "Role-specific dashboard statistics")
@SecurityRequirement(name = "bearerAuth")
public class DashboardController {

    private final DashboardService dashboardService;
    private final UserService      userService;

    @Operation(summary = "Student dashboard statistics")
    @GetMapping("/student")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> studentDashboard(
            @AuthenticationPrincipal UserDetails principal) {

        User user = userService.getByEmail(principal.getUsername());
        return ResponseEntity.ok(ApiResponse.ok(
                dashboardService.getStudentDashboard(user.getId())));
    }

    @Operation(summary = "Admin dashboard statistics")
    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> adminDashboard() {
        return ResponseEntity.ok(ApiResponse.ok(dashboardService.getAdminDashboard()));
    }

    @Operation(summary = "Institution dashboard statistics")
    @GetMapping("/institution")
    @PreAuthorize("hasRole('INSTITUTION')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> institutionDashboard(
            @AuthenticationPrincipal UserDetails principal) {

        User user = userService.getByEmail(principal.getUsername());
        return ResponseEntity.ok(ApiResponse.ok(
                dashboardService.getInstitutionDashboard(user.getId())));
    }

    @Operation(summary = "Overall platform statistics (public)")
    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> stats() {
        return ResponseEntity.ok(ApiResponse.ok(dashboardService.getAdminDashboard()));
    }
}
