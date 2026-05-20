package com.backend.smart_parking.admin.dto;

import java.util.UUID;

public record LotAdminResponse(
        UUID id,
        String fullName,
        String email,
        String phoneNumber,
        UUID assignedLotId,
        String assignedLotName
) {}
