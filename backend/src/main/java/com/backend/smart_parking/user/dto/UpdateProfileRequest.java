package com.backend.smart_parking.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

import java.time.LocalDate;

public record UpdateProfileRequest(
        @NotBlank String fullName,
        @NotBlank @Pattern(regexp = "^01[0125]\\d{8}$", message = "Enter a valid Egyptian phone number (e.g. 01012345678)") String phoneNumber,
        @NotNull LocalDate dateOfBirth
) {}
