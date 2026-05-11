package com.backend.smart_parking.auth.dto;

import jakarta.validation.constraints.NotBlank;

public record OAuthRequest(@NotBlank String idToken) {}
