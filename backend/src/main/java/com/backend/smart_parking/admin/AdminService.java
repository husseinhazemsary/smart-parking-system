package com.backend.smart_parking.admin;

import com.backend.smart_parking.admin.dto.*;
import com.backend.smart_parking.email.EmailService;
import com.backend.smart_parking.invitation.AdminInvitation;
import com.backend.smart_parking.invitation.AdminInvitationRepository;
import com.backend.smart_parking.parking.*;
import com.backend.smart_parking.parking.dto.CreateParkingLotRequest;
import com.backend.smart_parking.parking.dto.ParkingLotDetailResponse;
import com.backend.smart_parking.reservation.Reservation;
import com.backend.smart_parking.reservation.ReservationRepository;
import com.backend.smart_parking.reservation.ReservationStatus;
import com.backend.smart_parking.token.RefreshTokenRepository;
import com.backend.smart_parking.user.Role;
import com.backend.smart_parking.user.User;
import com.backend.smart_parking.user.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class AdminService {

    private final ReservationRepository reservationRepository;
    private final ParkingSlotRepository slotRepository;
    private final UserRepository userRepository;
    private final ParkingLotRepository parkingLotRepository;
    private final PasswordEncoder passwordEncoder;
    private final AdminInvitationRepository invitationRepository;
    private final EmailService emailService;
    private final RefreshTokenRepository refreshTokenRepository;
    private final String invitationBaseUrl;

    public AdminService(ReservationRepository reservationRepository,
                        ParkingSlotRepository slotRepository,
                        UserRepository userRepository,
                        ParkingLotRepository parkingLotRepository,
                        PasswordEncoder passwordEncoder,
                        AdminInvitationRepository invitationRepository,
                        EmailService emailService,
                        RefreshTokenRepository refreshTokenRepository,
                        @Value("${app.invitation.base-url:http://localhost:5174}") String invitationBaseUrl) {
        this.reservationRepository = reservationRepository;
        this.slotRepository = slotRepository;
        this.userRepository = userRepository;
        this.parkingLotRepository = parkingLotRepository;
        this.passwordEncoder = passwordEncoder;
        this.invitationRepository = invitationRepository;
        this.emailService = emailService;
        this.refreshTokenRepository = refreshTokenRepository;
        this.invitationBaseUrl = invitationBaseUrl;
    }

    public List<LotAdminResponse> getLotAdmins() {
        return userRepository.findAllByRole(Role.ROLE_LOT_ADMIN).stream()
                .map(this::toLotAdminResponse)
                .toList();
    }

    @Transactional
    public void deleteLotAdmin(UUID id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lot admin not found"));
        if (user.getRole() != Role.ROLE_LOT_ADMIN)
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cannot delete non-lot-admin users");
        refreshTokenRepository.deleteByUser(user);
        userRepository.delete(user);
    }

    public List<PendingInvitationResponse> getPendingInvitations() {
        return invitationRepository.findByUsedFalseAndExpiresAtAfter(Instant.now()).stream()
                .map(this::toPendingInvitationResponse)
                .toList();
    }

    public List<PendingInvitationResponse> getExpiredInvitations() {
        return invitationRepository.findByUsedFalseAndExpiresAtBefore(Instant.now()).stream()
                .map(this::toPendingInvitationResponse)
                .toList();
    }

    @Transactional
    public void revokeInvitation(UUID id) {
        AdminInvitation inv = invitationRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Invitation not found"));
        invitationRepository.delete(inv);
    }

    @Transactional
    public void resendInvitation(UUID id) {
        AdminInvitation inv = invitationRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Invitation not found"));
        inv.setToken(UUID.randomUUID());
        inv.setExpiresAt(Instant.now().plus(Duration.ofHours(48)));
        invitationRepository.save(inv);
        String setupUrl = invitationBaseUrl + "/setup-password?token=" + inv.getToken();
        List<String> lotNames = parkingLotRepository.findAllById(inv.getAssignedLotIds())
                .stream().map(ParkingLot::getName).toList();
        emailService.sendInvitationEmail(inv.getEmail(), inv.getFullName(), setupUrl, lotNames);
    }

    @Transactional
    public void createLotAdmin(CreateLotAdminRequest req) {
        if (userRepository.existsByEmailIgnoreCase(req.email()))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already in use");
        if (invitationRepository.existsByEmail(req.email()))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "An invitation is already pending for this email");
        List<ParkingLot> lots = parkingLotRepository.findAllById(req.assignedLotIds());
        if (lots.isEmpty())
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No valid parking lots found");

        AdminInvitation invitation = new AdminInvitation();
        invitation.setEmail(req.email());
        invitation.setFullName(req.fullName());
        invitation.setPhoneNumber(req.phoneNumber());
        invitation.setToken(UUID.randomUUID());
        invitation.setExpiresAt(Instant.now().plus(Duration.ofHours(48)));
        invitation.setAssignedLotIds(lots.stream().map(ParkingLot::getId).toList());
        invitationRepository.save(invitation);

        String setupUrl = invitationBaseUrl + "/setup-password?token=" + invitation.getToken();
        List<String> lotNames = lots.stream().map(ParkingLot::getName).toList();
        emailService.sendInvitationEmail(req.email(), req.fullName(), setupUrl, lotNames);
    }

    @Transactional
    public LotAdminResponse updateLotAdmin(UUID id, UpdateLotAdminRequest req) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lot admin not found"));
        if (!user.getEmail().equals(req.email()) && userRepository.existsByEmailIgnoreCase(req.email()))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already in use");
        List<ParkingLot> lots = parkingLotRepository.findAllById(req.assignedLotIds());
        if (lots.isEmpty())
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No valid parking lots found");
        user.setFullName(req.fullName());
        user.setEmail(req.email());
        user.setPhoneNumber(req.phoneNumber() != null && !req.phoneNumber().isBlank() ? req.phoneNumber() : null);
        user.setAssignedLots(lots);
        if (req.password() != null && !req.password().isBlank())
            user.setPassword(passwordEncoder.encode(req.password()));
        return toLotAdminResponse(userRepository.save(user));
    }

    public List<ParkingLotDetailResponse> getMyLots(User caller) {
        return caller.getAssignedLots().stream()
                .map(this::toLotDetailResponse)
                .toList();
    }

    @Transactional
    public ParkingLotDetailResponse updateMyLot(UUID lotId, CreateParkingLotRequest req, User caller) {
        boolean isAssigned = caller.getAssignedLots().stream().anyMatch(l -> l.getId().equals(lotId));
        if (!isAssigned)
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not assigned to this lot");
        ParkingLot lot = parkingLotRepository.findById(lotId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Parking lot not found"));
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
        return toLotDetailResponse(parkingLotRepository.save(lot));
    }

    public ReservationStatsResponse getReservationStats(User caller) {
        BigDecimal totalRevenue = getReservationsForCaller(caller, ReservationStatus.COMPLETED)
                .stream()
                .map(this::calculateAmount)
                .filter(a -> a != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        return new ReservationStatsResponse(totalRevenue);
    }

    public SessionStatsResponse getSessionStats(User caller) {
        List<Reservation> active    = getReservationsForCaller(caller, ReservationStatus.ACTIVE);
        List<Reservation> completed = getReservationsForCaller(caller, ReservationStatus.COMPLETED);
        return new SessionStatsResponse(active.size(), completed.size());
    }

    public List<AdminSessionResponse> getRecentSessions(int hours, User caller) {
        Instant since = Instant.now().minusSeconds((long) hours * 3600);
        List<Reservation> reservations = isLotAdmin(caller)
                ? reservationRepository.findByEnteredAtAfterAndGate_ParkingLot_IdInOrderByEnteredAtDesc(since, getAssignedLotIds(caller))
                : reservationRepository.findByEnteredAtAfterOrderByEnteredAtDesc(since);
        return reservations.stream().map(this::toSessionResponse).toList();
    }

    public List<AdminReservationResponse> getAllReservations(User caller) {
        List<Reservation> reservations = isLotAdmin(caller)
                ? reservationRepository.findAllByGate_ParkingLot_IdInOrderByCreatedAtDesc(getAssignedLotIds(caller))
                : reservationRepository.findAllByOrderByCreatedAtDesc();
        return reservations.stream().map(this::toReservationResponse).toList();
    }

    public List<AdminSessionResponse> getAllSessions(User caller) {
        List<ReservationStatus> statuses = List.of(ReservationStatus.ACTIVE, ReservationStatus.COMPLETED);
        List<Reservation> reservations = isLotAdmin(caller)
                ? reservationRepository.findAllByStatusInAndGate_ParkingLot_IdInOrderByCreatedAtDesc(statuses, getAssignedLotIds(caller))
                : reservationRepository.findAllByStatusInOrderByCreatedAtDesc(statuses);
        return reservations.stream().map(this::toSessionResponse).toList();
    }

    public List<AdminSlotResponse> getAllSlots(User caller) {
        List<ParkingSlot> slots = isLotAdmin(caller)
                ? slotRepository.findAllByParkingLotIdInOrderBySlotLabel(getAssignedLotIds(caller))
                : slotRepository.findAll();
        return slots.stream().map(this::toSlotResponse).toList();
    }

    // ---- helpers ----

    private boolean isLotAdmin(User user) {
        return user.getRole() == Role.ROLE_LOT_ADMIN;
    }

    private List<UUID> getAssignedLotIds(User user) {
        return user.getAssignedLots().stream().map(ParkingLot::getId).toList();
    }

    private LotAdminResponse toLotAdminResponse(User u) {
        List<UUID> ids   = u.getAssignedLots().stream().map(ParkingLot::getId).toList();
        List<String> names = u.getAssignedLots().stream().map(ParkingLot::getName).toList();
        return new LotAdminResponse(u.getId(), u.getFullName(), u.getEmail(), u.getPhoneNumber(), ids, names);
    }

    private PendingInvitationResponse toPendingInvitationResponse(AdminInvitation inv) {
        List<ParkingLot> lots = parkingLotRepository.findAllById(inv.getAssignedLotIds());
        List<UUID>   ids   = lots.stream().map(ParkingLot::getId).toList();
        List<String> names = lots.stream().map(ParkingLot::getName).toList();
        return new PendingInvitationResponse(
                inv.getId(), inv.getEmail(), inv.getFullName(), inv.getPhoneNumber(),
                inv.getExpiresAt(), ids, names);
    }

    private ParkingLotDetailResponse toLotDetailResponse(ParkingLot lot) {
        int total     = slotRepository.countByParkingLotId(lot.getId());
        int available = slotRepository.countByParkingLotIdAndStatus(lot.getId(), SlotStatus.AVAILABLE);
        return new ParkingLotDetailResponse(
                lot.getId(), lot.getName(), lot.getNameAr(), lot.getAddress(), lot.getAddressAr(),
                lot.getPhoneNumber(), lot.getLatitude(), lot.getLongitude(), lot.getHourlyRate(),
                lot.getOpeningTime(), lot.getClosingTime(), lot.getAmenities(), lot.getOperatingDays(),
                lot.getNumberOfGates(), available, total, lot.getImageUrl(), lot.isHasSubscriptions(),
                lot.getCategory());
    }

    private List<Reservation> getReservationsForCaller(User caller, ReservationStatus status) {
        if (isLotAdmin(caller)) {
            return reservationRepository.findAllByGate_ParkingLot_IdInOrderByCreatedAtDesc(getAssignedLotIds(caller))
                    .stream().filter(r -> r.getStatus() == status).toList();
        }
        return reservationRepository.findAllByStatus(status);
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
