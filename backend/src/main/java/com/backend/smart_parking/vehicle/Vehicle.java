package com.backend.smart_parking.vehicle;

import com.backend.smart_parking.user.User;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "vehicles")
public class Vehicle {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "plate_number")
    private String plateNumber;

    // LPR decomposed plate fields (populated by the AI/LPR service)
    @Column(name = "plate_raw")
    private String plateRaw;

    @Column(name = "num_main")
    private Short numMain;

    @Column(name = "num_side")
    private Short numSide;

    @Column(name = "letters_ar")
    private String lettersAr;

    @Column(name = "plate_norm")
    private String plateNorm;

    @Column(name = "is_active", nullable = false)
    private boolean isActive = true;

    private String nickname;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private VehicleType vehicleType;

    private String makeAndModel;

    @Column(nullable = false)
    private boolean isDefault = false;

    @Column(nullable = false)
    private boolean autoPay = false;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
    }

    public UUID getId() { return id; }
    public User getUser() { return user; }
    public String getPlateNumber() { return plateNumber; }
    public String getPlateRaw() { return plateRaw; }
    public Short getNumMain() { return numMain; }
    public Short getNumSide() { return numSide; }
    public String getLettersAr() { return lettersAr; }
    public String getPlateNorm() { return plateNorm; }
    public boolean isActive() { return isActive; }
    public String getNickname() { return nickname; }
    public VehicleType getVehicleType() { return vehicleType; }
    public String getMakeAndModel() { return makeAndModel; }
    public boolean isDefault() { return isDefault; }
    public boolean isAutoPay() { return autoPay; }
    public Instant getCreatedAt() { return createdAt; }

    public void setUser(User user) { this.user = user; }
    public void setPlateNumber(String plateNumber) { this.plateNumber = plateNumber; }
    public void setPlateRaw(String plateRaw) { this.plateRaw = plateRaw; }
    public void setNumMain(Short numMain) { this.numMain = numMain; }
    public void setNumSide(Short numSide) { this.numSide = numSide; }
    public void setLettersAr(String lettersAr) { this.lettersAr = lettersAr; }
    public void setPlateNorm(String plateNorm) { this.plateNorm = plateNorm; }
    public void setActive(boolean isActive) { this.isActive = isActive; }
    public void setNickname(String nickname) { this.nickname = nickname; }
    public void setVehicleType(VehicleType vehicleType) { this.vehicleType = vehicleType; }
    public void setMakeAndModel(String makeAndModel) { this.makeAndModel = makeAndModel; }
    public void setDefault(boolean isDefault) { this.isDefault = isDefault; }
    public void setAutoPay(boolean autoPay) { this.autoPay = autoPay; }
}
