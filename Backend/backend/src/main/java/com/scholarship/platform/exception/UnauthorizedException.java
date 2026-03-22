package com.scholarship.platform.exception;

import org.springframework.http.HttpStatus;

/**
 * Thrown when the current user is not permitted to perform an action.
 */
public class UnauthorizedException extends CustomException {

    public UnauthorizedException(String message) {
        super(message, HttpStatus.FORBIDDEN, "ACCESS_DENIED");
    }

    public UnauthorizedException() {
        this("You do not have permission to perform this action.");
    }
}
