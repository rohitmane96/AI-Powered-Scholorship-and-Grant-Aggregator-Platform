package com.scholarship.platform;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.info.Contact;
import io.swagger.v3.oas.annotations.info.Info;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.data.mongodb.config.EnableMongoAuditing;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * ScholarMatch AI – Scholarship & Grant Aggregator Platform
 * <p>
 * Entry point for the Spring Boot application.
 * <p>
 * Team: Group 32 – Indira College of Engineering and Management
 */
@SpringBootApplication
@EnableMongoAuditing
@EnableScheduling
@EnableAsync
@EnableCaching
@OpenAPIDefinition(
        info = @Info(
                title       = "ScholarMatch AI API",
                version     = "1.0.0",
                description = "REST API for the AI-Driven Scholarship & Grant Aggregator Platform",
                contact     = @Contact(
                        name  = "Group 32 – ICEM",
                        email = "group32@icem.edu.in"
                )
        )
)
public class ScholarshipPlatformApplication {

    public static void main(String[] args) {
        SpringApplication.run(ScholarshipPlatformApplication.class, args);
    }
}
