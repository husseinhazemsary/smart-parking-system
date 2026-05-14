package com.backend.smart_parking.plate.dto;

public record PlateScanResponse(String plate, double confidence, boolean valid) {}
