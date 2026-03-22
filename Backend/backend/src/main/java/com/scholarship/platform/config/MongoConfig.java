package com.scholarship.platform.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.domain.AuditorAware;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;

/**
 * MongoDB configuration.
 * Provides an {@link AuditorAware} bean that populates {@code createdBy}
 * and {@code updatedBy} fields automatically via the auditing support
 * enabled in {@link com.scholarship.platform.ScholarshipPlatformApplication}.
 */
@Configuration
public class MongoConfig {

    @Bean
    public AuditorAware<String> auditorProvider() {
        return () -> {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || !auth.isAuthenticated() ||
                    "anonymousUser".equals(auth.getPrincipal())) {
                return Optional.of("SYSTEM");
            }
            return Optional.of(auth.getName());
        };
    }
}
