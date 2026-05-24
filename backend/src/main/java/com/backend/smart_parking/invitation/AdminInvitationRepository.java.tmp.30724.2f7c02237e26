package com.backend.smart_parking.invitation;

import org.springframework.data.jpa.repository.JpaRepository;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AdminInvitationRepository extends JpaRepository<AdminInvitation, UUID> {
    Optional<AdminInvitation> findByToken(UUID token);
    boolean existsByEmail(String email);
    List<AdminInvitation> findByUsedFalseAndExpiresAtAfter(Instant now);
    List<AdminInvitation> findByUsedFalseAndExpiresAtBefore(Instant now);
}
