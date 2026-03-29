package com.scholarship.platform.service;

import com.scholarship.platform.dto.request.ProfileUpdateRequest;
import com.scholarship.platform.dto.response.UserResponse;
import com.scholarship.platform.exception.BadRequestException;
import com.scholarship.platform.exception.ResourceNotFoundException;
import com.scholarship.platform.model.User;
import com.scholarship.platform.repository.ApplicationRepository;
import com.scholarship.platform.repository.UserRepository;
import com.scholarship.platform.util.Constants;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

/**
 * User profile management – reads, updates, password changes, and avatars.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository        userRepository;
    private final ApplicationRepository applicationRepository;
    private final PasswordEncoder       passwordEncoder;
    private final FileStorageService    fileStorageService;
    private final ModelMapper           modelMapper;

    // ── Reads ──────────────────────────────────────────────────────────────────

    public User getByEmail(String email) {
        return userRepository.findByEmailAndDeletedFalse(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));
    }

    public User getById(String id) {
        return userRepository.findById(id)
                .filter(u -> !u.isDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
    }

    public UserResponse toResponse(User user) {
        UserResponse response = modelMapper.map(user, UserResponse.class);
        response.setProfileCompletion(user.getProfileCompletion());
        return response;
    }

    public Page<UserResponse> listAll(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return userRepository.findAllByDeletedFalse(pageable).map(this::toResponse);
    }

    // ── Update ─────────────────────────────────────────────────────────────────

    public User updateProfile(String email, ProfileUpdateRequest request) {
        User user = getByEmail(email);

        if (request.getFullName() != null)        user.setFullName(request.getFullName());
        if (request.getEducation() != null)        user.setEducation(request.getEducation());
        if (request.getPreferences() != null)      user.setPreferences(request.getPreferences());
        if (request.getInstitutionName() != null)  user.setInstitutionName(request.getInstitutionName());
        if (request.getInstitutionType() != null)  user.setInstitutionType(request.getInstitutionType());
        if (request.getCountry() != null)          user.setCountry(request.getCountry());
        if (request.getWebsite() != null)          user.setWebsite(request.getWebsite());

        user.setProfileCompletion(calculateProfileCompletion(user));

        return userRepository.save(user);
    }

    public void changePassword(String email, String currentPassword, String newPassword) {
        User user = getByEmail(email);

        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new BadRequestException("Current password is incorrect", "WRONG_PASSWORD");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        log.info("Password changed for user: {}", email);
    }

    public String uploadAvatar(String email, MultipartFile file) {
        User user  = getByEmail(email);
        String url = fileStorageService.store(file, "avatars");
        user.setAvatar(url);
        user.setProfileCompletion(calculateProfileCompletion(user));
        userRepository.save(user);
        return url;
    }

    // ── Admin operations ───────────────────────────────────────────────────────

    public void deleteUser(String id) {
        User user = getById(id);
        userRepository.delete(user);
        log.info("User hard-deleted: {}", id);
    }

    // ── Stats ──────────────────────────────────────────────────────────────────

    public java.util.Map<String, Object> getUserStats(String userId) {
        long total = applicationRepository.countByUserId(userId);
        var accepted = applicationRepository.findByUserIdAndStatus(
                userId, com.scholarship.platform.model.enums.ApplicationStatus.ACCEPTED).size();
        var submitted = applicationRepository.findByUserIdAndStatus(
                userId, com.scholarship.platform.model.enums.ApplicationStatus.SUBMITTED).size();
        var underReview = applicationRepository.findByUserIdAndStatus(
                userId, com.scholarship.platform.model.enums.ApplicationStatus.UNDER_REVIEW).size();
        var rejected = applicationRepository.findByUserIdAndStatus(
                userId, com.scholarship.platform.model.enums.ApplicationStatus.REJECTED).size();
        return java.util.Map.of(
                "totalApplications", total,
                "acceptedApplications", accepted,
                "submittedApplications", submitted,
                "underReviewApplications", underReview,
                "rejectedApplications", rejected,
                "shortlistedApplications", 0,
                "successRate", total > 0 ? (accepted * 100.0 / total) : 0.0
        );
    }

    // ── Profile completion ─────────────────────────────────────────────────────

    /**
     * Calculates a profile-completion percentage (0–100) based on filled fields.
     */
    public int calculateProfileCompletion(User user) {
        int score = 0;

        if (user.getFullName() != null && !user.getFullName().isBlank()) {
            score += Constants.PC_BASIC_INFO;
        }
        if (user.getAvatar() != null) {
            score += Constants.PC_AVATAR;
        }
        if (user.isVerified()) {
            score += Constants.PC_VERIFIED;
        }
        if (user.getEducation() != null && user.getEducation().getFieldOfStudy() != null) {
            score += Constants.PC_EDUCATION;
        }
        if (user.getPreferences() != null &&
                !user.getPreferences().getTargetCountries().isEmpty()) {
            score += Constants.PC_PREFERENCES;
        }

        return Math.min(score, 100);
    }
}
