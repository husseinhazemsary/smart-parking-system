package com.backend.smart_parking.user;

import com.backend.smart_parking.exception.AuthException;
import com.backend.smart_parking.user.dto.ChangePasswordRequest;
import com.backend.smart_parking.user.dto.EmailChangeRequest;
import com.backend.smart_parking.user.dto.UpdateProfileRequest;
import com.backend.smart_parking.user.dto.UserProfileResponse;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
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
        if (userRepository.existsByEmail(request.newEmail())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "That email address is already in use.");
        }
        // TODO: send verification email to request.newEmail() with a signed token
    }

    private UserProfileResponse toResponse(User user) {
        return new UserProfileResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getPhoneNumber(),
                user.getDateOfBirth(),
                user.getProvider(),
                user.getCreatedAt()
        );
    }
}
