package com.backend.smart_parking.auth;

import com.backend.smart_parking.auth.dto.*;
import com.backend.smart_parking.auth.oauth.AppleTokenVerifier;
import com.backend.smart_parking.auth.oauth.GoogleTokenVerifier;
import com.backend.smart_parking.auth.oauth.OAuthUserInfo;
import com.backend.smart_parking.exception.AuthException;
import com.backend.smart_parking.token.JwtService;
import com.backend.smart_parking.token.RefreshToken;
import com.backend.smart_parking.token.RefreshTokenRepository;
import com.backend.smart_parking.user.AuthProvider;
import com.backend.smart_parking.user.User;
import com.backend.smart_parking.user.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

    public AuthService(UserRepository userRepository,
                       RefreshTokenRepository refreshTokenRepository,
                       JwtService jwtService,
                       PasswordEncoder passwordEncoder,
                       GoogleTokenVerifier googleTokenVerifier,
                       AppleTokenVerifier appleTokenVerifier) {
        this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.jwtService = jwtService;
        this.passwordEncoder = passwordEncoder;
        this.googleTokenVerifier = googleTokenVerifier;
        this.appleTokenVerifier = appleTokenVerifier;
    }

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new AuthException("Email already registered");
        }

        User user = new User();
        user.setFullName(request.fullName());
        user.setEmail(request.email());
        user.setPhoneNumber(request.phoneNumber());
        user.setDateOfBirth(request.dateOfBirth());
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setProvider(AuthProvider.LOCAL);
        userRepository.save(user);

        return buildAuthResponse(user);
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new AuthException("Invalid email or password"));

        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new AuthException("Invalid email or password");
        }

        return buildAuthResponse(user);
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

        // Rotate: revoke old, issue new
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
