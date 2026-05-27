package com.backend.smart_parking.reservation.dto;

import java.time.Instant;
import java.util.UUID;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;

public class CreateReservationRequest {

    @NotNull
    private UUID vehicleId;

    @NotNull
    private UUID parkingLotId;

    @NotNull
    @Future
    private Instant startTime;

    @NotNull
    @Future
    private Instant endTime;

    public UUID getVehicleId() { return vehicleId; }
    public UUID getParkingLotId() { return parkingLotId; }
    public Instant getStartTime() { return startTime; }
    public Instant getEndTime() { return endTime; }

    public void setVehicleId(UUID vehicleId) { this.vehicleId = vehicleId; }
    public void setParkingLotId(UUID parkingLotId) { this.parkingLotId = parkingLotId; }
    public void setStartTime(Instant startTime) { this.startTime = startTime; }
    public void setEndTime(Instant endTime) { this.endTime = endTime; }
}
