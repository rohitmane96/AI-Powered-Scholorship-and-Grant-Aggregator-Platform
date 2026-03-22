package com.scholarship.platform.controller;

import com.scholarship.platform.dto.response.ApiResponse;
import com.scholarship.platform.model.Document;
import com.scholarship.platform.model.enums.DocumentType;
import com.scholarship.platform.service.DocumentService;
import com.scholarship.platform.service.FileStorageService;
import com.scholarship.platform.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.net.MalformedURLException;
import java.nio.file.Path;
import java.util.List;

/**
 * Document upload, download, and verification.
 */
@RestController
@RequestMapping("/api/documents")
@RequiredArgsConstructor
@Tag(name = "Documents", description = "Document upload and management")
@SecurityRequirement(name = "bearerAuth")
public class DocumentController {

    private final DocumentService    documentService;
    private final FileStorageService fileStorageService;
    private final UserService        userService;

    @Operation(summary = "Upload a document for an application")
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<Document>> upload(
            @AuthenticationPrincipal UserDetails principal,
            @RequestParam("file") MultipartFile file,
            @RequestParam("applicationId") String applicationId,
            @RequestParam("type") DocumentType type) {

        String userId = userService.getByEmail(principal.getUsername()).getId();
        Document doc  = documentService.upload(file, userId, applicationId, type);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Document uploaded", doc));
    }

    @Operation(summary = "Download a document by ID")
    @GetMapping("/{id}")
    public ResponseEntity<Resource> download(
            @PathVariable String id,
            @AuthenticationPrincipal UserDetails principal) throws MalformedURLException {

        Document doc = documentService.getById(id);
        Path     path = fileStorageService.resolveFilePath(doc.getFileUrl());
        Resource resource = new UrlResource(path.toUri());

        if (!resource.exists()) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(doc.getMimeType()))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + doc.getFileName() + "\"")
                .body(resource);
    }

    @Operation(summary = "List documents for a given application")
    @GetMapping("/application/{applicationId}")
    public ResponseEntity<ApiResponse<List<Document>>> listByApplication(
            @PathVariable String applicationId) {

        return ResponseEntity.ok(ApiResponse.ok(documentService.getByApplication(applicationId)));
    }

    @Operation(summary = "Delete a document")
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable String id,
            @AuthenticationPrincipal UserDetails principal) {

        String userId = userService.getByEmail(principal.getUsername()).getId();
        documentService.delete(id, userId);
        return ResponseEntity.ok(ApiResponse.ok("Document deleted"));
    }

    @Operation(summary = "[Admin] Mark a document as verified")
    @PatchMapping("/{id}/verify")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Document>> verify(
            @PathVariable String id,
            @AuthenticationPrincipal UserDetails principal) {

        String adminId = userService.getByEmail(principal.getUsername()).getId();
        return ResponseEntity.ok(ApiResponse.ok("Document verified",
                documentService.verify(id, adminId)));
    }
}
