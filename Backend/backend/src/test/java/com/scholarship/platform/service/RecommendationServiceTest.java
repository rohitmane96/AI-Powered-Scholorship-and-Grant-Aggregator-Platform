package com.scholarship.platform.service;

import com.scholarship.platform.dto.response.ScholarshipResponse;
import com.scholarship.platform.model.Application;
import com.scholarship.platform.model.Scholarship;
import com.scholarship.platform.model.User;
import com.scholarship.platform.model.enums.*;
import com.scholarship.platform.repository.ApplicationRepository;
import com.scholarship.platform.repository.ScholarshipRepository;
import com.scholarship.platform.util.TfIdfEngine;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for the Hybrid Recommendation Engine.
 *
 * <p>{@link TfIdfEngine} is used as a real {@code @Spy} (pure computation, no deps).
 * All repository / service collaborators are mocked.</p>
 *
 * <p>Note: {@code calculateScore()} uses only the rule-based component for
 * deterministic, reproducible scores at application-submission time.</p>
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("RecommendationService – Hybrid AI Engine")
class RecommendationServiceTest {

    @Mock  ScholarshipRepository scholarshipRepository;
    @Mock  ApplicationRepository applicationRepository;
    @Mock  ScholarshipService    scholarshipService;
    @Mock  PythonRecommendationClient pythonRecommendationClient;
    @Spy   TfIdfEngine           tfidfEngine = new TfIdfEngine();

    @InjectMocks RecommendationService recommendationService;

    // ── Builders ──────────────────────────────────────────────────────────────

    private User buildUser(String country, DegreeLevel level,
                           String field, double gpa, FundingType fundingType) {
        return User.builder()
                .id("u1")
                .education(User.Education.builder()
                        .level(level).fieldOfStudy(field).currentGPA(gpa).build())
                .preferences(User.Preferences.builder()
                        .targetCountries(List.of(country))
                        .fundingTypes(List.of(fundingType))
                        .build())
                .build();
    }

    private Scholarship buildScholarship(String country, DegreeLevel level,
                                         String field, FundingType fundingType) {
        return Scholarship.builder()
                .id("s1").name("Test Scholarship")
                .country(country).degreeLevel(level)
                .fieldOfStudy(field).fundingType(fundingType)
                .deadline(LocalDateTime.now().plusMonths(3))
                .active(true).deleted(false).build();
    }

    // ── calculateScore (rule-based component only) ────────────────────────────

    @Test
    @DisplayName("Perfect rule match: country+degree+field+gpaHigh+funding = 90")
    void calculateScore_perfectMatch() {
        User user = buildUser("US", DegreeLevel.UNDERGRADUATE, "CS", 3.8, FundingType.FULL_FUNDING);
        Scholarship sch = buildScholarship("US", DegreeLevel.UNDERGRADUATE, "CS", FundingType.FULL_FUNDING);

        // country(20)+degree(20)+fieldExact(20)+gpaHigh(15)+funding(15) = 90
        assertThat(recommendationService.calculateScore(user, sch)).isEqualTo(90);
    }

    @Test
    @DisplayName("No rule match: all mismatches + GPA < 2.5 = 0")
    void calculateScore_noMatch() {
        User user = buildUser("IN", DegreeLevel.PHD, "Biology", 2.0, FundingType.LOAN);
        Scholarship sch = buildScholarship("US", DegreeLevel.UNDERGRADUATE, "CS", FundingType.FULL_FUNDING);

        assertThat(recommendationService.calculateScore(user, sch)).isEqualTo(0);
    }

    @Test
    @DisplayName("Partial rule match: country+degree+gpaHigh = 55 (field+funding mismatch)")
    void calculateScore_partialMatch() {
        User user = buildUser("US", DegreeLevel.UNDERGRADUATE, "Biology", 3.5, FundingType.LOAN);
        Scholarship sch = buildScholarship("US", DegreeLevel.UNDERGRADUATE, "CS", FundingType.FULL_FUNDING);

        // country(20)+degree(20)+gpaHigh(15) = 55
        assertThat(recommendationService.calculateScore(user, sch)).isEqualTo(55);
    }

