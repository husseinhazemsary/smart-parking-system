package com.backend.smart_parking.parking;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ParkingSlotRepository extends JpaRepository<ParkingSlot, UUID> {

    List<ParkingSlot> findAllByParkingLotOrderBySlotLabel(ParkingLot parkingLot);

    int countByParkingLotId(UUID parkingLotId);

    int countByParkingLotIdAndStatus(UUID parkingLotId, SlotStatus status);

    java.util.Optional<ParkingSlot> findFirstByParkingLotIdAndStatusOrderBySlotLabel(UUID parkingLotId, SlotStatus status);
}
