package com.scholarship.platform.repository;

import com.scholarship.platform.model.Document;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DocumentRepository extends MongoRepository<Document, String> {

    List<Document> findByApplicationIdAndDeletedFalse(String applicationId);

    List<Document> findByUserIdAndDeletedFalse(String userId);

    Optional<Document> findByIdAndDeletedFalse(String id);

    Optional<Document> findByIdAndUserId(String id, String userId);
}
