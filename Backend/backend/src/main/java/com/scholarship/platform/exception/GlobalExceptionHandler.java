package com.scholarship.platform.exception;

import com.scholarship.platform.dto.response.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * Central exception-handling component that turns exceptions into consistent
 * JSON error responses consumed by the React frontend.
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    // ── Custom platform exceptions ─────────────────────────────────────────────

    @ExceptionHandler(CustomException.class)
    public ResponseEntity<ApiResponse<Void>> handleCustomException(
            CustomException ex, HttpServletRequest request) {

        log.error("CustomException at {}: {}", request.getRequestURI(), ex.getMessage());
        return buildErrorResponse(ex.getMessage(), ex.getErrorCode(),
                                  ex.getStatus(), request.getRequestURI());
    }

    // ── Spring Security ────────────────────────────────────────────────────────

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse<Void>> handleAccessDenied(
            AccessDeniedException ex, HttpServletRequest request) {

        return buildErrorResponse("Access denied", "ACCESS_DENIED",
                                  HttpStatus.FORBIDDEN, request.getRequestURI());
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ApiResponse<Void>> handleBadCredentials(
            BadCredentialsException ex, HttpServletRequest request) {

        return buildErrorResponse("Invalid email or password", "INVALID_CREDENTIALS",
                                  HttpStatus.UNAUTHORIZED, request.getRequestURI());
    }

    // ── Validation ─────────────────────────────────────────────────────────────

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Map<String, String>>> handleValidation(
            MethodArgumentNotValidException ex, HttpServletRequest request) {

        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach(error -> {
            String field   = error instanceof FieldError fe ? fe.getField() : error.getObjectName();
            String message = error.getDefaultMessage();
            errors.put(field, message);
        });

        ApiResponse<Map<String, String>> response = ApiResponse.<Map<String, String>>builder()
                .success(false)
                .message("Validation failed")
                .errorCode("VALIDATION_ERROR")
                .data(errors)
                .timestamp(LocalDateTime.now())
                .path(request.getRequestURI())
                .build();

        return ResponseEntity.badRequest().body(response);
    }

    // ── File upload ────────────────────────────────────────────────────────────

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ApiResponse<Void>> handleMaxUploadSize(
            MaxUploadSizeExceededException ex, HttpServletRequest request) {

        return buildErrorResponse("File size exceeds the maximum allowed limit (10 MB)",
                                  "FILE_TOO_LARGE", HttpStatus.PAYLOAD_TOO_LARGE,
                                  request.getRequestURI());
    }

    // ── Fallback ───────────────────────────────────────────────────────────────

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleGeneral(
            Exception ex, HttpServletRequest request) {

        log.error("Unhandled exception at {}: ", request.getRequestURI(), ex);
        return buildErrorResponse("An unexpected error occurred. Please try again later.",
                                  "INTERNAL_SERVER_ERROR", HttpStatus.INTERNAL_SERVER_ERROR,
                                  request.getRequestURI());
    }

    // ── Helper ─────────────────────────────────────────────────────────────────

    private <T> ResponseEntity<ApiResponse<T>> buildErrorResponse(
            String message, String errorCode, HttpStatus status, String path) {

        ApiResponse<T> response = ApiResponse.<T>builder()
                .success(false)
                .message(message)
                .errorCode(errorCode)
                .timestamp(LocalDateTime.now())
                .path(path)
                .build();

        return ResponseEntity.status(status).body(response);
    }
}
