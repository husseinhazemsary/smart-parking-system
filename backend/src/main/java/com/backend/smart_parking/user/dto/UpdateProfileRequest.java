package com.backend.smart_parking.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record UpdateProfileRequest(
        @NotBlank String fullName,
        @NotBlank String phoneNumber,
        @NotNull LocalDate dateOfBirth
) {}
