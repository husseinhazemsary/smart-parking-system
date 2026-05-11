package com.backend.smart_parking.reservation.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;

import java.time.Instant;
import java.util.UUID;

public class CreateReservationRequest {

    @NotNull
    private UUID vehicleId;

    @NotNull
    private UUID gateId;

    @NotNull
    private UUID spotId;

    @NotNull
    @Future
    private Instant startTime;

    private Instant endTime;

    public UUID getVehicleId() { return vehicleId; }
    public UUID getGateId() { return gateId; }
    public UUID getSpotId() { return spotId; }
    public Instant getStartTime() { return startTime; }
    public Instant getEndTime() { return endTime; }

    public void setVehicleId(UUID vehicleId) { this.vehicleId = vehicleId; }
    public void setGateId(UUID gateId) { this.gateId = gateId; }
    public void setSpotId(UUID spotId) { this.spotId = spotId; }
    public void setStartTime(Instant startTime) { this.startTime = startTime; }
    public void setEndTime(Instant endTime) { this.endTime = endTime; }
}
