package com.backend.smart_parking.invitation;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "admin_invitations")
public class AdminInvitation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String fullName;

    private String phoneNumber;

    @Column(nullable = false, unique = true)
    private UUID token;

    @Column(nullable = false)
    private Instant expiresAt;

    private boolean used = false;

    @ElementCollection
    @CollectionTable(name = "invitation_lot_ids", joinColumns = @JoinColumn(name = "invitation_id"))
    @Column(name = "lot_id")
    private List<UUID> assignedLotIds;

    public UUID getId()                        { return id; }
    public String getEmail()                   { return email; }
    public void setEmail(String email)         { this.email = email; }
    public String getFullName()                { return fullName; }
    public void setFullName(String fullName)   { this.fullName = fullName; }
    public String getPhoneNumber()             { return phoneNumber; }
    public void setPhoneNumber(String p)       { this.phoneNumber = p; }
    public UUID getToken()                     { return token; }
    public void setToken(UUID token)           { this.token = token; }
    public Instant getExpiresAt()              { return expiresAt; }
    public void setExpiresAt(Instant t)        { this.expiresAt = t; }
    public boolean isUsed()                    { return used; }
    public void setUsed(boolean used)          { this.used = used; }
    public List<UUID> getAssignedLotIds()      { return assignedLotIds; }
    public void setAssignedLotIds(List<UUID> l){ this.assignedLotIds = l; }
}
