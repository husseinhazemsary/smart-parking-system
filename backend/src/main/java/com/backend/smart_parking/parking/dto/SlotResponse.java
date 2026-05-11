package com.backend.smart_parking.parking.dto;

import com.backend.smart_parking.parking.SlotStatus;
import com.backend.smart_parking.parking.SlotType;

import java.util.UUID;

public record SlotResponse(
        UUID id,
        String slotLabel,
        SlotType slotType,
        SlotStatus status
) {}
