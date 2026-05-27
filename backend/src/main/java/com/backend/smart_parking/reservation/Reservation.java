package com.backend.smart_parking.reservation;

import com.backend.smart_parking.parking.Gate;
import com.backend.smart_parking.parking.ParkingSlot;
import com.backend.smart_parking.user.User;
import com.backend.smart_parking.vehicle.Vehicle;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "reservation")
public class Reservation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id", nullable = false)
    private Vehicle vehicle;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "gate_id", nullable = false)
    private Gate gate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "spot_id", nullable = true)
    private ParkingSlot spot;

    @Column(name = "start_time", nullable = false)
    private Instant startTime;

    @Column(name = "end_time")
    private Instant endTime;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private ReservationStatus status = ReservationStatus.PENDING;

    @Column(name = "entered_at")
    private Instant enteredAt;

    @Column(name = "exited_at")
    private Instant exitedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() { createdAt = Instant.now(); }

    public UUID getId() { return id; }
    public User getUser() { return user; }
    public Vehicle getVehicle() { return vehicle; }
    public Gate getGate() { return gate; }
    public ParkingSlot getSpot() { return spot; }
    public Instant getStartTime() { return startTime; }
    public Instant getEndTime() { return endTime; }
    public ReservationStatus getStatus() { return status; }
    public Instant getEnteredAt() { return enteredAt; }
    public Instant getExitedAt() { return exitedAt; }
    public Instant getCreatedAt() { return createdAt; }

    public void setUser(User user) { this.user = user; }
    public void setVehicle(Vehicle vehicle) { this.vehicle = vehicle; }
    public void setGate(Gate gate) { this.gate = gate; }
    public void setSpot(ParkingSlot spot) { this.spot = spot; }
    public void setStartTime(Instant startTime) { this.startTime = startTime; }
    public void setEndTime(Instant endTime) { this.endTime = endTime; }
    public void setStatus(ReservationStatus status) { this.status = status; }
    public void setEnteredAt(Instant enteredAt) { this.enteredAt = enteredAt; }
    public void setExitedAt(Instant exitedAt) { this.exitedAt = exitedAt; }
}
