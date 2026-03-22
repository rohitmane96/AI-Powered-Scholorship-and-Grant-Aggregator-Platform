package com.scholarship.platform.repository;

import com.scholarship.platform.model.Institution;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface InstitutionRepository extends MongoRepository<Institution, String> {

    Optional<Institution> findByUserId(String userId);

    boolean existsByUserId(String userId);
}
