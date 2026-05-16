package com.backend.smart_parking.parking;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ParkingAlertRepository extends JpaRepository<ParkingAlert, UUID> {

    List<ParkingAlert> findAllByUserIdAndActiveTrue(UUID userId);

    Optional<ParkingAlert> findByUserIdAndParkingLotIdAndActiveTrue(UUID userId, UUID parkingLotId);

    List<ParkingAlert> findAllByUserIdAndParkingLotIdAndActiveTrue(UUID userId, UUID parkingLotId);
}
