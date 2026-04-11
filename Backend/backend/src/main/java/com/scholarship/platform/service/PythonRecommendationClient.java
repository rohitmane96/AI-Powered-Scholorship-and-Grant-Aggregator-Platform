package com.scholarship.platform.service;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.scholarship.platform.model.Scholarship;
import com.scholarship.platform.model.User;
import lombok.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Component
@RequiredArgsConstructor
public class PythonRecommendationClient {

    private final ObjectMapper objectMapper;

    @Value("${app.recommendation.python.enabled:true}")
    private boolean enabled;

    @Value("${app.recommendation.python.url:http://recommender:8090}")
    private String baseUrl;

    @Value("${app.recommendation.python.timeout-ms:2500}")
    private int timeoutMs;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(2))
            .build();

    public Optional<List<PythonRecommendation>> getRecommendations(
            User user,
            List<Scholarship> scholarships,
            List<Scholarship> acceptedScholarships,
            int limit) {

        if (!enabled || scholarships == null || scholarships.isEmpty()) {
            return Optional.empty();
        }

        RecommendationRequest payload = RecommendationRequest.builder()
                .user(user)
                .scholarships(scholarships)
                .acceptedScholarships(acceptedScholarships)
                .limit(limit)
                .build();

        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(baseUrl + "/recommend"))
                    .timeout(Duration.ofMillis(timeoutMs))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(payload)))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                log.warn("Python recommender returned non-success status {}: {}",
                        response.statusCode(), response.body());
                return Optional.empty();
            }

            RecommendationResponse body = objectMapper.readValue(response.body(), RecommendationResponse.class);
            return Optional.of(Optional.ofNullable(body.getRecommendations()).orElse(Collections.emptyList()));
        } catch (IOException | InterruptedException ex) {
            if (ex instanceof InterruptedException) {
                Thread.currentThread().interrupt();
            }
            log.warn("Python recommender unavailable, falling back to Java engine: {}", ex.getMessage());
            return Optional.empty();
        }
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    private static class RecommendationRequest {
        private User user;
        private List<Scholarship> scholarships;
        private List<Scholarship> acceptedScholarships;
        private int limit;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    private static class RecommendationResponse {
        private List<PythonRecommendation> recommendations;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PythonRecommendation {
        @JsonProperty("scholarshipId")
        private String scholarshipId;
        private Integer score;
        private Map<String, Integer> scoreBreakdown;
    }
}
