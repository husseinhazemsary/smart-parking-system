package com.backend.smart_parking.auth;

import com.backend.smart_parking.auth.dto.*;
import com.backend.smart_parking.invitation.InvitationService;
import com.backend.smart_parking.invitation.dto.AcceptInvitationRequest;
import com.backend.smart_parking.invitation.dto.InvitationInfoResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

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
    public RegisterResponse register(@Valid @RequestBody RegisterRequest request) {
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

    @PostMapping("/verify-email")
    public AuthResponse verifyEmail(@Valid @RequestBody VerifyEmailRequest request) {
        return authService.verifyEmail(request);
    }

    @PostMapping("/resend-verification")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void resendVerification(@Valid @RequestBody ResendVerificationRequest request) {
        authService.resendVerification(request);
    }

    @PostMapping("/forgot-password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.forgotPassword(request);
    }

    @PostMapping("/reset-password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
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
