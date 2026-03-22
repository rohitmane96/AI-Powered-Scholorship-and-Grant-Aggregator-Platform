package com.scholarship.platform.controller;

import com.scholarship.platform.dto.response.ApiResponse;
import com.scholarship.platform.dto.response.PageResponse;
import com.scholarship.platform.model.Notification;
import com.scholarship.platform.service.NotificationService;
import com.scholarship.platform.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

/**
 * In-app notification management.
 */
@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@Tag(name = "Notifications", description = "In-app notification management")
@SecurityRequirement(name = "bearerAuth")
public class NotificationController {

    private final NotificationService notificationService;
    private final UserService         userService;

    @Operation(summary = "List the current user's notifications")
    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<Notification>>> list(
            @AuthenticationPrincipal UserDetails principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        String userId = userService.getByEmail(principal.getUsername()).getId();
        return ResponseEntity.ok(ApiResponse.ok(
                PageResponse.of(notificationService.getByUser(userId, page, size))));
    }

    @Operation(summary = "Count unread notifications")
    @GetMapping("/unread")
    public ResponseEntity<ApiResponse<Long>> countUnread(
            @AuthenticationPrincipal UserDetails principal) {

        String userId = userService.getByEmail(principal.getUsername()).getId();
        return ResponseEntity.ok(ApiResponse.ok(notificationService.countUnread(userId)));
    }

    @Operation(summary = "Mark a notification as read")
    @PatchMapping("/{id}/read")
    public ResponseEntity<ApiResponse<Void>> markRead(
            @PathVariable String id,
            @AuthenticationPrincipal UserDetails principal) {

        String userId = userService.getByEmail(principal.getUsername()).getId();
        notificationService.markRead(id, userId);
        return ResponseEntity.ok(ApiResponse.ok("Notification marked as read"));
    }

    @Operation(summary = "Mark all notifications as read")
    @PatchMapping("/read-all")
    public ResponseEntity<ApiResponse<Void>> markAllRead(
            @AuthenticationPrincipal UserDetails principal) {

        String userId = userService.getByEmail(principal.getUsername()).getId();
        notificationService.markAllRead(userId);
        return ResponseEntity.ok(ApiResponse.ok("All notifications marked as read"));
    }

    @Operation(summary = "Delete a notification")
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable String id,
            @AuthenticationPrincipal UserDetails principal) {

        String userId = userService.getByEmail(principal.getUsername()).getId();
        notificationService.delete(id, userId);
        return ResponseEntity.ok(ApiResponse.ok("Notification deleted"));
    }
}
