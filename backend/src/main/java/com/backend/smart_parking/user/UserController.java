package com.backend.smart_parking.user;

import com.backend.smart_parking.user.dto.*;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/me")
    public UserProfileResponse getProfile(@AuthenticationPrincipal User currentUser) {
        return userService.getProfile(currentUser);
    }

    @PutMapping("/me")
    public UserProfileResponse updateProfile(@AuthenticationPrincipal User currentUser,
                                             @Valid @RequestBody UpdateProfileRequest request) {
        return userService.updateProfile(currentUser, request);
    }

    @PutMapping("/me/password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void changePassword(@AuthenticationPrincipal User currentUser,
                               @Valid @RequestBody ChangePasswordRequest request) {
        userService.changePassword(currentUser, request);
    }

    @PostMapping("/me/email-change-request")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void requestEmailChange(@AuthenticationPrincipal User currentUser,
                                   @Valid @RequestBody EmailChangeRequest request) {
        userService.requestEmailChange(currentUser, request);
    }

    @PostMapping("/me/verify-email-change")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void verifyEmailChange(@AuthenticationPrincipal User currentUser,
                                  @Valid @RequestBody VerifyEmailChangeRequest request) {
        userService.verifyEmailChange(currentUser, request.code());
    }
}
