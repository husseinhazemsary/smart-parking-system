package com.backend.smart_parking.vehicle;

import com.backend.smart_parking.user.User;
import com.backend.smart_parking.vehicle.dto.CreateVehicleRequest;
import com.backend.smart_parking.vehicle.dto.UpdateVehicleRequest;
import com.backend.smart_parking.vehicle.dto.VehicleResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class VehicleService {

    private final VehicleRepository vehicleRepository;

    public VehicleService(VehicleRepository vehicleRepository) {
        this.vehicleRepository = vehicleRepository;
    }

    @Transactional(readOnly = true)
    public List<VehicleResponse> getVehicles(User user) {
        return vehicleRepository.findAllByUser(user).stream()
                .map(this::toResponse)
                .toList();
    }

    public VehicleResponse addVehicle(User user, CreateVehicleRequest request) {
        String normalizedPlate = request.plateNumber().trim().toUpperCase();

        if (vehicleRepository.existsByPlateNumber(normalizedPlate)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Plate number already registered");
        }

        boolean isFirstVehicle = vehicleRepository.countByUser(user) == 0;

        if (request.isDefault() || isFirstVehicle) {
            vehicleRepository.clearDefaultForUser(user);
        }

        Vehicle vehicle = new Vehicle();
        vehicle.setUser(user);
        vehicle.setPlateNumber(normalizedPlate);
        vehicle.setNickname(request.nickname());
        vehicle.setVehicleType(request.vehicleType());
        vehicle.setMakeAndModel(request.makeAndModel());
        vehicle.setDefault(request.isDefault() || isFirstVehicle);
        vehicle.setAutoPay(request.autoPay());
        vehicleRepository.save(vehicle);

        return toResponse(vehicle);
    }

    public VehicleResponse updateVehicle(User user, UUID vehicleId, UpdateVehicleRequest request) {
        Vehicle vehicle = findOwnedVehicle(user, vehicleId);

        String normalizedPlate = request.plateNumber().trim().toUpperCase();

        if (!vehicle.getPlateNumber().equals(normalizedPlate)
                && vehicleRepository.existsByPlateNumber(normalizedPlate)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Plate number already registered");
        }

        if (request.isDefault() && !vehicle.isDefault()) {
            vehicleRepository.clearDefaultForUser(user);
        }

        vehicle.setPlateNumber(normalizedPlate);
        vehicle.setNickname(request.nickname());
        vehicle.setVehicleType(request.vehicleType());
        vehicle.setMakeAndModel(request.makeAndModel());
        vehicle.setDefault(request.isDefault());
        vehicle.setAutoPay(request.autoPay());
        vehicleRepository.save(vehicle);

        return toResponse(vehicle);
    }

    public void deleteVehicle(User user, UUID vehicleId) {
        Vehicle vehicle = findOwnedVehicle(user, vehicleId);
        vehicleRepository.delete(vehicle);
    }

    private Vehicle findOwnedVehicle(User user, UUID vehicleId) {
        return vehicleRepository.findByIdAndUser(vehicleId, user)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Vehicle not found"));
    }

    private VehicleResponse toResponse(Vehicle vehicle) {
        return new VehicleResponse(
                vehicle.getId(),
                vehicle.getPlateNumber(),
                vehicle.getNickname(),
                vehicle.getVehicleType(),
                vehicle.getMakeAndModel(),
                vehicle.isDefault(),
                vehicle.isAutoPay(),
                vehicle.getCreatedAt()
        );
    }
}
