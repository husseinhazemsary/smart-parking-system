package com.backend.smart_parking.parking.dto;

import java.time.Instant;
import java.util.UUID;

public record AlertResponse(
        UUID id,
        String triggerCondition,
        Integer minSpots,
        Integer checkDurationMinutes,
        int expiresInMinutes,
        boolean quietHours,
        boolean pushNotification,
        boolean sound,
        boolean vibrate,
        boolean active,
        Instant createdAt
) {}
