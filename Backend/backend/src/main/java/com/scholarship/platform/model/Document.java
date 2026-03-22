package com.scholarship.platform.model;

import com.scholarship.platform.model.enums.DocumentType;
import lombok.*;
import org.springframework.data.annotation.*;
import org.springframework.data.mongodb.core.index.Indexed;

import java.time.LocalDateTime;

/**
 * Metadata for an uploaded document (the actual file lives on disk / S3).
 */
@org.springframework.data.mongodb.core.mapping.Document(collection = "documents")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Document {

    @Id
    private String id;

    @Indexed
    private String userId;

    @Indexed
    private String applicationId;

    private DocumentType type;
    private String fileName;
    private String fileUrl;
    private Long fileSize;
    private String mimeType;

    @Builder.Default
    private boolean verified = false;

    private String verifiedBy;
    private LocalDateTime verifiedAt;

    @CreatedDate
    private LocalDateTime uploadedAt;

    @Builder.Default
    private boolean deleted = false;
}
