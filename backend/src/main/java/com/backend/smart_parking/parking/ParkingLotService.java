package com.backend.smart_parking.parking;

import com.backend.smart_parking.parking.dto.*;
import com.backend.smart_parking.user.User;
import com.backend.smart_parking.parking.GateRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class ParkingLotService {

    private final ParkingLotRepository parkingLotRepository;
    private final ParkingSlotRepository parkingSlotRepository;
    private final ParkingSubscriptionPlanRepository subscriptionPlanRepository;
    private final ParkingReportRepository reportRepository;
    private final ParkingAlertRepository alertRepository;
    private final GateRepository gateRepository;

    @Value("${app.share.base-url:https://ezrakna.app/lots}")
    private String shareBaseUrl;

    public ParkingLotService(ParkingLotRepository parkingLotRepository,
                              ParkingSlotRepository parkingSlotRepository,
                              ParkingSubscriptionPlanRepository subscriptionPlanRepository,
                              ParkingReportRepository reportRepository,
                              ParkingAlertRepository alertRepository,
                              GateRepository gateRepository) {
        this.parkingLotRepository = parkingLotRepository;
        this.parkingSlotRepository = parkingSlotRepository;
        this.subscriptionPlanRepository = subscriptionPlanRepository;
        this.reportRepository = reportRepository;
        this.alertRepository = alertRepository;
        this.gateRepository = gateRepository;
    }

    public List<ParkingLotSummaryResponse> getAllLots(Double lat, Double lng) {
        return parkingLotRepository.findAll().stream()
                .map(lot -> toSummary(lot, lat, lng))
                .sorted((a, b) -> {
                    if (a.distanceKm() == null && b.distanceKm() == null) return 0;
                    if (a.distanceKm() == null) return 1;
                    if (b.distanceKm() == null) return -1;
                    return Double.compare(a.distanceKm(), b.distanceKm());
                })
                .toList();
    }

    public ParkingLotDetailResponse getLotDetail(UUID id) {
        ParkingLot lot = findLotOrThrow(id);
        int total = parkingSlotRepository.countByParkingLotId(id);
        int available = parkingSlotRepository.countByParkingLotIdAndStatus(id, SlotStatus.AVAILABLE);
        return new ParkingLotDetailResponse(
                lot.getId(),
                lot.getName(),
                lot.getNameAr(),
                lot.getAddress(),
                lot.getAddressAr(),
                lot.getPhoneNumber(),
                lot.getLatitude(),
                lot.getLongitude(),
                lot.getHourlyRate(),
                lot.getOpeningTime(),
                lot.getClosingTime(),
                lot.getAmenities(),
                lot.getOperatingDays(),
                lot.getNumberOfGates(),
                available,
                total,
                lot.getImageUrl(),
                lot.isHasSubscriptions(),
                lot.getCategory()
        );
    }

    public List<SlotResponse> getSlots(UUID id) {
        ParkingLot lot = findLotOrThrow(id);
        return parkingSlotRepository.findAllByParkingLotOrderBySlotLabel(lot).stream()
                .map(s -> new SlotResponse(s.getId(), s.getSlotLabel(), s.getSlotType(), s.getStatus()))
                .toList();
    }

    public AvailabilityResponse getAvailability(UUID id) {
        findLotOrThrow(id);
        int total = parkingSlotRepository.countByParkingLotId(id);
        int available = parkingSlotRepository.countByParkingLotIdAndStatus(id, SlotStatus.AVAILABLE);
        return new AvailabilityResponse(available, total);
    }

    public List<GateResponse> getGates(UUID id) {
        findLotOrThrow(id);
        return gateRepository.findAllByParkingLotIdAndIsActiveTrue(id).stream()
                .map(g -> new GateResponse(g.getId(), g.getName()))
                .toList();
    }

    public ShareResponse getShareLink(UUID id) {
        findLotOrThrow(id);
        return new ShareResponse(shareBaseUrl + "/" + id);
    }

    public List<SubscriptionPlanResponse> getSubscriptionPlans(UUID id) {
        findLotOrThrow(id);
        return subscriptionPlanRepository.findAllByParkingLotIdOrderByDurationDaysAsc(id).stream()
                .map(p -> new SubscriptionPlanResponse(
                        p.getId(),
                        p.getName(),
                        p.getDurationDays(),
                        p.getPrice(),
                        p.getDescription()))
                .toList();
    }

    public AlertResponse getActiveAlert(UUID lotId, User user) {
        findLotOrThrow(lotId);
        return alertRepository.findByUserIdAndParkingLotIdAndActiveTrue(user.getId(), lotId)
                .map(ParkingLotService::toAlertResponse)
                .orElse(null);
    }

    @Transactional
    public void submitReport(UUID lotId, ReportRequest request, User user) {
        ParkingLot lot = findLotOrThrow(lotId);
        ParkingReport report = new ParkingReport();
        report.setParkingLot(lot);
        report.setUser(user);
        report.setReason(request.reason());
        report.setNote(request.note());
        reportRepository.save(report);
    }

    @Transactional
    public AlertResponse saveAlert(UUID lotId, AlertRequest request, User user) {
        ParkingLot lot = findLotOrThrow(lotId);
        alertRepository.findAllByUserIdAndParkingLotIdAndActiveTrue(user.getId(), lotId)
                .forEach(existing -> {
                    existing.setActive(false);
                    alertRepository.save(existing);
                });
        ParkingAlert alert = new ParkingAlert();
        alert.setUser(user);
        alert.setParkingLot(lot);
        alert.setTriggerCondition(request.triggerCondition());
        alert.setMinSpots(request.minSpots());
        alert.setCheckDurationMinutes(request.checkDurationMinutes());
        alert.setExpiresInMinutes(request.expiresInMinutes());
        alert.setQuietHours(request.quietHours());
        alert.setPushNotification(request.pushNotification());
        alert.setSound(request.sound());
        alert.setVibrate(request.vibrate());
        ParkingAlert saved = alertRepository.save(alert);
        return toAlertResponse(saved);
    }

    @Transactional
    public GateResponse addGate(UUID lotId, CreateGateRequest req) {
        ParkingLot lot = findLotOrThrow(lotId);
        Gate gate = new Gate();
        gate.setName(req.name());
        gate.setLocation(req.location());
        gate.setActive(true);
        gate.setParkingLot(lot);
        Gate saved = gateRepository.save(gate);
        return new GateResponse(saved.getId(), saved.getName());
    }

    @Transactional
    public void removeGate(UUID lotId, UUID gateId) {
        findLotOrThrow(lotId);
        Gate gate = gateRepository.findById(gateId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Gate not found"));
        gate.setActive(false);
        gateRepository.save(gate);
    }

    @Transactional
    public ParkingLotDetailResponse updateLot(UUID id, CreateParkingLotRequest req) {
        ParkingLot lot = findLotOrThrow(id);
        lot.setName(req.name());
        lot.setNameAr(req.nameAr());
        lot.setAddress(req.address());
        lot.setAddressAr(req.addressAr());
        lot.setPhoneNumber(req.phoneNumber());
        lot.setLatitude(req.latitude());
        lot.setLongitude(req.longitude());
        lot.setHourlyRate(req.hourlyRate());
        lot.setOpeningTime(req.openingTime());
        lot.setClosingTime(req.closingTime());
        lot.setNumberOfGates(req.numberOfGates() > 0 ? req.numberOfGates() : 1);
        lot.setImageUrl(req.imageUrl());
        lot.setHasSubscriptions(req.hasSubscriptions());
        if (req.amenities() != null) lot.setAmenities(req.amenities());
        if (req.operatingDays() != null) lot.setOperatingDays(req.operatingDays());
        if (req.category() != null) lot.setCategory(req.category());
        parkingLotRepository.save(lot);
        return getLotDetail(id);
    }

    @Transactional
    public ParkingLotDetailResponse createLot(CreateParkingLotRequest req) {
        ParkingLot lot = new ParkingLot();
        lot.setName(req.name());
        lot.setNameAr(req.nameAr());
        lot.setAddress(req.address());
        lot.setAddressAr(req.addressAr());
        lot.setPhoneNumber(req.phoneNumber());
        lot.setLatitude(req.latitude());
        lot.setLongitude(req.longitude());
        lot.setHourlyRate(req.hourlyRate());
        lot.setOpeningTime(req.openingTime());
        lot.setClosingTime(req.closingTime());
        lot.setNumberOfGates(req.numberOfGates() > 0 ? req.numberOfGates() : 1);
        lot.setImageUrl(req.imageUrl());
        lot.setHasSubscriptions(req.hasSubscriptions());
        lot.setAmenities(req.amenities() != null ? req.amenities() : new java.util.ArrayList<>());
        lot.setOperatingDays(req.operatingDays() != null ? req.operatingDays() : new java.util.ArrayList<>(java.util.List.of(java.time.DayOfWeek.values())));
        lot.setCategory(req.category() != null ? req.category() : LotCategory.OTHER);
        ParkingLot saved = parkingLotRepository.save(lot);
        return getLotDetail(saved.getId());
    }

    // ---- helpers ----

    private ParkingLot findLotOrThrow(UUID id) {
        return parkingLotRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Parking lot not found"));
    }

    private ParkingLotSummaryResponse toSummary(ParkingLot lot, Double lat, Double lng) {
        int total = parkingSlotRepository.countByParkingLotId(lot.getId());
        int available = parkingSlotRepository.countByParkingLotIdAndStatus(lot.getId(), SlotStatus.AVAILABLE);
        Double distance = (lat != null && lng != null)
                ? haversineKm(lat, lng, lot.getLatitude(), lot.getLongitude())
                : null;
        return new ParkingLotSummaryResponse(
                lot.getId(),
                lot.getName(),
                lot.getNameAr(),
                lot.getAddress(),
                lot.getAddressAr(),
                distance,
                available,
                total,
                lot.getHourlyRate(),
                lot.getOpeningTime(),
                lot.getClosingTime(),
                lot.getImageUrl(),
                lot.getCategory()
        );
    }

    private static AlertResponse toAlertResponse(ParkingAlert a) {
        return new AlertResponse(
                a.getId(), a.getTriggerCondition(), a.getMinSpots(),
                a.getCheckDurationMinutes(), a.getExpiresInMinutes(),
                a.isQuietHours(), a.isPushNotification(), a.isSound(),
                a.isVibrate(), a.isActive(), a.getCreatedAt());
    }

    private static double haversineKm(double lat1, double lon1, double lat2, double lon2) {
        final double R = 6371.0;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }
}
