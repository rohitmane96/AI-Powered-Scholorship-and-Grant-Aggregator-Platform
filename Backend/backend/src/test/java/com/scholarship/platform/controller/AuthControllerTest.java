package com.scholarship.platform.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.scholarship.platform.dto.request.LoginRequest;
import com.scholarship.platform.dto.request.RegisterRequest;
import com.scholarship.platform.dto.response.AuthResponse;
import com.scholarship.platform.model.enums.UserRole;
import com.scholarship.platform.service.AuthService;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for {@link AuthController}.
 * Uses an embedded MongoDB (Flapdoodle) so the full Spring context loads correctly.
 * The {@link AuthService} is mocked to keep tests fast and deterministic.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DisplayName("AuthController Integration Tests")
class AuthControllerTest {

    @Autowired MockMvc      mockMvc;
    @Autowired ObjectMapper objectMapper;

    @MockBean AuthService authService;

    private AuthResponse sampleAuth;

    @BeforeEach
    void setUp() {
        sampleAuth = AuthResponse.builder()
                .accessToken("access.token.here")
                .refreshToken("refresh.token.here")
                .userId("user-1")
                .email("test@example.com")
                .fullName("Test User")
                .role(UserRole.STUDENT)
                .verified(false)
                .build();
    }

    @Test
    @DisplayName("POST /api/auth/register – valid request returns 201")
    void register_validRequest_returns201() throws Exception {
        RegisterRequest request = new RegisterRequest();
        request.setFullName("Test User");
        request.setEmail("test@example.com");
        request.setPassword("Password1!");
        request.setRole(UserRole.STUDENT);

        when(authService.register(any())).thenReturn(sampleAuth);

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request))
                        .with(csrf()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.email").value("test@example.com"));
    }

    @Test
    @DisplayName("POST /api/auth/register – missing email returns 400")
    void register_missingEmail_returns400() throws Exception {
        RegisterRequest request = new RegisterRequest();
        request.setFullName("Test User");
        request.setPassword("Password1!");
        request.setRole(UserRole.STUDENT);
        // email intentionally missing

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request))
                        .with(csrf()))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /api/auth/login – valid credentials return 200")
    void login_validCredentials_returns200() throws Exception {
        LoginRequest request = new LoginRequest();
        request.setEmail("test@example.com");
        request.setPassword("Password1!");

        when(authService.login(any())).thenReturn(sampleAuth);

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request))
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.accessToken").exists());
    }
}
