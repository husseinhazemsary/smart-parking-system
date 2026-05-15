package com.backend.smart_parking.parking;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "parking_lots")
public class ParkingLot {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String address;

    @Column(nullable = false)
    private double latitude;

    @Column(nullable = false)
    private double longitude;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal hourlyRate;

    @Column(nullable = false)
    private LocalTime openingTime;

    @Column(nullable = false)
    private LocalTime closingTime;

    @Column(nullable = false)
    private int numberOfGates = 1;

    @Column
    private String imageUrl;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "parking_lot_amenities", joinColumns = @JoinColumn(name = "parking_lot_id"))
    @Column(name = "amenity")
    private List<String> amenities = new ArrayList<>();

    public UUID getId() { return id; }
    public String getName() { return name; }
    public String getAddress() { return address; }
    public double getLatitude() { return latitude; }
    public double getLongitude() { return longitude; }
    public BigDecimal getHourlyRate() { return hourlyRate; }
    public LocalTime getOpeningTime() { return openingTime; }
    public LocalTime getClosingTime() { return closingTime; }
    public int getNumberOfGates() { return numberOfGates; }
    public String getImageUrl() { return imageUrl; }
    public List<String> getAmenities() { return amenities; }

    public void setName(String name) { this.name = name; }
    public void setAddress(String address) { this.address = address; }
    public void setLatitude(double latitude) { this.latitude = latitude; }
    public void setLongitude(double longitude) { this.longitude = longitude; }
    public void setHourlyRate(BigDecimal hourlyRate) { this.hourlyRate = hourlyRate; }
    public void setOpeningTime(LocalTime openingTime) { this.openingTime = openingTime; }
    public void setClosingTime(LocalTime closingTime) { this.closingTime = closingTime; }
    public void setNumberOfGates(int numberOfGates) { this.numberOfGates = numberOfGates; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
    public void setAmenities(List<String> amenities) { this.amenities = amenities; }
}
