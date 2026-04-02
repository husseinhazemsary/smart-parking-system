package com.backend.smart_parking.vehicle.dto;

import com.backend.smart_parking.vehicle.VehicleType;

import java.time.Instant;
import java.util.UUID;

public record VehicleResponse(
        UUID id,
        String plateNumber,
        String nickname,
        VehicleType vehicleType,
        String makeAndModel,
        boolean isDefault,
        boolean autoPay,
        Instant createdAt
) {}
