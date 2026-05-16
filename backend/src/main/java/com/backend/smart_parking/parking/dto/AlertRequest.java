package com.backend.smart_parking.parking.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;

public record AlertRequest(
        @NotBlank String triggerCondition,
        Integer minSpots,
        Integer checkDurationMinutes,
        @Positive int expiresInMinutes,
        boolean quietHours,
        boolean pushNotification,
        boolean sound,
        boolean vibrate
) {}
