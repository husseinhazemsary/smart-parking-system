package com.backend.smart_parking.admin.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record AdminSessionResponse(
        UUID id,
        String slotNumber,
        String userFullName,
        String userEmail,
        Instant entryTime,
        Instant exitTime,
        Long durationMinutes,
        BigDecimal amountCharged,
        String status
) {}
