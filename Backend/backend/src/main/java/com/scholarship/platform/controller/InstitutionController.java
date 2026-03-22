package com.scholarship.platform.controller;

import com.scholarship.platform.dto.response.ApiResponse;
import com.scholarship.platform.dto.response.PageResponse;
import com.scholarship.platform.dto.response.ScholarshipResponse;
import com.scholarship.platform.model.User;
import com.scholarship.platform.service.ApplicationService;
import com.scholarship.platform.service.DashboardService;
import com.scholarship.platform.service.ScholarshipService;
import com.scholarship.platform.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Institution-specific endpoints for managing their own scholarship listings
 * and viewing received applications and analytics.
 */
@RestController
@RequestMapping("/api/institutions")
@RequiredArgsConstructor
@Tag(name = "Institutions", description = "Institution scholarship management")
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("hasAnyRole('INSTITUTION','ADMIN')")
public class InstitutionController {

    private final ScholarshipService scholarshipService;
    private final ApplicationService applicationService;
    private final DashboardService   dashboardService;
    private final UserService        userService;

    @Operation(summary = "List scholarships posted by the current institution")
    @GetMapping("/my-scholarships")
    public ResponseEntity<ApiResponse<PageResponse<ScholarshipResponse>>> myScholarships(
            @AuthenticationPrincipal UserDetails principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        User user = userService.getByEmail(principal.getUsername());
        return ResponseEntity.ok(ApiResponse.ok(
                PageResponse.of(scholarshipService.listByCreator(user.getId(), page, size))));
    }

    @Operation(summary = "Get institution dashboard statistics")
    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<Map<String, Object>>> dashboard(
            @AuthenticationPrincipal UserDetails principal) {

        User user = userService.getByEmail(principal.getUsername());
        return ResponseEntity.ok(ApiResponse.ok(
                dashboardService.getInstitutionDashboard(user.getId())));
    }
}
