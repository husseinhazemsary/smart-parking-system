package com.backend.smart_parking.parking;

import com.backend.smart_parking.parking.dto.*;
import com.backend.smart_parking.user.User;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    public ParkingLotDetailResponse create(@Valid @RequestBody CreateParkingLotRequest request) {
        return parkingLotService.createLot(request);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ParkingLotDetailResponse update(@PathVariable UUID id,
                                           @Valid @RequestBody CreateParkingLotRequest request) {
        return parkingLotService.updateLot(id, request);
    }

    @PostMapping("/{id}/gates")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    public GateResponse addGate(@PathVariable UUID id,
                                @Valid @RequestBody CreateGateRequest request) {
        return parkingLotService.addGate(id, request);
    }

    @DeleteMapping("/{lotId}/gates/{gateId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    public void removeGate(@PathVariable UUID lotId, @PathVariable UUID gateId) {
        parkingLotService.removeGate(lotId, gateId);
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

    @GetMapping("/{id}/alerts/active")
    public ResponseEntity<AlertResponse> getActiveAlert(@PathVariable UUID id,
                                                        @AuthenticationPrincipal User user) {
        AlertResponse alert = parkingLotService.getActiveAlert(id, user);
        return alert != null ? ResponseEntity.ok(alert) : ResponseEntity.noContent().build();
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
