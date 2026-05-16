package com.backend.smart_parking.parking;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface ParkingReportRepository extends JpaRepository<ParkingReport, UUID> {}
