package com.backend.smart_parking.savedplace.dto;

import java.util.UUID;

public record SavedPlaceResponse(
        UUID id,
        UUID parkingLotId,
        String parkingLotName,
        String address,
        String savedAt
) {}
