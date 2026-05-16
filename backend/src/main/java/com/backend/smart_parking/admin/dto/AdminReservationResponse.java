package com.backend.smart_parking.admin.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record AdminReservationResponse(
        UUID id,
        String slotNumber,
        String userFullName,
        Instant startTime,
        Instant endTime,
        String status,
        BigDecimal totalAmount
) {}
