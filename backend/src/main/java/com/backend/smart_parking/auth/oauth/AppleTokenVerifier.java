package com.backend.smart_parking.auth.oauth;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.math.BigInteger;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.security.KeyFactory;
import java.security.PublicKey;
import java.security.interfaces.RSAPublicKey;
import java.security.spec.RSAPublicKeySpec;
import java.util.Base64;

@Service
public class AppleTokenVerifier {

    private static final String APPLE_JWKS_URL = "https://appleid.apple.com/auth/keys";

    @Value("${app.oauth.apple.client-id}")
    private String clientId;

    private final HttpClient httpClient = HttpClient.newHttpClient();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public OAuthUserInfo verify(String idToken) {
        try {
            String kid = extractKid(idToken);
            RSAPublicKey publicKey = (RSAPublicKey) fetchApplePublicKey(kid);

            Claims claims = Jwts.parser()
                    .verifyWith(publicKey)
                    .build()
                    .parseSignedClaims(idToken)
                    .getPayload();

            if (!claims.getAudience().contains(clientId)) {
                throw new IllegalArgumentException("Apple token audience mismatch");
            }

            return new OAuthUserInfo(
                    claims.getSubject(),
                    claims.get("email", String.class),
                    ""  // Apple only provides name on first sign-in; handle that in the mobile app
            );
        } catch (JwtException e) {
            throw new IllegalArgumentException("Invalid Apple ID token", e);
        }
    }

    private String extractKid(String token) {
        String headerB64 = token.split("\\.")[0];
        try {
            byte[] decoded = Base64.getUrlDecoder().decode(headerB64);
            return objectMapper.readTree(decoded).get("kid").asText();
        } catch (IOException e) {
            throw new IllegalArgumentException("Malformed Apple ID token", e);
        }
    }

    private PublicKey fetchApplePublicKey(String kid) {
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(APPLE_JWKS_URL))
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            JsonNode keys = objectMapper.readTree(response.body()).get("keys");

            for (JsonNode key : keys) {
                if (kid.equals(key.get("kid").asText())) {
                    BigInteger modulus = new BigInteger(1, Base64.getUrlDecoder().decode(key.get("n").asText()));
                    BigInteger exponent = new BigInteger(1, Base64.getUrlDecoder().decode(key.get("e").asText()));
                    return KeyFactory.getInstance("RSA").generatePublic(new RSAPublicKeySpec(modulus, exponent));
                }
            }
            throw new IllegalArgumentException("No matching Apple public key for kid: " + kid);
        } catch (IOException | InterruptedException e) {
            throw new RuntimeException("Failed to fetch Apple public keys", e);
        } catch (Exception e) {
            throw new RuntimeException("Failed to construct Apple public key", e);
        }
    }
}
