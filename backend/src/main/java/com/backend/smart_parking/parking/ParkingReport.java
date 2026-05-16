package com.backend.smart_parking.parking;

import com.backend.smart_parking.user.User;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "parking_reports")
public class ParkingReport {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parking_lot_id", nullable = false)
    private ParkingLot parkingLot;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(nullable = false)
    private String reason;

    @Column(columnDefinition = "text")
    private String note;

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public UUID getId() { return id; }
    public ParkingLot getParkingLot() { return parkingLot; }
    public User getUser() { return user; }
    public String getReason() { return reason; }
    public String getNote() { return note; }
    public Instant getCreatedAt() { return createdAt; }

    public void setParkingLot(ParkingLot parkingLot) { this.parkingLot = parkingLot; }
    public void setUser(User user) { this.user = user; }
    public void setReason(String reason) { this.reason = reason; }
    public void setNote(String note) { this.note = note; }
}
