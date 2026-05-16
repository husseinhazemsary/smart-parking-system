package com.backend.smart_parking.parking.dto;

import java.math.BigDecimal;
import java.time.LocalTime;
import java.util.UUID;

public record ParkingLotSummaryResponse(
        UUID id,
        String name,
        String nameAr,
        String address,
        String addressAr,
        Double distanceKm,
        int availableSlots,
        int totalSlots,
        BigDecimal hourlyRate,
        LocalTime openingTime,
        LocalTime closingTime,
        String imageUrl
) {}
