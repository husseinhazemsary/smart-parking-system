package com.backend.smart_parking.parking;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "parking_subscription_plans")
public class ParkingSubscriptionPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "parking_lot_id", nullable = false)
    private ParkingLot parkingLot;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private int durationDays;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    @Column
    private String description;

    public UUID getId() { return id; }
    public ParkingLot getParkingLot() { return parkingLot; }
    public String getName() { return name; }
    public int getDurationDays() { return durationDays; }
    public BigDecimal getPrice() { return price; }
    public String getDescription() { return description; }

    public void setParkingLot(ParkingLot parkingLot) { this.parkingLot = parkingLot; }
    public void setName(String name) { this.name = name; }
    public void setDurationDays(int durationDays) { this.durationDays = durationDays; }
    public void setPrice(BigDecimal price) { this.price = price; }
    public void setDescription(String description) { this.description = description; }
}
