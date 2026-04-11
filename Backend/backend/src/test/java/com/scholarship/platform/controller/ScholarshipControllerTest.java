package com.scholarship.platform.controller;

import com.scholarship.platform.dto.response.ScholarshipResponse;
import com.scholarship.platform.model.User;
import com.scholarship.platform.model.enums.UserRole;
import com.scholarship.platform.service.RecommendationService;
import com.scholarship.platform.service.ScholarshipService;
import com.scholarship.platform.service.UserService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DisplayName("ScholarshipController Integration Tests")
class ScholarshipControllerTest {

    @Autowired MockMvc mockMvc;

    @MockBean ScholarshipService scholarshipService;
    @MockBean RecommendationService recommendationService;
    @MockBean UserService userService;

    @Test
    @DisplayName("GET /api/scholarships/recommendations without auth returns 401")
    void recommendations_withoutAuthentication_returns401() throws Exception {
        mockMvc.perform(get("/api/scholarships/recommendations"))
                .andExpect(status().isUnauthorized());

        verifyNoInteractions(userService, recommendationService);
    }

    @Test
    @DisplayName("GET /api/scholarships/recommendations as student returns 200")
    void recommendations_withStudentAuthentication_returns200() throws Exception {
        User student = User.builder()
                .id("u1")
                .email("student@example.com")
                .role(UserRole.STUDENT)
                .build();

        ScholarshipResponse response = ScholarshipResponse.builder()
                .id("sch-1")
                .name("Recommended Scholarship")
                .matchScore(82)
                .build();

        when(userService.getByEmail("student@example.com")).thenReturn(student);
        when(recommendationService.getRecommendations(eq(student), anyInt()))
                .thenReturn(List.of(response));

        mockMvc.perform(get("/api/scholarships/recommendations")
                        .with(user("student@example.com").roles("STUDENT"))
                        .param("limit", "5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].id").value("sch-1"))
                .andExpect(jsonPath("$.data[0].matchScore").value(82));
    }

    @Test
    @DisplayName("GET /api/scholarships/recommendations as institution returns 403")
    void recommendations_withInstitutionAuthentication_returns403() throws Exception {
        mockMvc.perform(get("/api/scholarships/recommendations")
                        .with(user("institution@example.com").roles("INSTITUTION")))
                .andExpect(status().isForbidden());

        verifyNoInteractions(userService, recommendationService);
    }
}
