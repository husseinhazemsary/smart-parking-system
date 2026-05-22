package com.backend.smart_parking.reservation;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ReservationRepository extends JpaRepository<Reservation, UUID> {

    Optional<Reservation> findByUserIdAndStatus(UUID userId, ReservationStatus status);

    boolean existsByUserIdAndStatus(UUID userId, ReservationStatus status);

    boolean existsBySpotIdAndStatusIn(UUID spotId, List<ReservationStatus> statuses);

    List<Reservation> findAllByUserIdOrderByCreatedAtDesc(UUID userId);

    List<Reservation> findAllByStatus(ReservationStatus status);

    long countByStatus(ReservationStatus status);

    List<Reservation> findAllByOrderByCreatedAtDesc();

    List<Reservation> findAllByStatusInOrderByCreatedAtDesc(List<ReservationStatus> statuses);

    List<Reservation> findByEnteredAtAfterOrderByEnteredAtDesc(Instant since);

    List<Reservation> findAllByGate_ParkingLot_IdOrderByCreatedAtDesc(UUID lotId);

    List<Reservation> findAllByStatusInAndGate_ParkingLot_IdOrderByCreatedAtDesc(List<ReservationStatus> statuses, UUID lotId);

    List<Reservation> findByEnteredAtAfterAndGate_ParkingLot_IdOrderByEnteredAtDesc(Instant since, UUID lotId);

    List<Reservation> findAllByGate_ParkingLot_IdInOrderByCreatedAtDesc(List<UUID> lotIds);

    List<Reservation> findAllByStatusInAndGate_ParkingLot_IdInOrderByCreatedAtDesc(List<ReservationStatus> statuses, List<UUID> lotIds);

    List<Reservation> findByEnteredAtAfterAndGate_ParkingLot_IdInOrderByEnteredAtDesc(Instant since, List<UUID> lotIds);
}
