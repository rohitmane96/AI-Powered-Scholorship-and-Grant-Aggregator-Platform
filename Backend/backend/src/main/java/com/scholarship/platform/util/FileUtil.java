package com.scholarship.platform.util;

import org.apache.commons.io.FilenameUtils;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

/**
 * File-handling utilities.
 */
public final class FileUtil {

    private FileUtil() {}

    /**
     * Generates a unique storage filename while preserving the original extension.
     *
     * @param originalFilename the original file name from the uploaded file
     * @return a UUID-based unique filename with the original extension
     */
    public static String generateUniqueFileName(String originalFilename) {
        String ext = FilenameUtils.getExtension(originalFilename);
        return UUID.randomUUID() + (ext.isBlank() ? "" : "." + ext);
    }

    /**
     * Derives the MIME type from the MultipartFile content type, falling back to
     * "application/octet-stream" when unavailable.
     */
    public static String getMimeType(MultipartFile file) {
        String ct = file.getContentType();
        return (ct != null && !ct.isBlank()) ? ct : "application/octet-stream";
    }

    /**
     * Returns a human-readable file size string.
     */
    public static String humanReadableSize(long bytes) {
        if (bytes < 1024)           return bytes + " B";
        if (bytes < 1024 * 1024)    return String.format("%.1f KB", bytes / 1024.0);
        return String.format("%.1f MB", bytes / (1024.0 * 1024));
    }
}
