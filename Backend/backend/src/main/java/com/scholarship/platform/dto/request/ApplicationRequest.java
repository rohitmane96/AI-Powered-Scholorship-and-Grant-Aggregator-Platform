package com.scholarship.platform.dto.request;

import com.scholarship.platform.model.enums.ApplicationStatus;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * Payload for submitting or updating an Application.
 */
@Data
public class ApplicationRequest {

    @NotBlank(message = "Scholarship ID is required")
    private String scholarshipId;

    private String notes;

    /**
     * Optional – allows admins/institutions to set status directly.
     * Students may only set DRAFT or SUBMITTED.
     */
    private ApplicationStatus status;
}
