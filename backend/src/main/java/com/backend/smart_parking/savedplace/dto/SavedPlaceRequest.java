package com.backend.smart_parking.savedplace.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record SavedPlaceRequest(@NotNull UUID parkingLotId) {}
