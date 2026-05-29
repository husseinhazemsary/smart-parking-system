package com.backend.smart_parking.auth;

import com.backend.smart_parking.auth.dto.*;
import com.backend.smart_parking.auth.oauth.AppleTokenVerifier;
import com.backend.smart_parking.auth.oauth.GoogleTokenVerifier;
import com.backend.smart_parking.auth.oauth.OAuthUserInfo;
import com.backend.smart_parking.email.EmailService;
import com.backend.smart_parking.exception.AuthException;
import com.backend.smart_parking.token.JwtService;
import com.backend.smart_parking.token.RefreshToken;
import com.backend.smart_parking.token.RefreshTokenRepository;
import com.backend.smart_parking.user.AuthProvider;
import com.backend.smart_parking.user.User;
import com.backend.smart_parking.user.UserRepository;
import com.backend.smart_parking.verification.TokenType;
import com.backend.smart_parking.verification.VerificationService;
import com.backend.smart_parking.verification.VerificationToken;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;

@Service
@Transactional
public class AuthService {

    private static final long REFRESH_TOKEN_EXPIRATION_MS = 7L * 24 * 60 * 60 * 1000;

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final GoogleTokenVerifier googleTokenVerifier;
    private final AppleTokenVerifier appleTokenVerifier;
    private final VerificationService verificationService;
    private final EmailService emailService;

    public AuthService(UserRepository userRepository,
                       RefreshTokenRepository refreshTokenRepository,
                       JwtService jwtService,
                       PasswordEncoder passwordEncoder,
                       GoogleTokenVerifier googleTokenVerifier,
                       AppleTokenVerifier appleTokenVerifier,
                       VerificationService verificationService,
                       EmailService emailService) {
        this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.jwtService = jwtService;
        this.passwordEncoder = passwordEncoder;
        this.googleTokenVerifier = googleTokenVerifier;
        this.appleTokenVerifier = appleTokenVerifier;
        this.verificationService = verificationService;
        this.emailService = emailService;
    }

    public RegisterResponse register(RegisterRequest request) {
        User user = userRepository.findByEmail(request.email()).orElse(null);

        if (user != null) {
            // Already verified (or OAuth account) — reject as duplicate
            if (user.isEmailVerified() || user.getProvider() != AuthProvider.LOCAL) {
                throw new AuthException("Email already registered");
            }
            // Unverified local account — update details and resend a fresh code
            user.setFullName(request.fullName());
            user.setPhoneNumber(request.phoneNumber());
            user.setDateOfBirth(request.dateOfBirth());
            user.setPassword(passwordEncoder.encode(request.password()));
        } else {
            user = new User();
            user.setFullName(request.fullName());
            user.setEmail(request.email());
            user.setPhoneNumber(request.phoneNumber());
            user.setDateOfBirth(request.dateOfBirth());
            user.setPassword(passwordEncoder.encode(request.password()));
            user.setProvider(AuthProvider.LOCAL);
            user.setEmailVerified(false);
            userRepository.save(user);
        }

        String code = verificationService.createCode(user, TokenType.EMAIL_VERIFICATION, null);
        emailService.sendEmailVerification(user.getEmail(), user.getFullName(), code);

        return new RegisterResponse(true, user.getEmail());
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new AuthException("Invalid email or password"));

        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new AuthException("Invalid email or password");
        }

        if (!user.isEmailVerified()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Please verify your email before logging in. Check your inbox for the 6-digit code.");
        }

        return buildAuthResponse(user);
    }

    public AuthResponse verifyEmail(VerifyEmailRequest request) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid code."));

        verificationService.consumeCode(user.getId(), TokenType.EMAIL_VERIFICATION, request.code());
        user.setEmailVerified(true);
        userRepository.save(user);
        return buildAuthResponse(user);
    }

    public void resendVerification(ResendVerificationRequest request) {
        userRepository.findByEmail(request.email()).ifPresent(user -> {
            if (!user.isEmailVerified() && user.getProvider() == AuthProvider.LOCAL) {
                String code = verificationService.createCode(user, TokenType.EMAIL_VERIFICATION, null);
                emailService.sendEmailVerification(user.getEmail(), user.getFullName(), code);
            }
        });
    }

    public void forgotPassword(ForgotPasswordRequest request) {
        userRepository.findByEmail(request.email()).ifPresent(user -> {
            if (user.getProvider() == AuthProvider.LOCAL) {
                String code = verificationService.createCode(user, TokenType.PASSWORD_RESET, null);
                emailService.sendPasswordReset(user.getEmail(), user.getFullName(), code);
            }
        });
    }

    public void resetPassword(ResetPasswordRequest request) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid code."));

        verificationService.consumeCode(user.getId(), TokenType.PASSWORD_RESET, request.code());
        user.setPassword(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
    }

    public AuthResponse loginWithGoogle(OAuthRequest request) {
        OAuthUserInfo info = googleTokenVerifier.verify(request.idToken());
        return loginWithOAuth(info, AuthProvider.GOOGLE);
    }

    public AuthResponse loginWithApple(OAuthRequest request) {
        OAuthUserInfo info = appleTokenVerifier.verify(request.idToken());
        return loginWithOAuth(info, AuthProvider.APPLE);
    }

    public void logout(LogoutRequest request) {
        refreshTokenRepository.findByToken(request.refreshToken()).ifPresent(token -> {
            token.setRevoked(true);
            refreshTokenRepository.save(token);
        });
    }

    public AuthResponse refresh(RefreshTokenRequest request) {
        RefreshToken refreshToken = refreshTokenRepository.findByToken(request.refreshToken())
                .orElseThrow(() -> new AuthException("Invalid refresh token"));

        if (refreshToken.isRevoked()) {
            throw new AuthException("Refresh token has been revoked");
        }

        if (refreshToken.getExpiresAt().isBefore(Instant.now())) {
            throw new AuthException("Refresh token has expired");
        }

        refreshToken.setRevoked(true);
        refreshTokenRepository.save(refreshToken);

        return buildAuthResponse(refreshToken.getUser());
    }

    private AuthResponse loginWithOAuth(OAuthUserInfo info, AuthProvider provider) {
        User user = userRepository.findByEmail(info.email()).orElseGet(() -> {
            User newUser = new User();
            newUser.setEmail(info.email());
            newUser.setFullName(info.fullName());
            newUser.setProvider(provider);
            newUser.setProviderId(info.providerId());
            newUser.setEmailVerified(true);
            return userRepository.save(newUser);
        });

        if (user.getProviderId() == null) {
            user.setProviderId(info.providerId());
        }

        return buildAuthResponse(user);
    }

    public AuthResponse buildAuthResponse(User user) {
        String accessToken = jwtService.generateAccessToken(user);

        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setToken(jwtService.generateRefreshTokenValue());
        refreshToken.setUser(user);
        refreshToken.setExpiresAt(Instant.now().plusMillis(REFRESH_TOKEN_EXPIRATION_MS));
        refreshTokenRepository.save(refreshToken);

        return new AuthResponse(
                accessToken,
                refreshToken.getToken(),
                "Bearer",
                new AuthResponse.UserInfo(user.getId(), user.getFullName(), user.getEmail())
        );
    }
}
