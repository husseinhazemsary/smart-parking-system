package com.backend.smart_parking.reservation;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ReservationRepository extends JpaRepository<Reservation, UUID> {

    Optional<Reservation> findByUserIdAndStatus(UUID userId, ReservationStatus status);

    boolean existsByUserIdAndStatus(UUID userId, ReservationStatus status);

    boolean existsBySpotIdAndStatusIn(UUID spotId, List<ReservationStatus> statuses);

    List<Reservation> findAllByUserIdOrderByCreatedAtDesc(UUID userId);

    List<Reservation> findAllByStatus(ReservationStatus status);
}
