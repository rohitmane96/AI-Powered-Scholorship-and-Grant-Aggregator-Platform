package com.scholarship.platform.controller;

import com.scholarship.platform.dto.request.ApplicationRequest;
import com.scholarship.platform.dto.response.ApiResponse;
import com.scholarship.platform.dto.response.ApplicationResponse;
import com.scholarship.platform.dto.response.PageResponse;
import com.scholarship.platform.model.Application;
import com.scholarship.platform.model.User;
import com.scholarship.platform.model.enums.ApplicationStatus;
import com.scholarship.platform.service.ApplicationService;
import com.scholarship.platform.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Application lifecycle management.
 */
@RestController
@RequestMapping("/api/applications")
@RequiredArgsConstructor
@Tag(name = "Applications", description = "Manage scholarship applications")
@SecurityRequirement(name = "bearerAuth")
public class ApplicationController {

    private final ApplicationService applicationService;
    private final UserService        userService;

    @Operation(summary = "List the current user's applications")
    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<ApplicationResponse>>> list(
            @AuthenticationPrincipal UserDetails principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        User user = userService.getByEmail(principal.getUsername());
        return ResponseEntity.ok(ApiResponse.ok(
                PageResponse.of(applicationService.getByUser(user.getId(), page, size))));
    }

    @Operation(summary = "Get a single application by ID")
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ApplicationResponse>> getById(
            @PathVariable String id,
            @AuthenticationPrincipal UserDetails principal) {

        User user = userService.getByEmail(principal.getUsername());
        return ResponseEntity.ok(ApiResponse.ok(applicationService.getById(id, user)));
    }

    @Operation(summary = "Submit a new application")
    @PostMapping
    public ResponseEntity<ApiResponse<ApplicationResponse>> create(
            @AuthenticationPrincipal UserDetails principal,
            @Valid @RequestBody ApplicationRequest request) {

        User user = userService.getByEmail(principal.getUsername());
        ApplicationResponse created = applicationService.create(request, user);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Application submitted", created));
    }

    @Operation(summary = "Update a DRAFT application")
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ApplicationResponse>> update(
            @PathVariable String id,
            @AuthenticationPrincipal UserDetails principal,
            @Valid @RequestBody ApplicationRequest request) {

        User user = userService.getByEmail(principal.getUsername());
        return ResponseEntity.ok(ApiResponse.ok("Application updated",
                applicationService.update(id, request, user)));
    }

    @Operation(summary = "Delete a DRAFT application")
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable String id,
            @AuthenticationPrincipal UserDetails principal) {

        User user = userService.getByEmail(principal.getUsername());
        applicationService.delete(id, user);
        return ResponseEntity.ok(ApiResponse.ok("Application deleted"));
    }

    @Operation(summary = "[Admin] Update the status of any application")
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN','INSTITUTION')")
    public ResponseEntity<ApiResponse<ApplicationResponse>> updateStatus(
            @PathVariable String id,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserDetails principal) {

        ApplicationStatus status = ApplicationStatus.valueOf(body.get("status"));
        String note = body.getOrDefault("note", "");
        User admin = userService.getByEmail(principal.getUsername());
        return ResponseEntity.ok(ApiResponse.ok("Status updated",
                applicationService.updateStatus(id, status, note, admin)));
    }

    @Operation(summary = "[Institution] Get all applications for a scholarship")
    @GetMapping("/scholarship/{scholarshipId}")
    @PreAuthorize("hasAnyRole('ADMIN','INSTITUTION')")
    public ResponseEntity<ApiResponse<PageResponse<ApplicationResponse>>> getByScholarship(
            @PathVariable String scholarshipId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        return ResponseEntity.ok(ApiResponse.ok(
                PageResponse.of(applicationService.getByScholarship(scholarshipId, page, size))));
    }

    @Operation(summary = "Get the timeline of an application")
    @GetMapping("/{id}/timeline")
    public ResponseEntity<ApiResponse<List<Application.TimelineEvent>>> getTimeline(
            @PathVariable String id,
            @AuthenticationPrincipal UserDetails principal) {

        User user = userService.getByEmail(principal.getUsername());
        return ResponseEntity.ok(ApiResponse.ok(applicationService.getTimeline(id, user)));
    }
}
