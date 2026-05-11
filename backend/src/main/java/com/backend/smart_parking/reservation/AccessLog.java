package com.backend.smart_parking.reservation;

import com.backend.smart_parking.parking.Gate;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "access_log")
public class AccessLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "detected_at", nullable = false)
    private Instant detectedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "gate_id", nullable = false)
    private Gate gate;

    @Column(name = "plate_raw")
    private String plateRaw;

    @Column(name = "plate_norm")
    private String plateNorm;

    @Enumerated(EnumType.STRING)
    @Column(name = "decision", nullable = false, columnDefinition = "access_decision")
    private AccessDecision decision;

    private String reason;

    @Column(name = "reservation_id")
    private UUID reservationId;

    public Long getId() { return id; }
    public Instant getDetectedAt() { return detectedAt; }
    public Gate getGate() { return gate; }
    public String getPlateRaw() { return plateRaw; }
    public String getPlateNorm() { return plateNorm; }
    public AccessDecision getDecision() { return decision; }
    public String getReason() { return reason; }
    public UUID getReservationId() { return reservationId; }
}
