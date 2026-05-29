package com.backend.smart_parking.verification;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;
import java.util.UUID;

public interface VerificationTokenRepository extends JpaRepository<VerificationToken, UUID> {

    Optional<VerificationToken> findByUser_IdAndTypeAndToken(UUID userId, TokenType type, String token);

    @Modifying
    @Query("DELETE FROM VerificationToken v WHERE v.user.id = :userId AND v.type = :type AND v.used = false")
    void deleteUnusedByUserIdAndType(UUID userId, TokenType type);
}
