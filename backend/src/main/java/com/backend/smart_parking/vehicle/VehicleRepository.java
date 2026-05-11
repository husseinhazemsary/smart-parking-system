package com.backend.smart_parking.vehicle;

import com.backend.smart_parking.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface VehicleRepository extends JpaRepository<Vehicle, UUID> {
    List<Vehicle> findAllByUser(User user);
    Optional<Vehicle> findByIdAndUser(UUID id, User user);
    boolean existsByPlateNumber(String plateNumber);
    long countByUser(User user);

    @Modifying
    @Query("UPDATE Vehicle v SET v.isDefault = false WHERE v.user = :user")
    void clearDefaultForUser(@Param("user") User user);
}
