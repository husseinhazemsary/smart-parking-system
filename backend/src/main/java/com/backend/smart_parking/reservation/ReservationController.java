package com.backend.smart_parking.reservation;

import com.backend.smart_parking.reservation.dto.ActiveSessionResponse;
import com.backend.smart_parking.reservation.dto.CreateReservationRequest;
import com.backend.smart_parking.reservation.dto.ReservationResponse;
import com.backend.smart_parking.user.User;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/reservations")
public class ReservationController {

    private final ReservationService reservationService;

    public ReservationController(ReservationService reservationService) {
        this.reservationService = reservationService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ReservationResponse create(@AuthenticationPrincipal User user,
                                      @Valid @RequestBody CreateReservationRequest request) {
        return reservationService.createReservation(user.getId(), request);
    }

    @PostMapping("/{id}/activate")
    public ReservationResponse activate(@AuthenticationPrincipal User user,
                                        @PathVariable UUID id) {
        return reservationService.activateReservation(id, user.getId());
    }

    @PostMapping("/{id}/complete")
    public ReservationResponse complete(@AuthenticationPrincipal User user,
                                        @PathVariable UUID id) {
        return reservationService.completeReservation(id, user.getId());
    }

    @DeleteMapping("/{id}")
    public ReservationResponse cancel(@AuthenticationPrincipal User user,
                                      @PathVariable UUID id) {
        return reservationService.cancelReservation(id, user.getId());
    }

    @GetMapping("/current")
    public ResponseEntity<ReservationResponse> getCurrentSession(@AuthenticationPrincipal User user) {
        ReservationResponse session = reservationService.getCurrentSession(user.getId());
        return session != null ? ResponseEntity.ok(session) : ResponseEntity.noContent().build();
    }

    @GetMapping("/active")
    public ResponseEntity<ActiveSessionResponse> getActiveSession(@AuthenticationPrincipal User user) {
        ActiveSessionResponse session = reservationService.getActiveSession(user.getId());
        return session != null ? ResponseEntity.ok(session) : ResponseEntity.noContent().build();
    }

    @GetMapping("/history")
    public List<ReservationResponse> getHistory(@AuthenticationPrincipal User user) {
        return reservationService.getUserHistory(user.getId());
    }
}