    @Test
    @DisplayName("GPA tiers: high=15, mid=10, low=5, below=0")
    void calculateScore_gpaTiers() {
        Scholarship sch = buildScholarship("XX", DegreeLevel.UNDERGRADUATE, "Math", FundingType.LOAN);

        User highGpa = buildUser("XX", DegreeLevel.UNDERGRADUATE, "Math", 3.7, FundingType.LOAN);
        User midGpa  = buildUser("XX", DegreeLevel.UNDERGRADUATE, "Math", 3.2, FundingType.LOAN);
        User lowGpa  = buildUser("XX", DegreeLevel.UNDERGRADUATE, "Math", 2.6, FundingType.LOAN);
        User tooLow  = buildUser("XX", DegreeLevel.UNDERGRADUATE, "Math", 2.0, FundingType.LOAN);

        // country(20)+degree(20)+fieldExact(20)+funding(15) = 75 base; +gpa
        assertThat(recommendationService.calculateScore(highGpa, sch)).isEqualTo(90); // +15
        assertThat(recommendationService.calculateScore(midGpa,  sch)).isEqualTo(85); // +10
        assertThat(recommendationService.calculateScore(lowGpa,  sch)).isEqualTo(80); // +5
        assertThat(recommendationService.calculateScore(tooLow,  sch)).isEqualTo(75); // +0
    }

    @Test
    @DisplayName("Partial field keyword overlap scores 10 (not 20)")
    void calculateScore_partialFieldKeyword() {
        // "computer science" vs "computer engineering" → shares keyword "computer"
        User user = buildUser("US", DegreeLevel.POSTGRADUATE, "computer science", 3.0, FundingType.PARTIAL_FUNDING);
        Scholarship sch = buildScholarship("US", DegreeLevel.POSTGRADUATE, "computer engineering", FundingType.PARTIAL_FUNDING);

        // country(20)+degree(20)+fieldPartial(10)+gpaMid(10)+funding(15) = 75
        assertThat(recommendationService.calculateScore(user, sch)).isEqualTo(75);
    }

    @Test
    @DisplayName("Country aliases match: USA user preference matches US scholarship")
    void calculateScore_countryAliasMatch() {
        User user = buildUser("USA", DegreeLevel.UNDERGRADUATE, "CS", 3.6, FundingType.FULL_FUNDING);
        Scholarship sch = buildScholarship("US", DegreeLevel.UNDERGRADUATE, "CS", FundingType.FULL_FUNDING);

        assertThat(recommendationService.calculateScore(user, sch)).isEqualTo(90);
    }

    @Test
    @DisplayName("Field aliases match: cs preference matches computer science scholarship")
    void calculateScore_fieldAliasMatch() {
        User user = buildUser("US", DegreeLevel.UNDERGRADUATE, "cs", 3.6, FundingType.FULL_FUNDING);
        Scholarship sch = buildScholarship("US", DegreeLevel.UNDERGRADUATE, "computer science", FundingType.FULL_FUNDING);

        assertThat(recommendationService.calculateScore(user, sch)).isEqualTo(90);
    }

    @Test
    @DisplayName("Preference fields of study contribute to matching even when education field differs")
    void calculateScore_preferenceFieldsAreUsed() {
        User user = User.builder()
                .id("u1")
                .education(User.Education.builder()
                        .level(DegreeLevel.UNDERGRADUATE)
                        .fieldOfStudy("Electronics")
                        .currentGPA(3.7)
                        .build())
                .preferences(User.Preferences.builder()
                        .targetCountries(List.of("US"))
                        .fundingTypes(List.of(FundingType.FULL_FUNDING))
                        .fieldsOfStudy(List.of("computer science"))
                        .build())
                .build();

        Scholarship sch = buildScholarship("US", DegreeLevel.UNDERGRADUATE, "CS", FundingType.FULL_FUNDING);

        assertThat(recommendationService.calculateScore(user, sch)).isEqualTo(90);
    }

