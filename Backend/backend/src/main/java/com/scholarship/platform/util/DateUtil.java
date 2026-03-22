package com.scholarship.platform.util;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;

/**
 * Date / time helper methods.
 */
public final class DateUtil {

    private DateUtil() {}

    public static final DateTimeFormatter ISO_FORMATTER =
            DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss");

    /**
     * Returns the number of days between now and the given future date.
     * Negative values indicate the date has passed.
     */
    public static long daysUntil(LocalDateTime future) {
        return ChronoUnit.DAYS.between(LocalDateTime.now(), future);
    }

    /**
     * Checks whether the given deadline is within the next {@code days} days.
     */
    public static boolean isDeadlineWithin(LocalDateTime deadline, int days) {
        long remaining = daysUntil(deadline);
        return remaining >= 0 && remaining <= days;
    }

    /** Converts LocalDateTime to milliseconds since epoch (UTC). */
    public static long toEpochMillis(LocalDateTime dt) {
        return dt.atZone(ZoneId.systemDefault()).toInstant().toEpochMilli();
    }

    /** Formats a LocalDateTime using the ISO formatter. */
    public static String format(LocalDateTime dt) {
        return dt == null ? null : ISO_FORMATTER.format(dt);
    }
}
