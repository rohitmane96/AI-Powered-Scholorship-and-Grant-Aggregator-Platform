package com.scholarship.platform.service;

import com.scholarship.platform.dto.response.ScholarshipResponse;
import com.scholarship.platform.model.enums.DegreeLevel;
import com.scholarship.platform.model.enums.FundingType;
import com.scholarship.platform.repository.ScholarshipRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Delegates to the scholarship repository for full-text and faceted search.
 * Results are cached where appropriate.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SearchService {

    private final ScholarshipService scholarshipService;

    @Cacheable(value = "search_results", key = "#query + '_' + #page + '_' + #size")
    public Page<ScholarshipResponse> fullTextSearch(String query, int page, int size) {
        log.debug("Full-text search: query='{}' page={} size={}", query, page, size);
        return scholarshipService.search(query, page, size);
    }

    public Page<ScholarshipResponse> filteredSearch(
            String country, DegreeLevel degreeLevel,
            FundingType fundingType, String fieldOfStudy,
            int page, int size) {

        return scholarshipService.listFiltered(
                country, degreeLevel, fundingType, fieldOfStudy, page, size);
    }
}
