package com.scholarship.platform.controller;

import com.scholarship.platform.dto.request.ProfileUpdateRequest;
import com.scholarship.platform.dto.response.ApiResponse;
import com.scholarship.platform.dto.response.PageResponse;
import com.scholarship.platform.dto.response.UserResponse;
import com.scholarship.platform.model.User;
import com.scholarship.platform.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

/**
 * User-profile endpoints for the authenticated user and admin operations.
 */
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Tag(name = "Users", description = "Profile management and user administration")
@SecurityRequirement(name = "bearerAuth")
public class UserController {

    private final UserService userService;

    @Operation(summary = "Get the authenticated user's profile")
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> getMe(
            @AuthenticationPrincipal UserDetails principal) {

        User user = userService.getByEmail(principal.getUsername());
        return ResponseEntity.ok(ApiResponse.ok(userService.toResponse(user)));
    }

    @Operation(summary = "Update the authenticated user's profile")
    @PutMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> updateMe(
            @AuthenticationPrincipal UserDetails principal,
            @Valid @RequestBody ProfileUpdateRequest request) {

        User updated = userService.updateProfile(principal.getUsername(), request);
        return ResponseEntity.ok(ApiResponse.ok("Profile updated", userService.toResponse(updated)));
    }

    @Operation(summary = "Get statistics for the authenticated user")
    @GetMapping("/me/stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getMyStats(
            @AuthenticationPrincipal UserDetails principal) {

        User user = userService.getByEmail(principal.getUsername());
        return ResponseEntity.ok(ApiResponse.ok(userService.getUserStats(user.getId())));
    }

    @Operation(summary = "Change the authenticated user's password")
    @PutMapping("/me/password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @AuthenticationPrincipal UserDetails principal,
            @RequestBody Map<String, String> body) {

        userService.changePassword(
                principal.getUsername(),
                body.get("currentPassword"),
                body.get("newPassword"));
        return ResponseEntity.ok(ApiResponse.ok("Password changed successfully"));
    }

    @Operation(summary = "Upload a profile avatar image")
    @PostMapping(value = "/me/avatar", consumes = "multipart/form-data")
    public ResponseEntity<ApiResponse<String>> uploadAvatar(
            @AuthenticationPrincipal UserDetails principal,
            @RequestParam("file") MultipartFile file) {

        String url = userService.uploadAvatar(principal.getUsername(), file);
        return ResponseEntity.ok(ApiResponse.ok("Avatar uploaded", url));
    }

    // ── Admin-only ─────────────────────────────────────────────────────────────

    @Operation(summary = "[Admin] List all users")
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PageResponse<UserResponse>>> listUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        return ResponseEntity.ok(ApiResponse.ok(
                PageResponse.of(userService.listAll(page, size))));
    }

    @Operation(summary = "[Admin] Get a specific user by ID")
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<UserResponse>> getUserById(@PathVariable String id) {
        User user = userService.getById(id);
        return ResponseEntity.ok(ApiResponse.ok(userService.toResponse(user)));
    }

    @Operation(summary = "[Admin] Soft-delete a user")
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteUser(@PathVariable String id) {
        userService.deleteUser(id);
        return ResponseEntity.ok(ApiResponse.ok("User deleted"));
    }
}
