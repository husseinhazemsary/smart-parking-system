package com.backend.smart_parking.parking.dto;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

public record ParkingLotDetailResponse(
        UUID id,
        String name,
        String address,
        double latitude,
        double longitude,
        BigDecimal hourlyRate,
        LocalTime openingTime,
        LocalTime closingTime,
        List<String> amenities,
        List<DayOfWeek> operatingDays,
        int numberOfGates,
        int availableSlots,
        int totalSlots,
        String imageUrl,
        boolean hasSubscriptions
) {}
