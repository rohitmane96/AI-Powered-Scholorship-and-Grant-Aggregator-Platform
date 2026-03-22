package com.scholarship.platform.util;

import org.springframework.stereotype.Component;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Lightweight TF-IDF cosine-similarity engine for semantic text matching.
 *
 * <p>Used by the hybrid recommendation engine to measure how semantically
 * close a user's academic profile is to a scholarship's textual representation.</p>
 *
 * <h3>Algorithm</h3>
 * <ol>
 *   <li>Tokenise both texts (lowercase, alpha-only, stop-word filtered)</li>
 *   <li>Compute normalised Term Frequency (TF) per document</li>
 *   <li>Compute smoothed Inverse Document Frequency (IDF) over the corpus</li>
 *   <li>Return cosine similarity of the two TF-IDF weighted vectors</li>
 * </ol>
 *
 * <p>IDF formula: {@code log((N+1) / (df+1)) + 1}  (scikit-learn smooth variant)</p>
 */
@Component
public class TfIdfEngine {

    private static final Set<String> STOP_WORDS = Set.of(
            "a","an","the","and","or","but","in","on","at","to","for","of",
            "with","by","from","is","are","was","were","be","been","have","has",
            "had","do","does","did","will","would","could","should","may","might",
            "shall","can","need","must","that","this","these","those","it","its",
            "i","we","you","he","she","they","who","which","what","how","when",
            "where","why","not","no","nor","so","yet","both","either","neither",
            "each","few","more","most","other","some","such","than","too","very",
            "based","open","available","all","any","also","only","well","per"
    );

    // ── Public API ────────────────────────────────────────────────────────────

    /**
     * Computes cosine similarity [0.0, 1.0] between a user profile text and a
     * scholarship text, using IDF computed over the full candidate corpus.
     *
     * @param userText        user profile fields joined into one string
     * @param scholarshipText scholarship fields joined into one string
     * @param corpus          all scholarship texts in the candidate pool (for IDF)
     * @return similarity score in [0.0, 1.0]
     */
    public double similarity(String userText, String scholarshipText, List<String> corpus) {
        if (isBlank(userText) || isBlank(scholarshipText)) return 0.0;

        // Include user text in corpus so its terms get proper IDF weighting
        List<String> fullCorpus = new ArrayList<>(corpus);
        fullCorpus.add(userText);

        Map<String, Double> idf  = computeIdf(fullCorpus);
        Map<String, Double> uVec = tfidfVector(userText,        idf);
        Map<String, Double> sVec = tfidfVector(scholarshipText, idf);

        return cosineSimilarity(uVec, sVec);
    }

    // ── Internal ──────────────────────────────────────────────────────────────

    /**
     * Tokenises text into lowercase alphabetic tokens, filters stop words and
     * very short tokens.
     */
    List<String> tokenize(String text) {
        if (text == null) return Collections.emptyList();
        return Arrays.stream(text.toLowerCase().split("[^a-z]+"))
                .filter(t -> t.length() > 2 && !STOP_WORDS.contains(t))
                .collect(Collectors.toList());
    }

    /**
     * Builds a TF-IDF weighted vector for a document given a pre-computed IDF.
     * TF is normalised by the max term count in the document.
     */
    private Map<String, Double> tfidfVector(String text, Map<String, Double> idf) {
        List<String> tokens = tokenize(text);
        if (tokens.isEmpty()) return Collections.emptyMap();

        Map<String, Long> counts = tokens.stream()
                .collect(Collectors.groupingBy(t -> t, Collectors.counting()));
        double maxCount = counts.values().stream().mapToLong(Long::longValue).max().orElse(1L);

        Map<String, Double> vector = new HashMap<>();
        counts.forEach((term, count) -> {
            double tf     = count / maxCount;
            double idfVal = idf.getOrDefault(term, 0.0);
            if (idfVal > 0.0) vector.put(term, tf * idfVal);
        });
        return vector;
    }

    /**
     * Smoothed IDF: {@code log((N + 1) / (df + 1)) + 1}
     */
    private Map<String, Double> computeIdf(List<String> corpus) {
        int N = corpus.size();
        Map<String, Integer> docFreq = new HashMap<>();
        for (String doc : corpus) {
            new HashSet<>(tokenize(doc)).forEach(t -> docFreq.merge(t, 1, Integer::sum));
        }
        Map<String, Double> idf = new HashMap<>();
        docFreq.forEach((term, df) ->
                idf.put(term, Math.log((double)(N + 1) / (df + 1)) + 1.0));
        return idf;
    }

    /**
     * Standard cosine similarity between two sparse TF-IDF vectors.
     */
    private double cosineSimilarity(Map<String, Double> v1, Map<String, Double> v2) {
        if (v1.isEmpty() || v2.isEmpty()) return 0.0;
        double dot   = v1.entrySet().stream()
                .mapToDouble(e -> e.getValue() * v2.getOrDefault(e.getKey(), 0.0))
                .sum();
        double norm1 = Math.sqrt(v1.values().stream().mapToDouble(x -> x * x).sum());
        double norm2 = Math.sqrt(v2.values().stream().mapToDouble(x -> x * x).sum());
        return (norm1 == 0.0 || norm2 == 0.0) ? 0.0 : dot / (norm1 * norm2);
    }

    private boolean isBlank(String s) { return s == null || s.isBlank(); }
}
