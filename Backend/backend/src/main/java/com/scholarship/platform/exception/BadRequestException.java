package com.scholarship.platform.exception;

import org.springframework.http.HttpStatus;

/**
 * Thrown when client input is invalid or a business rule is violated.
 */
public class BadRequestException extends CustomException {

    public BadRequestException(String message) {
        super(message, HttpStatus.BAD_REQUEST, "BAD_REQUEST");
    }

    public BadRequestException(String message, String errorCode) {
        super(message, HttpStatus.BAD_REQUEST, errorCode);
    }
}
