package com.backend.smart_parking.admin.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record PendingInvitationResponse(
        UUID id,
        String email,
        String fullName,
        String phoneNumber,
        Instant expiresAt,
        List<UUID> assignedLotIds,
        List<String> assignedLotNames
) {}
