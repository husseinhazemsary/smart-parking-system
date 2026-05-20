package com.backend.smart_parking.parking.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.List;

public record CreateParkingLotRequest(
        @NotBlank String name,
        String nameAr,
        @NotBlank String address,
        String addressAr,
        String phoneNumber,
        @NotNull Double latitude,
        @NotNull Double longitude,
        @NotNull BigDecimal hourlyRate,
        @NotNull LocalTime openingTime,
        @NotNull LocalTime closingTime,
        int numberOfGates,
        String imageUrl,
        boolean hasSubscriptions,
        List<String> amenities,
        List<DayOfWeek> operatingDays
) {}
