package com.scholarship.platform.repository;

import com.scholarship.platform.model.Application;
import com.scholarship.platform.model.enums.ApplicationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ApplicationRepository extends MongoRepository<Application, String> {

    Optional<Application> findByIdAndUserId(String id, String userId);

    boolean existsByUserIdAndScholarshipId(String userId, String scholarshipId);

    Page<Application> findByUserId(String userId, Pageable pageable);

    Page<Application> findByScholarshipId(String scholarshipId, Pageable pageable);

    List<Application> findByUserIdAndStatus(String userId, ApplicationStatus status);

    long countByUserId(String userId);

    long countByStatus(ApplicationStatus status);

    long countByScholarshipId(String scholarshipId);

    List<Application> findByScholarshipIdAndStatus(String scholarshipId, ApplicationStatus status);

    /** Returns all applications for a user (unpaged – use only for small result sets). */
    List<Application> findByUserId(String userId);
}
