package com.backend.smart_parking.auth.dto;

import jakarta.validation.constraints.*;
import java.time.LocalDate;

public record RegisterRequest(
        @NotBlank String fullName,
        @Email @NotBlank String email,
        @NotBlank String phoneNumber,
        @NotNull LocalDate dateOfBirth,
        @NotBlank @Size(min = 8) String password
) {}
