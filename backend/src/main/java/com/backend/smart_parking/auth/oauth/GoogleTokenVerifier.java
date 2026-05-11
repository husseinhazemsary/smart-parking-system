package com.backend.smart_parking.auth.oauth;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

@Service
public class GoogleTokenVerifier {

    @Value("${app.oauth.google.client-id}")
    private String clientId;

    private final HttpClient httpClient = HttpClient.newHttpClient();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public OAuthUserInfo verify(String idToken) {
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://oauth2.googleapis.com/tokeninfo?id_token=" + idToken))
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                throw new IllegalArgumentException("Invalid Google ID token");
            }

            JsonNode payload = objectMapper.readTree(response.body());

            if (!clientId.equals(payload.get("aud").asText())) {
                throw new IllegalArgumentException("Google token audience mismatch");
            }

            return new OAuthUserInfo(
                    payload.get("sub").asText(),
                    payload.get("email").asText(),
                    payload.has("name") ? payload.get("name").asText() : ""
            );
        } catch (IOException | InterruptedException e) {
            throw new RuntimeException("Failed to verify Google token", e);
        }
    }
}
