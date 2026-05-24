package com.backend.smart_parking.invitation.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.UUID;

public record AcceptInvitationRequest(
        @NotNull UUID token,
        @NotBlank @Size(min = 8, message = "Password must be at least 8 characters") String password
) {}
