package com.backend.smart_parking.user.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record EmailChangeRequest(
        @Email @NotBlank String newEmail
) {}
