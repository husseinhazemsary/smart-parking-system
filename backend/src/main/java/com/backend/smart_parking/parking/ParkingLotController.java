package com.backend.smart_parking.parking;

import com.backend.smart_parking.parking.dto.*;
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
}
