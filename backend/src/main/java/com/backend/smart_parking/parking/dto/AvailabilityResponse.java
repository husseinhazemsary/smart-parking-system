package com.backend.smart_parking.parking.dto;

public record AvailabilityResponse(
        int availableSlots,
        int totalSlots
) {}
