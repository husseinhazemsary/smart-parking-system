package com.backend.smart_parking.savedplace;

import com.backend.smart_parking.parking.ParkingLot;
import com.backend.smart_parking.user.User;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "saved_places", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"user_id", "parking_lot_id"})
})
public class SavedPlace {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parking_lot_id", nullable = false)
    private ParkingLot parkingLot;

    @Column(nullable = false, updatable = false)
    private Instant savedAt;

    @PrePersist
    protected void onCreate() {
        savedAt = Instant.now();
    }

    public UUID getId() { return id; }
    public User getUser() { return user; }
    public ParkingLot getParkingLot() { return parkingLot; }
    public Instant getSavedAt() { return savedAt; }

    public void setUser(User user) { this.user = user; }
    public void setParkingLot(ParkingLot parkingLot) { this.parkingLot = parkingLot; }
}
