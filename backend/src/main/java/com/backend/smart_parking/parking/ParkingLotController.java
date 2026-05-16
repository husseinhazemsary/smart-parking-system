package com.backend.smart_parking.parking;

import com.backend.smart_parking.parking.dto.*;
import com.backend.smart_parking.user.User;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/parking-lots")
public class ParkingLotController {

    private final ParkingLotService parkingLotService;

    public ParkingLotController(ParkingLotService parkingLotService) {
        this.parkingLotService = parkingLotService;
    }

    @GetMapping
    public List<ParkingLotSummaryResponse> getAll(
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lng) {
        return parkingLotService.getAllLots(lat, lng);
    }

    @GetMapping("/{id}")
    public ParkingLotDetailResponse getDetail(@PathVariable UUID id) {
        return parkingLotService.getLotDetail(id);
    }

    @GetMapping("/{id}/slots")
    public List<SlotResponse> getSlots(@PathVariable UUID id) {
        return parkingLotService.getSlots(id);
    }

    @GetMapping("/{id}/availability")
    public AvailabilityResponse getAvailability(@PathVariable UUID id) {
        return parkingLotService.getAvailability(id);
    }

    @GetMapping("/{id}/gates")
    public List<GateResponse> getGates(@PathVariable UUID id) {
        return parkingLotService.getGates(id);
    }

    @GetMapping("/{id}/share")
    public ShareResponse getShareLink(@PathVariable UUID id) {
        return parkingLotService.getShareLink(id);
    }

    @GetMapping("/{id}/subscriptions")
    public List<SubscriptionPlanResponse> getSubscriptionPlans(@PathVariable UUID id) {
        return parkingLotService.getSubscriptionPlans(id);
    }

    @PostMapping("/{id}/reports")
    @ResponseStatus(HttpStatus.CREATED)
    public void submitReport(@PathVariable UUID id,
                             @Valid @RequestBody ReportRequest request,
                             @AuthenticationPrincipal User user) {
        parkingLotService.submitReport(id, request, user);
    }

    @PostMapping("/{id}/alerts")
    @ResponseStatus(HttpStatus.CREATED)
    public AlertResponse saveAlert(@PathVariable UUID id,
                                   @Valid @RequestBody AlertRequest request,
                                   @AuthenticationPrincipal User user) {
        return parkingLotService.saveAlert(id, request, user);
    }
}
