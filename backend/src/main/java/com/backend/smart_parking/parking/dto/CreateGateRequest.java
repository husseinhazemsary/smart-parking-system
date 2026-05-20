package com.backend.smart_parking.parking.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateGateRequest(
        @NotBlank String name,
        String location
) {}
