package com.scholarship.platform.controller;

import com.scholarship.platform.dto.request.ScholarshipRequest;
import com.scholarship.platform.dto.response.ApiResponse;
import com.scholarship.platform.dto.response.PageResponse;
import com.scholarship.platform.dto.response.ScholarshipResponse;
import com.scholarship.platform.model.User;
import com.scholarship.platform.model.enums.DegreeLevel;
import com.scholarship.platform.model.enums.FundingType;
import com.scholarship.platform.service.RecommendationService;
import com.scholarship.platform.service.ScholarshipService;
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

/**
 * Scholarship CRUD, search, recommendations, and featured listings.
 */
@RestController
@RequestMapping("/api/scholarships")
@RequiredArgsConstructor
@Tag(name = "Scholarships", description = "Scholarship management and discovery")
public class ScholarshipController {

    private final ScholarshipService    scholarshipService;
    private final RecommendationService recommendationService;
    private final UserService           userService;

    @Operation(summary = "List all active scholarships (paginated, optional filters)")
    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<ScholarshipResponse>>> list(
            @RequestParam(required = false) String country,
            @RequestParam(required = false) DegreeLevel degreeLevel,
            @RequestParam(required = false) FundingType fundingType,
            @RequestParam(required = false) String fieldOfStudy,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        return ResponseEntity.ok(ApiResponse.ok(
                PageResponse.of(scholarshipService.listFiltered(
                        country, degreeLevel, fundingType, fieldOfStudy, page, size))));
    }

    @Operation(summary = "Search scholarships by keyword")
    @GetMapping("/search")
    public ResponseEntity<ApiResponse<PageResponse<ScholarshipResponse>>> search(
            @RequestParam String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        return ResponseEntity.ok(ApiResponse.ok(
                PageResponse.of(scholarshipService.search(q, page, size))));
    }

    @Operation(summary = "Get AI-powered scholarship recommendations for the current user")
    @GetMapping("/recommendations")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<List<ScholarshipResponse>>> getRecommendations(
            @AuthenticationPrincipal UserDetails principal,
            @RequestParam(defaultValue = "10") int limit) {

        User user = userService.getByEmail(principal.getUsername());
        List<ScholarshipResponse> recs = recommendationService.getRecommendations(user, limit);
        return ResponseEntity.ok(ApiResponse.ok("Recommendations fetched", recs));
    }

    @Operation(summary = "Get featured scholarships")
    @GetMapping("/featured")
    public ResponseEntity<ApiResponse<List<ScholarshipResponse>>> getFeatured() {
        return ResponseEntity.ok(ApiResponse.ok(scholarshipService.getFeatured()));
    }

    @Operation(summary = "Get a scholarship by ID")
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ScholarshipResponse>> getById(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.ok(scholarshipService.getById(id)));
    }

    @Operation(summary = "Get similar scholarships")
    @GetMapping("/{id}/similar")
    public ResponseEntity<ApiResponse<List<ScholarshipResponse>>> getSimilar(
            @PathVariable String id,
            @RequestParam(defaultValue = "5") int limit) {

        return ResponseEntity.ok(ApiResponse.ok(scholarshipService.getSimilar(id, limit)));
    }

    @Operation(summary = "[Institution/Admin] Create a new scholarship")
    @PostMapping
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasAnyRole('INSTITUTION','ADMIN')")
    public ResponseEntity<ApiResponse<ScholarshipResponse>> create(
            @AuthenticationPrincipal UserDetails principal,
            @Valid @RequestBody ScholarshipRequest request) {

        User user = userService.getByEmail(principal.getUsername());
        ScholarshipResponse created = scholarshipService.create(request, user);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Scholarship created", created));
    }

    @Operation(summary = "[Institution/Admin] Update an existing scholarship")
    @PutMapping("/{id}")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasAnyRole('INSTITUTION','ADMIN')")
    public ResponseEntity<ApiResponse<ScholarshipResponse>> update(
            @PathVariable String id,
            @AuthenticationPrincipal UserDetails principal,
            @Valid @RequestBody ScholarshipRequest request) {

        User user = userService.getByEmail(principal.getUsername());
        return ResponseEntity.ok(ApiResponse.ok("Scholarship updated",
                scholarshipService.update(id, request, user)));
    }

    @Operation(summary = "[Admin] Delete a scholarship")
    @DeleteMapping("/{id}")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasAnyRole('INSTITUTION','ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable String id,
            @AuthenticationPrincipal UserDetails principal) {

        User user = userService.getByEmail(principal.getUsername());
        scholarshipService.delete(id, user);
        return ResponseEntity.ok(ApiResponse.ok("Scholarship deleted"));
    }
}
