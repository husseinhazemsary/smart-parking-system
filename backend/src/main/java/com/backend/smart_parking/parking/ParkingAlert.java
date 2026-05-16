package com.backend.smart_parking.parking;

import com.backend.smart_parking.user.User;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "parking_alerts")
public class ParkingAlert {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parking_lot_id", nullable = false)
    private ParkingLot parkingLot;

    @Column(nullable = false)
    private String triggerCondition;

    @Column
    private Integer minSpots;

    @Column
    private Integer checkDurationMinutes;

    @Column(nullable = false)
    private int expiresInMinutes;

    @Column(nullable = false)
    private boolean quietHours;

    @Column(nullable = false)
    private boolean pushNotification;

    @Column(nullable = false)
    private boolean sound;

    @Column(nullable = false)
    private boolean vibrate;

    @Column(nullable = false)
    private boolean active = true;

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public UUID getId() { return id; }
    public User getUser() { return user; }
    public ParkingLot getParkingLot() { return parkingLot; }
    public String getTriggerCondition() { return triggerCondition; }
    public Integer getMinSpots() { return minSpots; }
    public Integer getCheckDurationMinutes() { return checkDurationMinutes; }
    public int getExpiresInMinutes() { return expiresInMinutes; }
    public boolean isQuietHours() { return quietHours; }
    public boolean isPushNotification() { return pushNotification; }
    public boolean isSound() { return sound; }
    public boolean isVibrate() { return vibrate; }
    public boolean isActive() { return active; }
    public Instant getCreatedAt() { return createdAt; }

    public void setUser(User user) { this.user = user; }
    public void setParkingLot(ParkingLot parkingLot) { this.parkingLot = parkingLot; }
    public void setTriggerCondition(String triggerCondition) { this.triggerCondition = triggerCondition; }
    public void setMinSpots(Integer minSpots) { this.minSpots = minSpots; }
    public void setCheckDurationMinutes(Integer checkDurationMinutes) { this.checkDurationMinutes = checkDurationMinutes; }
    public void setExpiresInMinutes(int expiresInMinutes) { this.expiresInMinutes = expiresInMinutes; }
    public void setQuietHours(boolean quietHours) { this.quietHours = quietHours; }
    public void setPushNotification(boolean pushNotification) { this.pushNotification = pushNotification; }
    public void setSound(boolean sound) { this.sound = sound; }
    public void setVibrate(boolean vibrate) { this.vibrate = vibrate; }
    public void setActive(boolean active) { this.active = active; }
}
