package com.backend.smart_parking.invitation;

import com.backend.smart_parking.auth.AuthService;
import com.backend.smart_parking.auth.dto.AuthResponse;
import com.backend.smart_parking.invitation.dto.AcceptInvitationRequest;
import com.backend.smart_parking.invitation.dto.InvitationInfoResponse;
import com.backend.smart_parking.parking.ParkingLot;
import com.backend.smart_parking.parking.ParkingLotRepository;
import com.backend.smart_parking.user.AuthProvider;
import com.backend.smart_parking.user.Role;
import com.backend.smart_parking.user.User;
import com.backend.smart_parking.user.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class InvitationService {

    private final AdminInvitationRepository invitationRepository;
    private final UserRepository userRepository;
    private final ParkingLotRepository parkingLotRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthService authService;

    public InvitationService(AdminInvitationRepository invitationRepository,
                             UserRepository userRepository,
                             ParkingLotRepository parkingLotRepository,
                             PasswordEncoder passwordEncoder,
                             AuthService authService) {
        this.invitationRepository = invitationRepository;
        this.userRepository = userRepository;
        this.parkingLotRepository = parkingLotRepository;
        this.passwordEncoder = passwordEncoder;
        this.authService = authService;
    }

    @Transactional(readOnly = true)
    public InvitationInfoResponse getInvitationInfo(UUID token) {
        AdminInvitation inv = findValidInvitation(token);
        return new InvitationInfoResponse(inv.getEmail(), inv.getFullName());
    }

    @Transactional
    public AuthResponse acceptInvitation(AcceptInvitationRequest req) {
        AdminInvitation inv = findValidInvitation(req.token());

        if (userRepository.existsByEmailIgnoreCase(inv.getEmail()))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "An account with this email already exists");

        List<ParkingLot> lots = parkingLotRepository.findAllById(inv.getAssignedLotIds());

        User user = new User();
        user.setEmail(inv.getEmail());
        user.setFullName(inv.getFullName());
        user.setPhoneNumber(inv.getPhoneNumber());
        user.setPassword(passwordEncoder.encode(req.password()));
        user.setProvider(AuthProvider.LOCAL);
        user.setRole(Role.ROLE_LOT_ADMIN);
        user.setAssignedLots(lots);
        userRepository.save(user);

        inv.setUsed(true);
        invitationRepository.save(inv);

        return authService.buildAuthResponse(user);
    }

    private AdminInvitation findValidInvitation(UUID token) {
        AdminInvitation inv = invitationRepository.findByToken(token)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Invalid invitation link"));
        if (inv.isUsed())
            throw new ResponseStatusException(HttpStatus.GONE, "This invitation has already been used");
        if (inv.getExpiresAt().isBefore(Instant.now()))
            throw new ResponseStatusException(HttpStatus.GONE, "This invitation has expired");
        return inv;
    }
}
