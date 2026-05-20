package com.backend.smart_parking.admin;

import com.backend.smart_parking.admin.dto.*;
import com.backend.smart_parking.user.User;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/lot-admins")
    public List<LotAdminResponse> getLotAdmins() {
        return adminService.getLotAdmins();
    }

    @PostMapping("/lot-admins")
    @ResponseStatus(HttpStatus.CREATED)
    public LotAdminResponse createLotAdmin(@Valid @RequestBody CreateLotAdminRequest request) {
        return adminService.createLotAdmin(request);
    }

    @PutMapping("/lot-admins/{id}")
    public LotAdminResponse updateLotAdmin(@PathVariable UUID id,
                                           @Valid @RequestBody UpdateLotAdminRequest request) {
        return adminService.updateLotAdmin(id, request);
    }

    @GetMapping("/reservations/stats")
    public ReservationStatsResponse reservationStats(@AuthenticationPrincipal User user) {
        return adminService.getReservationStats(user);
    }

    @GetMapping("/sessions/stats")
    public SessionStatsResponse sessionStats(@AuthenticationPrincipal User user) {
        return adminService.getSessionStats(user);
    }

    @GetMapping("/sessions/recent")
    public List<AdminSessionResponse> recentSessions(
            @RequestParam(defaultValue = "24") int hours,
            @AuthenticationPrincipal User user) {
        return adminService.getRecentSessions(hours, user);
    }

    @GetMapping("/reservations")
    public List<AdminReservationResponse> allReservations(@AuthenticationPrincipal User user) {
        return adminService.getAllReservations(user);
    }

    @GetMapping("/sessions")
    public List<AdminSessionResponse> allSessions(@AuthenticationPrincipal User user) {
        return adminService.getAllSessions(user);
    }

    @GetMapping("/slots")
    public List<AdminSlotResponse> allSlots(@AuthenticationPrincipal User user) {
        return adminService.getAllSlots(user);
    }
}
