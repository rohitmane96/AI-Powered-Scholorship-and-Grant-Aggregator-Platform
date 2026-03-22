package com.scholarship.platform.repository;

import com.scholarship.platform.model.User;
import com.scholarship.platform.model.enums.UserRole;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface UserRepository extends MongoRepository<User, String> {

    Optional<User> findByEmailAndDeletedFalse(String email);

    boolean existsByEmail(String email);

    Optional<User> findByVerificationToken(String token);

    Optional<User> findByPasswordResetToken(String token);

    Page<User> findAllByDeletedFalse(Pageable pageable);

    Page<User> findByRoleAndDeletedFalse(UserRole role, Pageable pageable);

    long countByRoleAndDeletedFalse(UserRole role);

    long countByCreatedAtAfter(LocalDateTime since);
}
