package com.backend.smart_parking.parking.dto;

import jakarta.validation.constraints.NotBlank;

public record ReportRequest(
        @NotBlank String reason,
        String note
) {}
