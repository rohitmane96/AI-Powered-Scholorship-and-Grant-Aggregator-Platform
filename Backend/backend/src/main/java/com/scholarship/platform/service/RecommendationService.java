package com.scholarship.platform.service;

import com.scholarship.platform.dto.response.ScholarshipResponse;
import com.scholarship.platform.model.Application;
import com.scholarship.platform.model.Scholarship;
import com.scholarship.platform.model.User;
import com.scholarship.platform.model.enums.ApplicationStatus;
import com.scholarship.platform.model.enums.FundingType;
import com.scholarship.platform.repository.ApplicationRepository;
import com.scholarship.platform.repository.ScholarshipRepository;
import com.scholarship.platform.util.Constants;
import com.scholarship.platform.util.DateUtil;
import com.scholarship.platform.util.TfIdfEngine;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.Locale;
import java.util.stream.Collectors;

/**
 * <h2>Hybrid AI Recommendation Engine</h2>
 *
 * <p>Combines three complementary signals into a single 0–100 score:</p>
 *
 * <pre>
 * finalScore = 0.45 × ruleScore        (eligibility & profile rules)
 *            + 0.40 × nlpScore         (TF-IDF cosine similarity)
 *            + 0.15 × popularityScore  (viewCount + applicationCount)
 *            → capped at 100
 * </pre>
 *
 * <h3>Component 1 – Rule-Based Eligibility Scorer (0–100)</h3>
 * <table border="1">
 *   <tr><th>Criterion</th><th>Points</th></tr>
 *   <tr><td>Country match</td><td>20</td></tr>
 *   <tr><td>Degree level</td><td>20</td></tr>
 *   <tr><td>Field of study (exact)</td><td>20</td></tr>
 *   <tr><td>Field of study (keyword)</td><td>10</td></tr>
 *   <tr><td>GPA ≥ 3.5 / 3.0 / 2.5</td><td>15 / 10 / 5</td></tr>
 *   <tr><td>Funding type preference</td><td>15</td></tr>
 *   <tr><td>Tag match</td><td>5</td></tr>
 *   <tr><td>Deadline urgency (≤ 30 days)</td><td>5</td></tr>
 *   <tr><td>History boost</td><td>10</td></tr>
 * </table>
 *
 * <h3>Component 2 – NLP / TF-IDF Cosine Similarity (0–100)</h3>
 * <p>User profile text (field, degree, countries, funding preference) is vectorised
 * using TF-IDF and compared against the scholarship's full text (name, description,
 * eligibility, tags) via cosine similarity. IDF is computed over the entire candidate
 * pool, giving rare but discriminative terms higher weight.</p>
 *
 * <h3>Component 3 – Popularity Score (0–100)</h3>
 * <p>Based on {@code viewCount + 2×applicationCount}, normalised to [0, 100]
 * relative to the maximum in the candidate pool. Captures crowd wisdom —
 * widely-viewed and frequently-applied-to scholarships tend to be high quality.</p>
 *
 * <p>Scholarships the user has already applied to are excluded. Each response
 * includes a {@code scoreBreakdown} map explaining every contributing signal.</p>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RecommendationService {

    private static final Map<String, String> COUNTRY_ALIASES = Map.ofEntries(
            Map.entry("usa", "us"),
            Map.entry("u.s.a", "us"),
            Map.entry("u.s.", "us"),
            Map.entry("united states", "us"),
            Map.entry("united states of america", "us"),
            Map.entry("america", "us"),
            Map.entry("uk", "uk"),
            Map.entry("u.k.", "uk"),
            Map.entry("united kingdom", "uk"),
            Map.entry("britain", "uk"),
            Map.entry("great britain", "uk"),
            Map.entry("england", "uk"),
            Map.entry("india", "india")
    );

    private static final Map<String, String> FIELD_ALIASES = Map.ofEntries(
            Map.entry("cs", "computer science"),
            Map.entry("cse", "computer science"),
            Map.entry("it", "information technology"),
            Map.entry("ai", "artificial intelligence"),
            Map.entry("ml", "machine learning"),
            Map.entry("ece", "electronics and communication engineering"),
            Map.entry("eee", "electrical and electronics engineering"),
            Map.entry("mech", "mechanical engineering"),
            Map.entry("civil", "civil engineering"),
            Map.entry("entc", "electronics and telecommunication engineering")
    );

    private final ScholarshipRepository  scholarshipRepository;
    private final ApplicationRepository  applicationRepository;
    private final ScholarshipService     scholarshipService;
    private final TfIdfEngine            tfidfEngine;
    private final PythonRecommendationClient pythonRecommendationClient;

    // ── Public API ─────────────────────────────────────────────────────────────

    /**
     * Returns the top {@code limit} personalised scholarship recommendations
     * sorted by descending hybrid match score.
     *
     * <p>The response includes a {@code scoreBreakdown} map with individual
     * signal scores so the UI can explain why a scholarship ranked.</p>
     *
     * @param user  authenticated student user
     * @param limit maximum recommendations to return
     */
    public List<ScholarshipResponse> getRecommendations(User user, int limit) {

        // ── 1. Application history ────────────────────────────────────────────
        List<Application> userApps = applicationRepository.findByUserId(user.getId());

        Set<String> appliedIds = userApps.stream()
                .map(Application::getScholarshipId)
                .collect(Collectors.toSet());

        Set<String> acceptedIds = userApps.stream()
                .filter(a -> a.getStatus() == ApplicationStatus.ACCEPTED ||
                             a.getStatus() == ApplicationStatus.UNDER_REVIEW)
                .map(Application::getScholarshipId)
                .collect(Collectors.toSet());

        List<Scholarship> acceptedScholarships = acceptedIds.isEmpty()
                ? Collections.emptyList()
                : scholarshipRepository.findAllById(acceptedIds);

        // ── 2. Candidate pool (up to 300, sorted by deadline) ────────────────
        Pageable pageable = PageRequest.of(0, 300, Sort.by("deadline").ascending());
        List<Scholarship> candidates = scholarshipRepository
                .findByDeadlineAfterAndDeletedFalseAndActiveTrue(LocalDateTime.now(), pageable)
                .getContent();

        log.debug("Hybrid engine: {} candidates, {} applied, {} accepted/reviewed",
                candidates.size(), appliedIds.size(), acceptedIds.size());

        List<Scholarship> filteredCandidates = candidates.stream()
                .filter(s -> !appliedIds.contains(s.getId()))
                .toList();

        Optional<List<ScholarshipResponse>> pythonResults = getPythonRecommendations(
                user, filteredCandidates, acceptedScholarships, limit);
        if (pythonResults.isPresent()) {
            return pythonResults.get();
        }

        // ── 3. Pre-compute corpus for TF-IDF (IDF over full pool) ────────────
        List<String> corpus = candidates.stream()
                .map(this::buildScholarshipText)
                .collect(Collectors.toList());

        String userText = buildUserText(user);

        // ── 4. Popularity normalisation constant ─────────────────────────────
        double maxPopularity = candidates.stream()
                .mapToDouble(s -> s.getViewCount() + 2.0 * s.getApplicationCount())
                .max().orElse(1.0);

        // ── 5. Score → filter → sort → cap ───────────────────────────────────
        return filteredCandidates.stream()
                .map(s -> hybridScore(user, s, acceptedScholarships,
                                      userText, corpus, maxPopularity))
                .filter(r -> r.getMatchScore() != null && r.getMatchScore() > 0)
                .sorted(Comparator.comparingInt(ScholarshipResponse::getMatchScore).reversed())
                .limit(limit)
                .collect(Collectors.toList());
    }

    private Optional<List<ScholarshipResponse>> getPythonRecommendations(
            User user,
            List<Scholarship> filteredCandidates,
            List<Scholarship> acceptedScholarships,
            int limit) {

        return pythonRecommendationClient
                .getRecommendations(user, filteredCandidates, acceptedScholarships, limit)
                .map(results -> {
                    Map<String, Scholarship> scholarshipMap = filteredCandidates.stream()
                            .collect(Collectors.toMap(Scholarship::getId, s -> s));

                    return results.stream()
                            .map(result -> {
                                Scholarship scholarship = scholarshipMap.get(result.getScholarshipId());
                                if (scholarship == null) {
                                    return null;
                                }
                                ScholarshipResponse response = scholarshipService
                                        .toResponse(scholarship, result.getScore());
                                response.setScoreBreakdown(result.getScoreBreakdown());
                                return response;
                            })
                            .filter(Objects::nonNull)
                            .filter(response -> response.getMatchScore() != null && response.getMatchScore() > 0)
                            .toList();
                })
                .filter(results -> !results.isEmpty());
    }

    /**
     * Rule-based eligibility score (0–100) used at application-submission time.
     * This deliberately uses only the deterministic rule component so the stored
     * score reflects profile-eligibility, not transient popularity.
     *
     * @param user        student
     * @param scholarship scholarship to evaluate
     * @return integer in [0, 100]
     */
    public int calculateScore(User user, Scholarship scholarship) {
        return Math.min(
                buildRuleBreakdown(user, scholarship, Collections.emptyList())
                        .values().stream().mapToInt(Integer::intValue).sum(),
                Constants.MATCH_MAX_SCORE);
    }

    // ── Hybrid scoring ─────────────────────────────────────────────────────────

    /**
     * Computes the full hybrid score for one scholarship and attaches a
     * detailed breakdown to the response.
     */
    private ScholarshipResponse hybridScore(User user, Scholarship scholarship,
                                             List<Scholarship> acceptedScholarships,
                                             String userText, List<String> corpus,
                                             double maxPopularity) {

        // ── Component 1: Rule-based (0–100) ──────────────────────────────────
        Map<String, Integer> rules = buildRuleBreakdown(user, scholarship, acceptedScholarships);
        int ruleScore = Math.min(
                rules.values().stream().mapToInt(Integer::intValue).sum(),
                Constants.MATCH_MAX_SCORE);

        // ── Component 2: NLP TF-IDF cosine similarity (0–100) ────────────────
        String schText = buildScholarshipText(scholarship);
        double cosine  = tfidfEngine.similarity(userText, schText, corpus);
        int nlpScore   = (int) Math.round(cosine * 100);

        // ── Component 3: Popularity (0–100) ──────────────────────────────────
        double popRaw       = scholarship.getViewCount() + 2.0 * scholarship.getApplicationCount();
        int popularityScore = maxPopularity > 0
                ? (int) Math.round((popRaw / maxPopularity) * 100)
                : 0;

        // ── Weighted ensemble ─────────────────────────────────────────────────
        int finalScore = (int) Math.round(
                Constants.REC_WEIGHT_RULES      * ruleScore     +
                Constants.REC_WEIGHT_NLP        * nlpScore      +
                Constants.REC_WEIGHT_POPULARITY * popularityScore);
        finalScore = Math.min(finalScore, Constants.MATCH_MAX_SCORE);

        // Preserve strong rule-based fit when the text corpus is sparse
        // and popularity is unavailable for newly ingested scholarships.
        if (ruleScore >= 70 && popularityScore == 0) {
            finalScore = Math.max(finalScore, ruleScore);
        } else if (ruleScore >= 60 && nlpScore < 35 && popularityScore == 0) {
            finalScore = Math.max(finalScore, Math.min(85, (int) Math.round(ruleScore * 0.85)));
        }

        // ── Full breakdown for UI explainability ──────────────────────────────
        Map<String, Integer> breakdown = new LinkedHashMap<>(rules);
        breakdown.put("nlpSimilarity",   nlpScore);
        breakdown.put("popularityScore", popularityScore);

        ScholarshipResponse response = scholarshipService.toResponse(scholarship, finalScore);
        response.setScoreBreakdown(breakdown);
        return response;
    }

    // ── Rule-based eligibility scorer ──────────────────────────────────────────

    /**
     * Builds per-criterion rule scores for a user–scholarship pair.
     * Returns only non-zero entries. This is the explainable/deterministic
     * component of the hybrid engine.
     */
    private Map<String, Integer> buildRuleBreakdown(User user, Scholarship scholarship,
                                                     List<Scholarship> acceptedScholarships) {
        Map<String, Integer> breakdown = new LinkedHashMap<>();

        // 1. Country match (20 pts)
        if (user.getPreferences() != null
                && !user.getPreferences().getTargetCountries().isEmpty()
                && user.getPreferences().getTargetCountries().stream()
                .filter(Objects::nonNull)
                .map(this::normalizeCountry)
                .anyMatch(country -> country.equals(normalizeCountry(scholarship.getCountry())))) {
            breakdown.put("country", Constants.MATCH_COUNTRY);
        }

        // 2. Degree level (20 pts)
        if (user.getEducation() != null && user.getEducation().getLevel() != null) {
            if (scholarship.getDegreeLevel() == null
                    || "ANY".equalsIgnoreCase(scholarship.getDegreeLevel().name())
                    || scholarship.getDegreeLevel() == user.getEducation().getLevel()) {
                breakdown.put("degreeLevel", Constants.MATCH_DEGREE);
            }
        }

        // 3. Field of study – exact (20 pts) or partial keyword (10 pts)
        Set<String> userFields = collectUserFields(user);
        if (!userFields.isEmpty() && scholarship.getFieldOfStudy() != null) {
            String schField = normalizeField(scholarship.getFieldOfStudy());

            if ("any".equals(schField) || userFields.contains(schField)) {
                breakdown.put("fieldOfStudy", Constants.MATCH_FIELD_EXACT);
            } else if (userFields.stream().anyMatch(userField ->
                    schField.contains(userField)
                    || userField.contains(schField)
                    || keywordOverlap(userField, schField))) {
                breakdown.put("fieldOfStudy", Constants.MATCH_FIELD_PARTIAL);
            }
        }

        // 4. GPA – graduated tiers
        if (user.getEducation() != null && user.getEducation().getCurrentGPA() != null) {
            double gpa = user.getEducation().getCurrentGPA();
            if      (gpa >= 3.5) breakdown.put("gpa", Constants.MATCH_GPA_HIGH);
            else if (gpa >= 3.0) breakdown.put("gpa", Constants.MATCH_GPA_MID);
            else if (gpa >= 2.5) breakdown.put("gpa", Constants.MATCH_GPA_LOW);
        }

        // 5. Funding type preference (15 pts)
        if (user.getPreferences() != null
                && !user.getPreferences().getFundingTypes().isEmpty()
                && user.getPreferences().getFundingTypes().contains(scholarship.getFundingType())) {
            breakdown.put("fundingType", Constants.MATCH_FUNDING);
        }

        // 6. Tag match (5 pts) – any scholarship tag relates to user's field
        if (user.getEducation() != null
                && user.getEducation().getFieldOfStudy() != null
                && scholarship.getTags() != null
                && !scholarship.getTags().isEmpty()) {

            boolean tagHit = scholarship.getTags().stream()
                    .filter(Objects::nonNull)
                    .map(this::normalizeField)
                    .anyMatch(tag -> collectUserFields(user).stream().anyMatch(userField ->
                            tag.contains(userField) || userField.contains(tag)));
            if (tagHit) breakdown.put("tagMatch", Constants.MATCH_TAG);
        }

        // 7. Deadline urgency (5 pts) – deadline within 30 days
        if (scholarship.getDeadline() != null
                && DateUtil.isDeadlineWithin(scholarship.getDeadline(), 30)
                && DateUtil.daysUntil(scholarship.getDeadline()) > 0) {
            breakdown.put("deadlineUrgency", Constants.MATCH_DEADLINE_URGENCY);
        }

        // 8. Application history boost (10 pts)
        if (!acceptedScholarships.isEmpty()) {
            boolean historyMatch = acceptedScholarships.stream().anyMatch(prev ->
                    Objects.equals(prev.getCountry(), scholarship.getCountry()) ||
                    fieldRelated(prev.getFieldOfStudy(), scholarship.getFieldOfStudy()));
            if (historyMatch) breakdown.put("historyBoost", Constants.MATCH_HISTORY_BOOST);
        }

        return breakdown;
    }

    // ── Text builders for NLP ──────────────────────────────────────────────────

    /**
     * Builds a rich text representation of a scholarship for TF-IDF vectorisation.
     * Concatenates name, description, field, country, degree, tags, and eligibility.
     */
    private String buildScholarshipText(Scholarship s) {
        List<String> parts = new ArrayList<>();
        if (s.getName()        != null) parts.add(s.getName());
        if (s.getDescription() != null) parts.add(s.getDescription());
        if (s.getFieldOfStudy()!= null) parts.add(s.getFieldOfStudy());
        if (s.getCountry()     != null) parts.add(s.getCountry());
        if (s.getProvider()    != null) parts.add(s.getProvider());
        if (s.getDegreeLevel() != null) parts.add(s.getDegreeLevel().name().replace('_', ' '));
        if (s.getFundingType() != null) parts.add(s.getFundingType().name().replace('_', ' '));
        if (s.getTags()        != null) parts.addAll(s.getTags());
        if (s.getEligibility() != null) parts.addAll(s.getEligibility());
        return String.join(" ", parts);
    }

    /**
     * Builds a text representation of the user's academic profile for TF-IDF.
     * Reflects field of study, degree level, target countries, and funding preferences.
     */
    private String buildUserText(User user) {
        List<String> parts = new ArrayList<>();
        if (user.getEducation() != null) {
            if (user.getEducation().getFieldOfStudy() != null)
                parts.add(normalizeField(user.getEducation().getFieldOfStudy()));
            if (user.getEducation().getLevel() != null)
                parts.add(user.getEducation().getLevel().name().replace('_', ' '));
        }
        if (user.getPreferences() != null) {
            user.getPreferences().getTargetCountries().stream()
                    .filter(Objects::nonNull)
                    .map(this::normalizeCountry)
                    .forEach(parts::add);
            user.getPreferences().getFundingTypes().stream()
                    .map(FundingType::name)
                    .map(n -> n.replace('_', ' '))
                    .forEach(parts::add);
            user.getPreferences().getFieldsOfStudy().stream()
                    .filter(Objects::nonNull)
                    .map(this::normalizeField)
                    .forEach(parts::add);
        }
        return String.join(" ", parts);
    }

    // ── Keyword helpers ────────────────────────────────────────────────────────

    /**
     * Returns {@code true} when two field-of-study strings share at least one
     * significant keyword (length > 3, excluding common stop words).
     */
    private boolean keywordOverlap(String a, String b) {
        Set<String> stopWords = Set.of("and", "the", "of", "in", "for", "with", "studies");
        Set<String> wordsA = Arrays.stream(a.split("\\s+"))
                .filter(w -> w.length() > 3 && !stopWords.contains(w))
                .collect(Collectors.toSet());
        Set<String> wordsB = Arrays.stream(b.split("\\s+"))
                .filter(w -> w.length() > 3 && !stopWords.contains(w))
                .collect(Collectors.toSet());
        return wordsA.stream().anyMatch(wordsB::contains);
    }

    /**
     * Returns {@code true} if two field-of-study values are semantically related.
     */
    private boolean fieldRelated(String a, String b) {
        if (a == null || b == null) return false;
        String la = normalizeField(a), lb = normalizeField(b);
        return la.equals(lb) || la.contains(lb) || lb.contains(la) || keywordOverlap(la, lb);
    }

    private Set<String> collectUserFields(User user) {
        Set<String> fields = new LinkedHashSet<>();
        if (user.getEducation() != null && user.getEducation().getFieldOfStudy() != null) {
            fields.add(normalizeField(user.getEducation().getFieldOfStudy()));
        }
        if (user.getPreferences() != null && user.getPreferences().getFieldsOfStudy() != null) {
            user.getPreferences().getFieldsOfStudy().stream()
                    .filter(Objects::nonNull)
                    .map(this::normalizeField)
                    .forEach(fields::add);
        }
        fields.removeIf(String::isBlank);
        return fields;
    }

    private String normalizeCountry(String value) {
        if (value == null) {
            return "";
        }
        String normalized = value.trim().toLowerCase(Locale.ROOT).replaceAll("[^a-z\\s]", " ");
        normalized = normalized.replaceAll("\\s+", " ").trim();
        return COUNTRY_ALIASES.getOrDefault(normalized, normalized);
    }

    private String normalizeField(String value) {
        if (value == null) {
            return "";
        }
        String normalized = value.trim().toLowerCase(Locale.ROOT).replace('&', ' ');
        normalized = normalized.replaceAll("[^a-z\\s]", " ");
        normalized = normalized.replaceAll("\\s+", " ").trim();
        String aliasExpanded = Arrays.stream(normalized.split("\\s+"))
                .map(token -> FIELD_ALIASES.getOrDefault(token, token))
                .collect(Collectors.joining(" "))
                .trim();
        return aliasExpanded.isBlank() ? normalized : aliasExpanded;
    }
}
