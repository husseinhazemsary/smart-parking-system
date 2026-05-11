package com.backend.smart_parking.savedplace;

import com.backend.smart_parking.user.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SavedPlaceRepository extends JpaRepository<SavedPlace, UUID> {

    List<SavedPlace> findAllByUserOrderBySavedAtDesc(User user);

    Optional<SavedPlace> findByIdAndUser(UUID id, User user);

    boolean existsByUserAndParkingLotId(User user, UUID parkingLotId);
}