    @Test
    @DisplayName("Deadline urgency adds 5 pts when deadline within 30 days")
    void calculateScore_deadlineUrgency() {
        Scholarship urgent = Scholarship.builder()
                .id("s2").name("Urgent Scholarship")
                .country("IN").degreeLevel(DegreeLevel.UNDERGRADUATE)
                .fieldOfStudy("Engineering").fundingType(FundingType.RESEARCH_GRANT)
                .deadline(LocalDateTime.now().plusDays(15))
                .active(true).deleted(false).build();

        User user = buildUser("IN", DegreeLevel.UNDERGRADUATE, "Engineering", 3.6, FundingType.RESEARCH_GRANT);
        // country(20)+degree(20)+fieldExact(20)+gpaHigh(15)+funding(15)+urgency(5) = 95
        assertThat(recommendationService.calculateScore(user, urgent)).isEqualTo(95);
    }

    // ── NLP TF-IDF engine ─────────────────────────────────────────────────────

    @Test
    @DisplayName("TF-IDF similarity is higher for matching field than mismatching field")
    void tfidf_matchingFieldScoresHigher() {
        String userText = "computer science undergraduate full funding United States";
        String matchText  = "computer science scholarship undergraduate research United States";
        String noMatchText = "marine biology fellowship oceanography PhD Europe";
        List<String> corpus = List.of(matchText, noMatchText);

        double matchSim   = tfidfEngine.similarity(userText, matchText,   corpus);
        double noMatchSim = tfidfEngine.similarity(userText, noMatchText, corpus);

        assertThat(matchSim).isGreaterThan(noMatchSim);
        assertThat(matchSim).isGreaterThan(0.0);
        assertThat(noMatchSim).isGreaterThanOrEqualTo(0.0);
    }

    @Test
    @DisplayName("TF-IDF similarity is 0 when either text is blank")
    void tfidf_blankInputReturnsZero() {
        assertThat(tfidfEngine.similarity("", "some text", List.of())).isEqualTo(0.0);
        assertThat(tfidfEngine.similarity("some text", null, List.of())).isEqualTo(0.0);
    }

    // ── getRecommendations ────────────────────────────────────────────────────

    @Test
    @DisplayName("getRecommendations excludes already-applied scholarships")
    void getRecommendations_excludesApplied() {
        User user = buildUser("US", DegreeLevel.UNDERGRADUATE, "CS", 3.5, FundingType.FULL_FUNDING);

        Scholarship applied   = buildScholarship("US", DegreeLevel.UNDERGRADUATE, "CS", FundingType.FULL_FUNDING);
        applied.setId("applied-1");
        Scholarship available = buildScholarship("US", DegreeLevel.UNDERGRADUATE, "CS", FundingType.FULL_FUNDING);
        available.setId("available-1");

        Application app = Application.builder().scholarshipId("applied-1").build();

        when(applicationRepository.findByUserId("u1")).thenReturn(List.of(app));
        when(scholarshipRepository.findByDeadlineAfterAndDeletedFalseAndActiveTrue(
                any(LocalDateTime.class), any()))
                .thenReturn(new PageImpl<>(List.of(applied, available)));
        when(pythonRecommendationClient.getRecommendations(any(), anyList(), anyList(), anyInt()))
                .thenReturn(java.util.Optional.empty());
        when(scholarshipService.toResponse(eq(available), anyInt()))
                .thenReturn(ScholarshipResponse.builder().id("available-1").matchScore(70).build());

        List<ScholarshipResponse> results = recommendationService.getRecommendations(user, 10);

        assertThat(results).hasSize(1);
        assertThat(results.get(0).getId()).isEqualTo("available-1");
        verify(applicationRepository).findByUserId("u1");
    }

