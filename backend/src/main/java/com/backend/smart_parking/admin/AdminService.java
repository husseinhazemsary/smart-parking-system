package com.backend.smart_parking.admin;

import com.backend.smart_parking.admin.dto.*;
import com.backend.smart_parking.parking.ParkingSlot;
import com.backend.smart_parking.parking.ParkingSlotRepository;
import com.backend.smart_parking.reservation.Reservation;
import com.backend.smart_parking.reservation.ReservationRepository;
import com.backend.smart_parking.reservation.ReservationStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.Instant;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class AdminService {

    private final ReservationRepository reservationRepository;
    private final ParkingSlotRepository slotRepository;

    public AdminService(ReservationRepository reservationRepository,
                        ParkingSlotRepository slotRepository) {
        this.reservationRepository = reservationRepository;
        this.slotRepository = slotRepository;
    }

    public ReservationStatsResponse getReservationStats() {
        BigDecimal totalRevenue = reservationRepository
                .findAllByStatus(ReservationStatus.COMPLETED)
                .stream()
                .map(this::calculateAmount)
                .filter(a -> a != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        return new ReservationStatsResponse(totalRevenue);
    }

    public SessionStatsResponse getSessionStats() {
        long active    = reservationRepository.countByStatus(ReservationStatus.ACTIVE);
        long completed = reservationRepository.countByStatus(ReservationStatus.COMPLETED);
        return new SessionStatsResponse(active, completed);
    }

    public List<AdminSessionResponse> getRecentSessions(int hours) {
        Instant since = Instant.now().minusSeconds((long) hours * 3600);
        return reservationRepository
                .findByEnteredAtAfterOrderByEnteredAtDesc(since)
                .stream()
                .map(this::toSessionResponse)
                .toList();
    }

    public List<AdminReservationResponse> getAllReservations() {
        return reservationRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::toReservationResponse)
                .toList();
    }

    public List<AdminSessionResponse> getAllSessions() {
        return reservationRepository
                .findAllByStatusInOrderByCreatedAtDesc(
                        List.of(ReservationStatus.ACTIVE, ReservationStatus.COMPLETED))
                .stream()
                .map(this::toSessionResponse)
                .toList();
    }

    public List<AdminSlotResponse> getAllSlots() {
        return slotRepository.findAll()
                .stream()
                .map(this::toSlotResponse)
                .toList();
    }

    private AdminReservationResponse toReservationResponse(Reservation r) {
        return new AdminReservationResponse(
                r.getId(),
                r.getSpot().getSlotLabel(),
                r.getUser().getFullName(),
                r.getStartTime(),
                r.getEndTime(),
                r.getStatus().name(),
                calculateAmount(r)
        );
    }

    private AdminSessionResponse toSessionResponse(Reservation r) {
        Long duration = null;
        if (r.getEnteredAt() != null && r.getExitedAt() != null) {
            duration = Duration.between(r.getEnteredAt(), r.getExitedAt()).toMinutes();
        } else if (r.getEnteredAt() != null) {
            duration = Duration.between(r.getEnteredAt(), Instant.now()).toMinutes();
        }
        return new AdminSessionResponse(
                r.getId(),
                r.getSpot().getSlotLabel(),
                r.getUser().getFullName(),
                r.getUser().getEmail(),
                r.getEnteredAt(),
                r.getExitedAt(),
                duration,
                calculateAmount(r),
                r.getStatus().name()
        );
    }

    private AdminSlotResponse toSlotResponse(ParkingSlot slot) {
        String label = slot.getSlotLabel();
        String floor = (label != null && !label.isEmpty()) ? label.substring(0, 1) : null;
        return new AdminSlotResponse(
                slot.getId(),
                label,
                slot.getStatus().name(),
                slot.getSlotType().name(),
                slot.getParkingLot().getHourlyRate(),
                floor
        );
    }

    private BigDecimal calculateAmount(Reservation r) {
        if (r.getEnteredAt() == null || r.getExitedAt() == null) return null;
        long minutes = Duration.between(r.getEnteredAt(), r.getExitedAt()).toMinutes();
        BigDecimal hours = BigDecimal.valueOf(minutes)
                .divide(BigDecimal.valueOf(60), 4, RoundingMode.HALF_UP);
        return hours.multiply(r.getGate().getParkingLot().getHourlyRate())
                .setScale(2, RoundingMode.HALF_UP);
    }
}
