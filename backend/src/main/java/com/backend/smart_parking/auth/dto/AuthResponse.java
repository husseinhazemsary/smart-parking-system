package com.backend.smart_parking.auth.dto;

import java.util.UUID;

public record AuthResponse(
        String accessToken,
        String refreshToken,
        String tokenType,
        UserInfo user
) {
    public record UserInfo(UUID id, String fullName, String email) {}
}
