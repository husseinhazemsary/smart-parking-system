package com.backend.smart_parking.reservation;

import com.backend.smart_parking.parking.Gate;
import com.backend.smart_parking.parking.GateRepository;
import com.backend.smart_parking.parking.ParkingSlot;
import com.backend.smart_parking.parking.ParkingSlotRepository;
import com.backend.smart_parking.parking.SlotStatus;
import com.backend.smart_parking.reservation.dto.ActiveSessionResponse;
import com.backend.smart_parking.reservation.dto.CreateReservationRequest;
import com.backend.smart_parking.reservation.dto.ReservationResponse;
import com.backend.smart_parking.user.User;
import com.backend.smart_parking.user.UserRepository;
import com.backend.smart_parking.vehicle.Vehicle;
import com.backend.smart_parking.vehicle.VehicleRepository;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class ReservationService {

    private final ReservationRepository reservationRepository;
    private final UserRepository userRepository;
    private final VehicleRepository vehicleRepository;
    private final GateRepository gateRepository;
    private final ParkingSlotRepository slotRepository;

    public ReservationService(ReservationRepository reservationRepository,
                              UserRepository userRepository,
                              VehicleRepository vehicleRepository,
                              GateRepository gateRepository,
                              ParkingSlotRepository slotRepository) {
        this.reservationRepository = reservationRepository;
        this.userRepository = userRepository;
        this.vehicleRepository = vehicleRepository;
        this.gateRepository = gateRepository;
        this.slotRepository = slotRepository;
    }

    public ReservationResponse createReservation(UUID userId, CreateReservationRequest req) {
        if (reservationRepository.existsByUserIdAndStatus(userId, ReservationStatus.ACTIVE) ||
                reservationRepository.existsByUserIdAndStatus(userId, ReservationStatus.PENDING)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "You already have a pending or active reservation");
        }

        if (reservationRepository.existsBySpotIdAndStatusIn(req.getSpotId(),
                List.of(ReservationStatus.PENDING, ReservationStatus.ACTIVE))) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Spot is already reserved");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        Vehicle vehicle = vehicleRepository.findById(req.getVehicleId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Vehicle not found"));
        Gate gate = gateRepository.findById(req.getGateId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Gate not found"));
        ParkingSlot spot = slotRepository.findById(req.getSpotId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Spot not found"));

        if (spot.getStatus() != SlotStatus.AVAILABLE) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Spot is not available");
        }

        Reservation reservation = new Reservation();
        reservation.setUser(user);
        reservation.setVehicle(vehicle);
        reservation.setGate(gate);
        reservation.setSpot(spot);
        reservation.setStartTime(req.getStartTime());
        reservation.setEndTime(req.getEndTime());
        reservation.setStatus(ReservationStatus.PENDING);

        spot.setStatus(SlotStatus.RESERVED);
        slotRepository.save(spot);

        return toResponse(reservationRepository.save(reservation));
    }

    public ReservationResponse activateReservation(UUID reservationId, UUID userId) {
        Reservation reservation = findAndValidateOwnership(reservationId, userId);

        if (reservation.getStatus() != ReservationStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Only PENDING reservations can be activated");
        }

        reservation.setStatus(ReservationStatus.ACTIVE);
        reservation.setEnteredAt(Instant.now());
        reservation.getSpot().setStatus(SlotStatus.OCCUPIED);
        slotRepository.save(reservation.getSpot());

        return toResponse(reservationRepository.save(reservation));
    }

    public ReservationResponse completeReservation(UUID reservationId, UUID userId) {
        Reservation reservation = findAndValidateOwnership(reservationId, userId);

        if (reservation.getStatus() != ReservationStatus.ACTIVE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Only ACTIVE reservations can be completed");
        }

        reservation.setStatus(ReservationStatus.COMPLETED);
        reservation.setExitedAt(Instant.now());
        reservation.getSpot().setStatus(SlotStatus.AVAILABLE);
        slotRepository.save(reservation.getSpot());

        return toResponse(reservationRepository.save(reservation));
    }

    public ReservationResponse cancelReservation(UUID reservationId, UUID userId) {
        Reservation reservation = findAndValidateOwnership(reservationId, userId);

        if (reservation.getStatus() != ReservationStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Only PENDING reservations can be cancelled");
        }

        reservation.setStatus(ReservationStatus.CANCELLED);
        reservation.getSpot().setStatus(SlotStatus.AVAILABLE);
        slotRepository.save(reservation.getSpot());

        return toResponse(reservationRepository.save(reservation));
    }

    @Transactional(readOnly = true)
    public ActiveSessionResponse getActiveSession(UUID userId) {
        return reservationRepository.findByUserIdAndStatus(userId, ReservationStatus.ACTIVE)
                .map(r -> {
                    long elapsed = Duration.between(r.getEnteredAt(), Instant.now()).toMinutes();
                    return new ActiveSessionResponse(toResponse(r), elapsed);
                })
                .orElse(null);
    }

    @Transactional(readOnly = true)
    public List<ReservationResponse> getUserHistory(UUID userId) {
        return reservationRepository.findAllByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Scheduled(fixedRate = 60_000)
    public void expireStalePendingReservations() {
        reservationRepository.findAllByStatus(ReservationStatus.PENDING).stream()
                .filter(r -> r.getStartTime().isBefore(Instant.now().minusSeconds(900)))
                .forEach(r -> {
                    r.setStatus(ReservationStatus.EXPIRED);
                    r.getSpot().setStatus(SlotStatus.AVAILABLE);
                    slotRepository.save(r.getSpot());
                    reservationRepository.save(r);
                });
    }

    // ---- helpers ----

    private Reservation findAndValidateOwnership(UUID reservationId, UUID userId) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Reservation not found"));
        if (!reservation.getUser().getId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }
        return reservation;
    }

    private ReservationResponse toResponse(Reservation r) {
        String lotName = r.getGate().getParkingLot() != null
                ? r.getGate().getParkingLot().getName() : null;
        return new ReservationResponse(
                r.getId(),
                r.getUser().getId(),
                r.getVehicle().getId(),
                r.getVehicle().getPlateNumber(),
                r.getGate().getId(),
                r.getGate().getName(),
                r.getSpot().getId(),
                r.getSpot().getSlotLabel(),
                lotName,
                r.getStartTime(),
                r.getEndTime(),
                r.getStatus(),
                r.getEnteredAt(),
                r.getExitedAt(),
                r.getCreatedAt()
        );
    }
}
