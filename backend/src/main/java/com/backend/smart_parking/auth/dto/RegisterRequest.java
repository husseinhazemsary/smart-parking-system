package com.backend.smart_parking.auth.dto;

import jakarta.validation.constraints.*;
import java.time.LocalDate;

public record RegisterRequest(
        @NotBlank String fullName,
        @Email @NotBlank String email,
        @NotBlank @Pattern(regexp = "^01[0125]\\d{8}$", message = "Enter a valid Egyptian phone number (e.g. 01012345678)") String phoneNumber,
        @NotNull LocalDate dateOfBirth,
        @NotBlank @Size(min = 8) String password
) {}
