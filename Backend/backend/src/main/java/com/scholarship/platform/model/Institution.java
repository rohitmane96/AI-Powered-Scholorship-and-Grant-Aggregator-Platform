package com.scholarship.platform.model;

import lombok.*;
import org.springframework.data.annotation.*;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

/**
 * Extended profile for an institution account.
 * Linked 1-to-1 with a User whose role is INSTITUTION.
 */
@Document(collection = "institutions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Institution {

    @Id
    private String id;

    @Indexed(unique = true)
    private String userId;

    private String name;
    private String type;       // University, NGO, Government, Corporate, etc.
    private String country;
    private String website;
    private String description;
    private String logoUrl;

    @Builder.Default
    private boolean verified = false;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}
