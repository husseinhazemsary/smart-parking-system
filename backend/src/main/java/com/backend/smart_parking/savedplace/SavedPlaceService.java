package com.backend.smart_parking.savedplace;

import com.backend.smart_parking.parking.ParkingLot;
import com.backend.smart_parking.parking.ParkingLotRepository;
import com.backend.smart_parking.savedplace.dto.SavedPlaceRequest;
import com.backend.smart_parking.savedplace.dto.SavedPlaceResponse;
import com.backend.smart_parking.user.User;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class SavedPlaceService {

    private final SavedPlaceRepository savedPlaceRepository;
    private final ParkingLotRepository parkingLotRepository;

    public SavedPlaceService(SavedPlaceRepository savedPlaceRepository,
                              ParkingLotRepository parkingLotRepository) {
        this.savedPlaceRepository = savedPlaceRepository;
        this.parkingLotRepository = parkingLotRepository;
    }

    @Transactional(readOnly = true)
    public List<SavedPlaceResponse> getSavedPlaces(User user) {
        return savedPlaceRepository.findAllByUserOrderBySavedAtDesc(user).stream()
                .map(this::toResponse)
                .toList();
    }

    public SavedPlaceResponse savePlace(User user, SavedPlaceRequest request) {
        if (savedPlaceRepository.existsByUserAndParkingLotId(user, request.parkingLotId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Parking lot already saved");
        }

        if (!parkingLotRepository.existsById(request.parkingLotId())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Parking lot not found");
        }
        ParkingLot lot = parkingLotRepository.getReferenceById(request.parkingLotId());

        SavedPlace savedPlace = new SavedPlace();
        savedPlace.setUser(user);
        savedPlace.setParkingLot(lot);
        savedPlaceRepository.save(savedPlace);

        return toResponse(savedPlace);
    }

    public void removeSavedPlace(User user, UUID savedPlaceId) {
        SavedPlace savedPlace = savedPlaceRepository.findByIdAndUser(savedPlaceId, user)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Saved place not found"));
        savedPlaceRepository.delete(savedPlace);
    }

    private SavedPlaceResponse toResponse(SavedPlace sp) {
        return new SavedPlaceResponse(
                sp.getId(),
                sp.getParkingLot().getId(),
                sp.getParkingLot().getName(),
                sp.getParkingLot().getAddress(),
                sp.getSavedAt().toString()
        );
    }
}
