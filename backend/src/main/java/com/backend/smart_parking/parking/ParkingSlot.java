package com.backend.smart_parking.parking;

import jakarta.persistence.*;

import java.util.UUID;

@Entity
@Table(name = "parking_spot", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"parking_lot_id", "spot_code"})
})
public class ParkingSlot {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parking_lot_id", nullable = false)
    private ParkingLot parkingLot;

    @Column(name = "spot_code", nullable = false)
    private String slotLabel;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SlotType slotType = SlotType.REGULAR;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SlotStatus status = SlotStatus.AVAILABLE;

    public UUID getId() { return id; }
    public ParkingLot getParkingLot() { return parkingLot; }
    public String getSlotLabel() { return slotLabel; }
    public SlotType getSlotType() { return slotType; }
    public SlotStatus getStatus() { return status; }

    public void setParkingLot(ParkingLot parkingLot) { this.parkingLot = parkingLot; }
    public void setSlotLabel(String slotLabel) { this.slotLabel = slotLabel; }
    public void setSlotType(SlotType slotType) { this.slotType = slotType; }
    public void setStatus(SlotStatus status) { this.status = status; }
}
