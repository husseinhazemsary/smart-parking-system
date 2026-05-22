package com.backend.smart_parking.admin.dto;

import java.util.List;
import java.util.UUID;

public record LotAdminResponse(
        UUID id,
        String fullName,
        String email,
        String phoneNumber,
        List<UUID> assignedLotIds,
        List<String> assignedLotNames
) {}
