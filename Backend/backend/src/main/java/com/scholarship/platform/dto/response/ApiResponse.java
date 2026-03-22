package com.scholarship.platform.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Unified envelope for all API responses.
 *
 * <pre>
 * Success: { success:true, message:"...", data:{...} }
 * Error:   { success:false, message:"...", errorCode:"...", path:"..." }
 * </pre>
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {

    private boolean success;
    private String  message;
    private T       data;
    private String  errorCode;
    private LocalDateTime timestamp;
    private String  path;

    // ── Factory helpers ────────────────────────────────────────────────────────

    public static <T> ApiResponse<T> ok(String message, T data) {
        return ApiResponse.<T>builder()
                .success(true)
                .message(message)
                .data(data)
                .timestamp(LocalDateTime.now())
                .build();
    }

    public static <T> ApiResponse<T> ok(T data) {
        return ok("Success", data);
    }

    public static <T> ApiResponse<T> ok(String message) {
        return ok(message, null);
    }
}
