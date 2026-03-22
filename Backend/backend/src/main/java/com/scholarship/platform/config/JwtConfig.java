package com.scholarship.platform.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Typed configuration properties for JWT settings.
 * Values are bound from {@code application.yml} under the {@code jwt} prefix.
 */
@Data
@Configuration
@ConfigurationProperties(prefix = "jwt")
public class JwtConfig {

    /** Base64-encoded HMAC-SHA256 secret key. */
    private String secret;

    /** Access token lifetime in milliseconds (default: 24 hours). */
    private long expiration = 86_400_000L;

    /** Refresh token lifetime in milliseconds (default: 7 days). */
    private long refreshExpiration = 604_800_000L;
}
