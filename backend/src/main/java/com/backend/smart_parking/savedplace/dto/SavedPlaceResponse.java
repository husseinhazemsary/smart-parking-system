package com.backend.smart_parking.savedplace.dto;

import java.time.Instant;
import java.util.UUID;

public record SavedPlaceResponse(
        UUID id,
        UUID parkingLotId,
        String parkingLotName,
        String address,
        Instant savedAt
) {}
