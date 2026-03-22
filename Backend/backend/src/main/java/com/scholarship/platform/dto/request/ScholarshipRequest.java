package com.scholarship.platform.dto.request;

import com.scholarship.platform.model.Scholarship;
import com.scholarship.platform.model.enums.DegreeLevel;
import com.scholarship.platform.model.enums.FundingType;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Payload for creating / updating a Scholarship.
 */
@Data
public class ScholarshipRequest {

    @NotBlank(message = "Scholarship name is required")
    @Size(max = 200, message = "Name must not exceed 200 characters")
    private String name;

    @NotBlank(message = "Provider name is required")
    private String provider;

    @NotBlank(message = "Description is required")
    @Size(max = 5000, message = "Description must not exceed 5000 characters")
    private String description;

    @NotBlank(message = "Country is required")
    private String country;

    @NotNull(message = "Degree level is required")
    private DegreeLevel degreeLevel;

    @NotBlank(message = "Field of study is required")
    private String fieldOfStudy;

    @NotNull(message = "Funding type is required")
    private FundingType fundingType;

    private Scholarship.FundingAmount fundingAmount;

    @NotNull(message = "Deadline is required")
    @Future(message = "Deadline must be a future date")
    private LocalDateTime deadline;

    private List<String> eligibility;
    private List<String> requirements;

    @Pattern(regexp = "^(https?://)?.*", message = "Application URL must be a valid URL")
    private String applicationUrl;

    private boolean featured;
    private boolean active = true;
    private List<String> tags;
}
