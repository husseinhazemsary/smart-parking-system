package com.backend.smart_parking.admin.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;
import java.util.UUID;

public record CreateLotAdminRequest(
        @NotBlank String fullName,
        @Email @NotBlank String email,
        @NotEmpty List<UUID> assignedLotIds,
        String phoneNumber
) {}
