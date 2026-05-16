package com.backend.smart_parking.admin;

import com.backend.smart_parking.admin.dto.*;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/reservations/stats")
    public ReservationStatsResponse reservationStats() {
        return adminService.getReservationStats();
    }

    @GetMapping("/sessions/stats")
    public SessionStatsResponse sessionStats() {
        return adminService.getSessionStats();
    }

    @GetMapping("/sessions/recent")
    public List<AdminSessionResponse> recentSessions(
            @RequestParam(defaultValue = "24") int hours) {
        return adminService.getRecentSessions(hours);
    }

    @GetMapping("/reservations")
    public List<AdminReservationResponse> allReservations() {
        return adminService.getAllReservations();
    }

    @GetMapping("/sessions")
    public List<AdminSessionResponse> allSessions() {
        return adminService.getAllSessions();
    }

    @GetMapping("/slots")
    public List<AdminSlotResponse> allSlots() {
        return adminService.getAllSlots();
    }
}
