package com.scholarship.platform.exception;

import org.springframework.http.HttpStatus;

/**
 * Thrown when a requested resource does not exist in the database.
 */
public class ResourceNotFoundException extends CustomException {

    public ResourceNotFoundException(String resource, String field, Object value) {
        super(resource + " not found with " + field + " = '" + value + "'",
              HttpStatus.NOT_FOUND, "RESOURCE_NOT_FOUND");
    }

    public ResourceNotFoundException(String message) {
        super(message, HttpStatus.NOT_FOUND, "RESOURCE_NOT_FOUND");
    }
}
