package com.backend.smart_parking.vehicle.dto;

import com.backend.smart_parking.vehicle.VehicleType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateVehicleRequest(
        @NotBlank String plateNumber,
        String nickname,
        @NotNull VehicleType vehicleType,
        String makeAndModel,
        boolean isDefault,
        boolean autoPay
) {}
