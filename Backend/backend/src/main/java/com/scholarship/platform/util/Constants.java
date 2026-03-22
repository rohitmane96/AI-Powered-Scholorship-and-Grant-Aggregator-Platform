package com.scholarship.platform.util;

/**
 * Application-wide string / numeric constants.
 * Avoids magic values scattered across the codebase.
 */
public final class Constants {

    private Constants() { /* utility class */ }

    // ── JWT ────────────────────────────────────────────────────────────────────
    public static final String TOKEN_PREFIX              = "Bearer ";
    public static final String AUTHORIZATION_HEADER      = "Authorization";
    public static final String REFRESH_TOKEN_COOKIE      = "refreshToken";

    // ── Roles ──────────────────────────────────────────────────────────────────
    public static final String ROLE_STUDENT              = "STUDENT";
    public static final String ROLE_INSTITUTION          = "INSTITUTION";
    public static final String ROLE_ADMIN                = "ADMIN";

    // ── Pagination ─────────────────────────────────────────────────────────────
    public static final int    DEFAULT_PAGE_SIZE         = 20;
    public static final int    MAX_PAGE_SIZE             = 100;

    // ── File Upload ────────────────────────────────────────────────────────────
    public static final long   MAX_FILE_SIZE_BYTES       = 10 * 1024 * 1024L; // 10 MB
    public static final String[] ALLOWED_MIME_TYPES      = {
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "image/jpeg",
        "image/png",
        "image/webp"
    };

    // ── Email templates ────────────────────────────────────────────────────────
    public static final String EMAIL_TEMPLATE_WELCOME    = "email/welcome";
    public static final String EMAIL_TEMPLATE_VERIFY     = "email/verify-email";
    public static final String EMAIL_TEMPLATE_RESET_PWD  = "email/reset-password";
    public static final String EMAIL_TEMPLATE_APP_STATUS = "email/application-status";
    public static final String EMAIL_TEMPLATE_DEADLINE   = "email/deadline-reminder";

    // ── Notification types ─────────────────────────────────────────────────────
    public static final String NOTIF_APPLICATION_STATUS  = "APPLICATION_STATUS";
    public static final String NOTIF_DEADLINE_REMINDER   = "DEADLINE_REMINDER";
    public static final String NOTIF_NEW_MATCH           = "NEW_MATCH";
    public static final String NOTIF_DOC_VERIFIED        = "DOCUMENT_VERIFIED";
    public static final String NOTIF_WELCOME             = "WELCOME";

    // ── Profile completion weights ─────────────────────────────────────────────
    public static final int    PC_BASIC_INFO             = 20;
    public static final int    PC_EDUCATION              = 30;
    public static final int    PC_PREFERENCES            = 20;
    public static final int    PC_AVATAR                 = 10;
    public static final int    PC_VERIFIED               = 20;

    // ── AI Matching scores (sum of base criteria = 90; bonuses push to 100) ───
    public static final int    MATCH_COUNTRY             = 20;  // country match
    public static final int    MATCH_DEGREE              = 20;  // exact degree level
    public static final int    MATCH_FIELD_EXACT         = 20;  // exact field of study
    public static final int    MATCH_FIELD_PARTIAL       = 10;  // partial/keyword field match
    public static final int    MATCH_GPA_HIGH            = 15;  // GPA >= 3.5
    public static final int    MATCH_GPA_MID             = 10;  // GPA >= 3.0
    public static final int    MATCH_GPA_LOW             =  5;  // GPA >= 2.5
    public static final int    MATCH_FUNDING             = 15;  // funding type preference
    public static final int    MATCH_TAG                 =  5;  // tag/keyword match
    public static final int    MATCH_DEADLINE_URGENCY    =  5;  // deadline within 30 days
    public static final int    MATCH_HISTORY_BOOST       = 10;  // similar to accepted application
    public static final int    MATCH_MAX_SCORE           = 100; // score cap

    // Legacy aliases kept for backward-compat with existing tests
    /** @deprecated Use {@link #MATCH_FIELD_EXACT} */
    @Deprecated
    public static final int    MATCH_FIELD               = MATCH_FIELD_EXACT;
    /** @deprecated Use {@link #MATCH_GPA_MID} */
    @Deprecated
    public static final int    MATCH_GPA                 = MATCH_GPA_MID;

    // ── Hybrid Recommendation Engine – ensemble weights (must sum to 1.0) ─────
    /** Weight for rule-based eligibility component (0-100 sub-score). */
    public static final double REC_WEIGHT_RULES      = 0.45;
    /** Weight for TF-IDF cosine NLP component (0-100 sub-score). */
    public static final double REC_WEIGHT_NLP        = 0.40;
    /** Weight for popularity component (0-100 sub-score). */
    public static final double REC_WEIGHT_POPULARITY = 0.15;

    // ── Cache keys ─────────────────────────────────────────────────────────────
    public static final String CACHE_FEATURED            = "featured_scholarships";
    public static final String CACHE_STATS               = "platform_stats";

    // ── Correlation ID MDC key ─────────────────────────────────────────────────
    public static final String CORRELATION_ID_KEY        = "correlationId";
    public static final String CORRELATION_ID_HEADER     = "X-Correlation-Id";
}