    @Test
    @DisplayName("getRecommendations returns empty list when no candidates")
    void getRecommendations_emptyCandidatePool() {
        User user = buildUser("US", DegreeLevel.UNDERGRADUATE, "CS", 3.5, FundingType.FULL_FUNDING);

        when(applicationRepository.findByUserId("u1")).thenReturn(Collections.emptyList());
        when(scholarshipRepository.findByDeadlineAfterAndDeletedFalseAndActiveTrue(
                any(LocalDateTime.class), any()))
                .thenReturn(new PageImpl<>(Collections.emptyList()));
        when(pythonRecommendationClient.getRecommendations(any(), anyList(), anyList(), anyInt()))
                .thenReturn(java.util.Optional.empty());

        assertThat(recommendationService.getRecommendations(user, 10)).isEmpty();
    }

    @Test
    @DisplayName("Strong rule matches retain useful recommendation scores when NLP and popularity are sparse")
    void getRecommendations_preservesStrongRuleBasedMatches() {
        User user = buildUser("USA", DegreeLevel.UNDERGRADUATE, "cs", 3.8, FundingType.FULL_FUNDING);

        Scholarship sch = Scholarship.builder()
                .id("s-strong")
                .name("US Merit Scholarship")
                .country("US")
                .degreeLevel(DegreeLevel.UNDERGRADUATE)
                .fieldOfStudy("computer science")
                .fundingType(FundingType.FULL_FUNDING)
                .deadline(LocalDateTime.now().plusMonths(2))
                .viewCount(0)
                .applicationCount(0)
                .active(true)
                .deleted(false)
                .build();

        when(applicationRepository.findByUserId("u1")).thenReturn(Collections.emptyList());
        when(scholarshipRepository.findByDeadlineAfterAndDeletedFalseAndActiveTrue(
                any(LocalDateTime.class), any()))
                .thenReturn(new PageImpl<>(List.of(sch)));
        when(pythonRecommendationClient.getRecommendations(any(), anyList(), anyList(), anyInt()))
                .thenReturn(java.util.Optional.empty());
        when(scholarshipService.toResponse(eq(sch), anyInt()))
                .thenAnswer(invocation -> ScholarshipResponse.builder()
                        .id("s-strong")
                        .matchScore(invocation.getArgument(1))
                        .build());

        List<ScholarshipResponse> results = recommendationService.getRecommendations(user, 10);

        assertThat(results).hasSize(1);
        assertThat(results.get(0).getMatchScore()).isGreaterThanOrEqualTo(75);
    }

    @Test
    @DisplayName("getRecommendations prefers Python recommender results when available")
    void getRecommendations_usesPythonServiceWhenAvailable() {
        User user = buildUser("US", DegreeLevel.UNDERGRADUATE, "CS", 3.8, FundingType.FULL_FUNDING);
        Scholarship sch = buildScholarship("US", DegreeLevel.UNDERGRADUATE, "computer science", FundingType.FULL_FUNDING);
        sch.setId("py-1");

        when(applicationRepository.findByUserId("u1")).thenReturn(Collections.emptyList());
        when(scholarshipRepository.findByDeadlineAfterAndDeletedFalseAndActiveTrue(
                any(LocalDateTime.class), any()))
                .thenReturn(new PageImpl<>(List.of(sch)));
        when(pythonRecommendationClient.getRecommendations(any(), anyList(), anyList(), anyInt()))
                .thenReturn(java.util.Optional.of(List.of(
                        new PythonRecommendationClient.PythonRecommendation(
                                "py-1", 88, java.util.Map.of("country", 20, "nlpSimilarity", 68)
                        ))));
        when(scholarshipService.toResponse(eq(sch), eq(88)))
                .thenReturn(ScholarshipResponse.builder().id("py-1").matchScore(88).build());

        List<ScholarshipResponse> results = recommendationService.getRecommendations(user, 5);

        assertThat(results).hasSize(1);
        assertThat(results.get(0).getId()).isEqualTo("py-1");
        assertThat(results.get(0).getMatchScore()).isEqualTo(88);
        assertThat(results.get(0).getScoreBreakdown()).containsEntry("country", 20);
    }
}
