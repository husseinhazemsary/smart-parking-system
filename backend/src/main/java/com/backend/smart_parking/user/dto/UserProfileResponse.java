package com.backend.smart_parking.user.dto;

import com.backend.smart_parking.user.AuthProvider;
import com.backend.smart_parking.user.Role;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record UserProfileResponse(
        UUID id,
        String fullName,
        String email,
        String phoneNumber,
        LocalDate dateOfBirth,
        AuthProvider provider,
        Instant createdAt,
        Role role,
        List<UUID> assignedLotIds,
        List<String> assignedLotNames
) {}
