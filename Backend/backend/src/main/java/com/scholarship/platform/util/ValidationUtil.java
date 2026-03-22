package com.scholarship.platform.util;

import org.apache.commons.lang3.StringUtils;

import java.util.Arrays;

/**
 * General-purpose validation helpers.
 */
public final class ValidationUtil {

    private ValidationUtil() {}

    /**
     * Returns {@code true} if the provided MIME type is in the allowed list.
     */
    public static boolean isAllowedMimeType(String mimeType) {
        if (StringUtils.isBlank(mimeType)) return false;
        return Arrays.asList(Constants.ALLOWED_MIME_TYPES).contains(mimeType.toLowerCase());
    }

    /**
     * Returns {@code true} if file size is within the platform maximum.
     */
    public static boolean isValidFileSize(long sizeBytes) {
        return sizeBytes > 0 && sizeBytes <= Constants.MAX_FILE_SIZE_BYTES;
    }

    /**
     * Sanitises a string to prevent NoSQL injection by removing dangerous characters.
     */
    public static String sanitize(String input) {
        if (input == null) return null;
        return input.replaceAll("[\\$\\{\\}]", "");
    }

    /**
     * Clamps a page size to the allowed range.
     */
    public static int clampPageSize(int requestedSize) {
        if (requestedSize <= 0) return Constants.DEFAULT_PAGE_SIZE;
        return Math.min(requestedSize, Constants.MAX_PAGE_SIZE);
    }
}
