package com.backend.smart_parking.admin.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record UpdateLotAdminRequest(
        @NotBlank String fullName,
        @Email @NotBlank String email,
        String phoneNumber,
        @NotNull UUID assignedLotId,
        String password
) {}
