package com.backend.smart_parking.parking;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface GateRepository extends JpaRepository<Gate, UUID> {
    List<Gate> findAllByParkingLotIdAndIsActiveTrue(UUID parkingLotId);
}
