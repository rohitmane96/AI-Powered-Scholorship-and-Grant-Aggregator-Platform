package com.scholarship.platform.service;

import com.scholarship.platform.exception.ResourceNotFoundException;
import com.scholarship.platform.exception.UnauthorizedException;
import com.scholarship.platform.model.Document;
import com.scholarship.platform.model.enums.DocumentType;
import com.scholarship.platform.repository.DocumentRepository;
import com.scholarship.platform.util.FileUtil;
import com.scholarship.platform.util.ValidationUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Handles document upload, retrieval, verification, and deletion.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DocumentService {

    private final DocumentRepository documentRepository;
    private final FileStorageService fileStorageService;

    public Document upload(MultipartFile file, String userId,
                           String applicationId, DocumentType type) {
        String mimeType = FileUtil.getMimeType(file);

        if (!ValidationUtil.isAllowedMimeType(mimeType)) {
            throw new com.scholarship.platform.exception.BadRequestException(
                    "File type not allowed. Permitted: PDF, DOCX, JPEG, PNG", "INVALID_FILE_TYPE");
        }
        if (!ValidationUtil.isValidFileSize(file.getSize())) {
            throw new com.scholarship.platform.exception.BadRequestException(
                    "File exceeds the 10 MB limit", "FILE_TOO_LARGE");
        }

        String fileUrl = fileStorageService.store(file, "documents/" + userId);

        Document doc = Document.builder()
                .userId(userId)
                .applicationId(applicationId)
                .type(type)
                .fileName(file.getOriginalFilename())
                .fileUrl(fileUrl)
                .fileSize(file.getSize())
                .mimeType(mimeType)
                .build();

        Document saved = documentRepository.save(doc);
        log.info("Document {} uploaded for user {} / application {}", saved.getId(), userId, applicationId);
        return saved;
    }

    public Document getById(String id) {
        return documentRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new ResourceNotFoundException("Document", "id", id));
    }

    public List<Document> getByApplication(String applicationId) {
        return documentRepository.findByApplicationIdAndDeletedFalse(applicationId);
    }

    public void delete(String id, String userId) {
        Document doc = documentRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Document", "id", id));
        doc.setDeleted(true);
        documentRepository.save(doc);
        fileStorageService.delete(doc.getFileUrl());
        log.info("Document {} deleted", id);
    }

    public Document verify(String id, String verifiedByUserId) {
        Document doc = getById(id);
        doc.setVerified(true);
        doc.setVerifiedBy(verifiedByUserId);
        doc.setVerifiedAt(LocalDateTime.now());
        return documentRepository.save(doc);
    }
}
