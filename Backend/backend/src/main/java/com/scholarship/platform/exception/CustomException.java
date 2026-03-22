package com.scholarship.platform.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

/**
 * Base runtime exception for the platform.
 */
@Getter
public class CustomException extends RuntimeException {

    private final HttpStatus status;
    private final String errorCode;

    public CustomException(String message, HttpStatus status, String errorCode) {
        super(message);
        this.status    = status;
        this.errorCode = errorCode;
    }

    public CustomException(String message, HttpStatus status) {
        this(message, status, status.name());
    }
}
