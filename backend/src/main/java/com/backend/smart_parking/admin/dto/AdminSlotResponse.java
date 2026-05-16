package com.backend.smart_parking.admin.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record AdminSlotResponse(
        UUID id,
        String slotNumber,
        String status,
        String type,
        BigDecimal pricePerHour,
        String floor
) {}
