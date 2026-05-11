package com.backend.smart_parking.reservation.dto;

import com.backend.smart_parking.reservation.ReservationStatus;

import java.time.Instant;
import java.util.UUID;

public class ReservationResponse {

    private UUID id;
    private UUID userId;
    private UUID vehicleId;
    private String plateNumber;
    private UUID gateId;
    private String gateName;
    private UUID spotId;
    private String spotCode;
    private String parkingLotName;
    private Instant startTime;
    private Instant endTime;
    private ReservationStatus status;
    private Instant enteredAt;
    private Instant exitedAt;
    private Instant createdAt;

    public ReservationResponse(UUID id, UUID userId, UUID vehicleId, String plateNumber,
                               UUID gateId, String gateName, UUID spotId, String spotCode,
                               String parkingLotName, Instant startTime, Instant endTime,
                               ReservationStatus status, Instant enteredAt, Instant exitedAt,
                               Instant createdAt) {
        this.id = id;
        this.userId = userId;
        this.vehicleId = vehicleId;
        this.plateNumber = plateNumber;
        this.gateId = gateId;
        this.gateName = gateName;
        this.spotId = spotId;
        this.spotCode = spotCode;
        this.parkingLotName = parkingLotName;
        this.startTime = startTime;
        this.endTime = endTime;
        this.status = status;
        this.enteredAt = enteredAt;
        this.exitedAt = exitedAt;
        this.createdAt = createdAt;
    }

    public UUID getId() { return id; }
    public UUID getUserId() { return userId; }
    public UUID getVehicleId() { return vehicleId; }
    public String getPlateNumber() { return plateNumber; }
    public UUID getGateId() { return gateId; }
    public String getGateName() { return gateName; }
    public UUID getSpotId() { return spotId; }
    public String getSpotCode() { return spotCode; }
    public String getParkingLotName() { return parkingLotName; }
    public Instant getStartTime() { return startTime; }
    public Instant getEndTime() { return endTime; }
    public ReservationStatus getStatus() { return status; }
    public Instant getEnteredAt() { return enteredAt; }
    public Instant getExitedAt() { return exitedAt; }
    public Instant getCreatedAt() { return createdAt; }
}
