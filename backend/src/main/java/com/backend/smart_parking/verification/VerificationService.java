package com.backend.smart_parking.verification;

import com.backend.smart_parking.user.User;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.security.SecureRandom;
import java.time.Instant;

@Service
@Transactional
public class VerificationService {

    private static final long CODE_TTL_MS = 15L * 60 * 1000; // 15 minutes for all code types
    private static final SecureRandom RANDOM = new SecureRandom();

    private final VerificationTokenRepository repository;

    public VerificationService(VerificationTokenRepository repository) {
        this.repository = repository;
    }

    public String createCode(User user, TokenType type, String newEmail) {
        repository.deleteUnusedByUserIdAndType(user.getId(), type);

        String code = String.format("%06d", RANDOM.nextInt(1_000_000));

        VerificationToken vt = new VerificationToken();
        vt.setToken(code);
        vt.setUser(user);
        vt.setType(type);
        vt.setNewEmail(newEmail);
        vt.setExpiresAt(Instant.now().plusMillis(CODE_TTL_MS));
        repository.save(vt);
        return code;
    }

    public VerificationToken consumeCode(java.util.UUID userId, TokenType type, String code) {
        VerificationToken vt = repository.findByUser_IdAndTypeAndToken(userId, type, code)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Invalid code. Please check and try again."));

        if (vt.isUsed()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "This code has already been used.");
        }
        if (vt.getExpiresAt().isBefore(Instant.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "This code has expired. Please request a new one.");
        }

        vt.setUsed(true);
        repository.save(vt);
        return vt;
    }
}
