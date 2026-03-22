package com.scholarship.platform.service;

import com.scholarship.platform.dto.request.ScholarshipRequest;
import com.scholarship.platform.dto.response.ScholarshipResponse;
import com.scholarship.platform.exception.ResourceNotFoundException;
import com.scholarship.platform.exception.UnauthorizedException;
import com.scholarship.platform.model.Scholarship;
import com.scholarship.platform.model.User;
import com.scholarship.platform.model.enums.DegreeLevel;
import com.scholarship.platform.model.enums.FundingType;
import com.scholarship.platform.model.enums.UserRole;
import com.scholarship.platform.repository.ScholarshipRepository;
import com.scholarship.platform.util.DateUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.modelmapper.ModelMapper;
import org.springframework.cache.annotation.*;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Core business logic for scholarship CRUD, search, and recommendations.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ScholarshipService {

    private final ScholarshipRepository scholarshipRepository;
    private final ModelMapper            modelMapper;

    // ── CRUD ───────────────────────────────────────────────────────────────────

    public ScholarshipResponse create(ScholarshipRequest request, User creator) {
        Scholarship scholarship = modelMapper.map(request, Scholarship.class);
        scholarship.setCreatedBy(creator.getId());

        Scholarship saved = scholarshipRepository.save(scholarship);
        log.info("Scholarship created: {} by {}", saved.getName(), creator.getEmail());
        return toResponse(saved, null);
    }

    public ScholarshipResponse getById(String id) {
        Scholarship s = findOrThrow(id);
        s.setViewCount(s.getViewCount() + 1);
        scholarshipRepository.save(s);
        return toResponse(s, null);
    }

    public Page<ScholarshipResponse> listAll(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return scholarshipRepository.findByDeletedFalseAndActiveTrue(pageable)
                                    .map(s -> toResponse(s, null));
    }

    public Page<ScholarshipResponse> listFiltered(
            String country, DegreeLevel degreeLevel, FundingType fundingType,
            String fieldOfStudy, int page, int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("deadline").ascending());

        // Simple single-filter routing — in production use Criteria/QueryDSL
        if (country != null && !country.isBlank()) {
            return scholarshipRepository
                    .findByCountryIgnoreCaseAndDeletedFalseAndActiveTrue(country, pageable)
                    .map(s -> toResponse(s, null));
        }
        if (degreeLevel != null) {
            return scholarshipRepository
                    .findByDegreeLevelAndDeletedFalseAndActiveTrue(degreeLevel, pageable)
                    .map(s -> toResponse(s, null));
        }
        if (fundingType != null) {
            return scholarshipRepository
                    .findByFundingTypeAndDeletedFalseAndActiveTrue(fundingType, pageable)
                    .map(s -> toResponse(s, null));
        }
        return listAll(page, size);
    }

    public ScholarshipResponse update(String id, ScholarshipRequest request, User actor) {
        Scholarship existing = findOrThrow(id);
        ensureOwnerOrAdmin(existing, actor);

        modelMapper.map(request, existing);
        Scholarship saved = scholarshipRepository.save(existing);
        log.info("Scholarship updated: {}", id);
        return toResponse(saved, null);
    }

    public void delete(String id, User actor) {
        Scholarship existing = findOrThrow(id);
        ensureOwnerOrAdmin(existing, actor);

        existing.setDeleted(true);
        scholarshipRepository.save(existing);
        log.info("Scholarship soft-deleted: {}", id);
    }

    // ── Search ─────────────────────────────────────────────────────────────────

    public Page<ScholarshipResponse> search(String query, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return scholarshipRepository.searchByText(query, pageable)
                                    .map(s -> toResponse(s, null));
    }

    // ── Featured ───────────────────────────────────────────────────────────────

    @Cacheable("featured_scholarships")
    public List<ScholarshipResponse> getFeatured() {
        return scholarshipRepository.findByFeaturedTrueAndDeletedFalseAndActiveTrue()
                .stream()
                .map(s -> toResponse(s, null))
                .collect(Collectors.toList());
    }

    @CacheEvict(value = "featured_scholarships", allEntries = true)
    public void evictFeaturedCache() {
        log.debug("Featured scholarships cache evicted");
    }

    // ── Similar ────────────────────────────────────────────────────────────────

    public List<ScholarshipResponse> getSimilar(String id, int limit) {
        Scholarship ref = findOrThrow(id);
        return scholarshipRepository.findMatchCandidates(
                        ref.getCountry(), ref.getDegreeLevel(), ref.getFieldOfStudy())
                .stream()
                .filter(s -> !s.getId().equals(id))
                .limit(limit)
                .map(s -> toResponse(s, null))
                .collect(Collectors.toList());
    }

    // ── Institution-scoped listing ─────────────────────────────────────────────

    public Page<ScholarshipResponse> listByCreator(String creatorId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return scholarshipRepository.findByCreatedByAndDeletedFalse(creatorId, pageable)
                                    .map(s -> toResponse(s, null));
    }

    // ── Helper ─────────────────────────────────────────────────────────────────

    public Scholarship findOrThrow(String id) {
        return scholarshipRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new ResourceNotFoundException("Scholarship", "id", id));
    }

    public ScholarshipResponse toResponse(Scholarship s, Integer matchScore) {
        ScholarshipResponse r = modelMapper.map(s, ScholarshipResponse.class);
        r.setDaysUntilDeadline(s.getDeadline() != null ? DateUtil.daysUntil(s.getDeadline()) : 0);
        r.setMatchScore(matchScore);
        return r;
    }

    private void ensureOwnerOrAdmin(Scholarship s, User actor) {
        if (actor.getRole() != UserRole.ADMIN &&
                !s.getCreatedBy().equals(actor.getId())) {
            throw new UnauthorizedException("You are not allowed to modify this scholarship.");
        }
    }
}
