package com.backend.smart_parking.auth.dto;

public record RegisterResponse(boolean requiresVerification, String email) {}
