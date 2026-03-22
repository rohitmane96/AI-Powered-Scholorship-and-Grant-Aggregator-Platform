package com.scholarship.platform.service;

import com.scholarship.platform.exception.BadRequestException;
import com.scholarship.platform.util.FileUtil;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;

/**
 * Local filesystem-backed file storage.
 * <p>
 * To switch to AWS S3, replace this implementation bean while keeping the
 * same public interface signature.
 */
@Slf4j
@Service
public class FileStorageService {

    @Value("${file.upload-dir:./uploads}")
    private String uploadDir;

    @PostConstruct
    public void init() {
        try {
            Files.createDirectories(Paths.get(uploadDir));
            log.info("File storage initialised at: {}", Paths.get(uploadDir).toAbsolutePath());
        } catch (IOException ex) {
            throw new RuntimeException("Could not create upload directory: " + ex.getMessage(), ex);
        }
    }

    /**
     * Stores the given file inside {@code uploadDir/<subDir>} and returns
     * a relative URL path suitable for serving via the API.
     */
    public String store(MultipartFile file, String subDir) {
        String uniqueName = FileUtil.generateUniqueFileName(
                file.getOriginalFilename() != null ? file.getOriginalFilename() : "upload");

        Path targetDir  = Paths.get(uploadDir, subDir);
        Path targetPath = targetDir.resolve(uniqueName);

        try {
            Files.createDirectories(targetDir);
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException ex) {
            throw new BadRequestException("Failed to store file: " + ex.getMessage());
        }

        // Return a URL-friendly relative path
        return "/uploads/" + subDir + "/" + uniqueName;
    }

    /**
     * Deletes a file by its relative URL path.
     * Silently ignores missing files.
     */
    public void delete(String fileUrl) {
        if (fileUrl == null || fileUrl.isBlank()) return;

        // Convert "/uploads/..." URL to filesystem path
        String relative = fileUrl.startsWith("/uploads/")
                ? fileUrl.substring("/uploads/".length()) : fileUrl;

        Path path = Paths.get(uploadDir, relative);
        try {
            Files.deleteIfExists(path);
        } catch (IOException ex) {
            log.warn("Could not delete file {}: {}", path, ex.getMessage());
        }
    }

    public Path resolveFilePath(String fileUrl) {
        String relative = fileUrl.startsWith("/uploads/")
                ? fileUrl.substring("/uploads/".length()) : fileUrl;
        return Paths.get(uploadDir, relative);
    }
}
