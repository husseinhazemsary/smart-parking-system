package com.backend.smart_parking.user;

import com.backend.smart_parking.email.EmailService;
import com.backend.smart_parking.exception.AuthException;
import com.backend.smart_parking.user.dto.*;
import com.backend.smart_parking.verification.TokenType;
import com.backend.smart_parking.verification.VerificationService;
import com.backend.smart_parking.verification.VerificationToken;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final VerificationService verificationService;
    private final EmailService emailService;

    public UserService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       VerificationService verificationService,
                       EmailService emailService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.verificationService = verificationService;
        this.emailService = emailService;
    }

    @Transactional(readOnly = true)
    public UserProfileResponse getProfile(User user) {
        return toResponse(user);
    }

    public UserProfileResponse updateProfile(User user, UpdateProfileRequest request) {
        user.setFullName(request.fullName());
        user.setPhoneNumber(request.phoneNumber());
        user.setDateOfBirth(request.dateOfBirth());
        userRepository.save(user);
        return toResponse(user);
    }

    public void changePassword(User user, ChangePasswordRequest request) {
        if (user.getProvider() != AuthProvider.LOCAL) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Password change is not available for social login accounts");
        }
        if (!passwordEncoder.matches(request.currentPassword(), user.getPassword())) {
            throw new AuthException("Current password is incorrect");
        }
        user.setPassword(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
    }

    public void requestEmailChange(User user, EmailChangeRequest request) {
        String newEmail = request.newEmail().trim().toLowerCase();
        if (userRepository.existsByEmailIgnoreCase(newEmail)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "That email address is already in use.");
        }

        String code = verificationService.createCode(user, TokenType.EMAIL_CHANGE, newEmail);
        emailService.sendEmailChangeVerification(newEmail, user.getFullName(), code);
    }

    public void verifyEmailChange(User user, String code) {
        VerificationToken vt = verificationService.consumeCode(user.getId(), TokenType.EMAIL_CHANGE, code);
        String newEmail = vt.getNewEmail();

        if (newEmail == null || newEmail.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid email change code.");
        }
        if (userRepository.existsByEmailIgnoreCase(newEmail)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "That email address is already in use.");
        }

        user.setEmail(newEmail);
        userRepository.save(user);
    }

    private UserProfileResponse toResponse(User user) {
        List<UUID> ids = user.getAssignedLots().stream()
                .map(com.backend.smart_parking.parking.ParkingLot::getId).toList();
        List<String> names = user.getAssignedLots().stream()
                .map(com.backend.smart_parking.parking.ParkingLot::getName).toList();
        return new UserProfileResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getPhoneNumber(),
                user.getDateOfBirth(),
                user.getProvider(),
                user.getCreatedAt(),
                user.getRole(),
                ids,
                names
        );
    }
}
