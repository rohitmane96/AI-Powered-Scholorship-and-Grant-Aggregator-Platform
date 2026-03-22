package com.scholarship.platform.controller;

import com.scholarship.platform.dto.request.ProfileUpdateRequest;
import com.scholarship.platform.dto.response.ApiResponse;
import com.scholarship.platform.dto.response.UserResponse;
import com.scholarship.platform.model.User;
import com.scholarship.platform.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

/**
 * Dedicated profile endpoints (education, preferences, institution details).
 * Complements the general UserController.
 */
@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
@Tag(name = "Profile", description = "Detailed profile management")
@SecurityRequirement(name = "bearerAuth")
public class ProfileController {

    private final UserService userService;

    @Operation(summary = "Get the authenticated user's full profile")
    @GetMapping
    public ResponseEntity<ApiResponse<UserResponse>> get(
            @AuthenticationPrincipal UserDetails principal) {

        User user = userService.getByEmail(principal.getUsername());
        return ResponseEntity.ok(ApiResponse.ok(userService.toResponse(user)));
    }

    @Operation(summary = "Update profile fields")
    @PutMapping
    public ResponseEntity<ApiResponse<UserResponse>> update(
            @AuthenticationPrincipal UserDetails principal,
            @Valid @RequestBody ProfileUpdateRequest request) {

        User updated = userService.updateProfile(principal.getUsername(), request);
        return ResponseEntity.ok(ApiResponse.ok("Profile updated", userService.toResponse(updated)));
    }

    @Operation(summary = "Get profile completion percentage")
    @GetMapping("/completion")
    public ResponseEntity<ApiResponse<Integer>> completion(
            @AuthenticationPrincipal UserDetails principal) {

        User user = userService.getByEmail(principal.getUsername());
        return ResponseEntity.ok(ApiResponse.ok(userService.calculateProfileCompletion(user)));
    }
}
