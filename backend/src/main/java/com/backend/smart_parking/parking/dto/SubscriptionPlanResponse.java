package com.backend.smart_parking.parking.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record SubscriptionPlanResponse(
        UUID id,
        String name,
        int durationDays,
        BigDecimal price,
        String description
) {}
