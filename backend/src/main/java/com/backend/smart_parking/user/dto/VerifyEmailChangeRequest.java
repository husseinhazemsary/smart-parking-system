package com.backend.smart_parking.user.dto;

import jakarta.validation.constraints.NotBlank;

public record VerifyEmailChangeRequest(@NotBlank String code) {}
