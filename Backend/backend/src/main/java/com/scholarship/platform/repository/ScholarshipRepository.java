package com.scholarship.platform.repository;

import com.scholarship.platform.model.Scholarship;
import com.scholarship.platform.model.enums.DegreeLevel;
import com.scholarship.platform.model.enums.FundingType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ScholarshipRepository extends MongoRepository<Scholarship, String> {

    Optional<Scholarship> findByIdAndDeletedFalse(String id);

    Page<Scholarship> findByDeletedFalseAndActiveTrue(Pageable pageable);

    Page<Scholarship> findByDeletedFalse(Pageable pageable);

    // ── Filtered queries ───────────────────────────────────────────────────────

    Page<Scholarship> findByCountryIgnoreCaseAndDeletedFalseAndActiveTrue(
            String country, Pageable pageable);

    Page<Scholarship> findByDegreeLevelAndDeletedFalseAndActiveTrue(
            DegreeLevel level, Pageable pageable);

    Page<Scholarship> findByFundingTypeAndDeletedFalseAndActiveTrue(
            FundingType type, Pageable pageable);

    @Query("{ 'deadline': { $gte: ?0 }, 'deleted': false, 'active': true }")
    Page<Scholarship> findByDeadlineAfterAndDeletedFalseAndActiveTrue(
            LocalDateTime now, Pageable pageable);

    // ── Featured / deadline window ─────────────────────────────────────────────

    List<Scholarship> findByFeaturedTrueAndDeletedFalseAndActiveTrue();

    @Query("{ 'deadline': { $gte: ?0, $lte: ?1 }, 'deleted': false, 'active': true }")
    List<Scholarship> findByDeadlineBetween(LocalDateTime start, LocalDateTime end);

    // ── Text search (requires MongoDB text index) ──────────────────────────────

    @Query("{ $text: { $search: ?0 }, 'deleted': false, 'active': true }")
    Page<Scholarship> searchByText(String query, Pageable pageable);

    // ── Recommendation candidates ──────────────────────────────────────────────

    @Query("{ 'country': ?0, 'degreeLevel': ?1, 'fieldOfStudy': ?2, 'deleted': false, 'active': true }")
    List<Scholarship> findMatchCandidates(String country, DegreeLevel level, String field);

    // ── Institution queries ────────────────────────────────────────────────────

    Page<Scholarship> findByCreatedByAndDeletedFalse(String createdBy, Pageable pageable);

    // ── Stats ──────────────────────────────────────────────────────────────────

    long countByDeletedFalseAndActiveTrue();

    long countByCreatedByAndDeletedFalse(String createdBy);
}
