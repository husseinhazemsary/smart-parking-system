package com.backend.smart_parking.auth;

import com.backend.smart_parking.auth.dto.*;
import com.backend.smart_parking.invitation.InvitationService;
import com.backend.smart_parking.invitation.dto.AcceptInvitationRequest;
import com.backend.smart_parking.invitation.dto.InvitationInfoResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import com.backend.smart_parking.user.User;

import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final InvitationService invitationService;

    public AuthController(AuthService authService, InvitationService invitationService) {
        this.authService = authService;
        this.invitationService = invitationService;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse register(@Valid @RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout(@Valid @RequestBody LogoutRequest request) {
        authService.logout(request);
    }

    @PostMapping("/refresh")
    public AuthResponse refresh(@Valid @RequestBody RefreshTokenRequest request) {
        return authService.refresh(request);
    }

    @PostMapping("/oauth/google")
    public AuthResponse loginWithGoogle(@Valid @RequestBody OAuthRequest request) {
        return authService.loginWithGoogle(request);
    }

    @PostMapping("/oauth/apple")
    public AuthResponse loginWithApple(@Valid @RequestBody OAuthRequest request) {
        return authService.loginWithApple(request);
    }

    @PostMapping("/forgot-password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        // TODO: send reset email via email service
        // Returns 204 regardless of whether the email exists to avoid user enumeration
    }

    @GetMapping("/invitation")
    public InvitationInfoResponse getInvitation(@RequestParam UUID token) {
        return invitationService.getInvitationInfo(token);
    }

    @PostMapping("/invitation")
    public AuthResponse acceptInvitation(@Valid @RequestBody AcceptInvitationRequest request) {
        return invitationService.acceptInvitation(request);
    }
}
