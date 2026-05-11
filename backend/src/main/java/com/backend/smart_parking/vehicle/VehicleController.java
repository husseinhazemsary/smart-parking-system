package com.backend.smart_parking.vehicle;

import com.backend.smart_parking.user.User;
import com.backend.smart_parking.vehicle.dto.CreateVehicleRequest;
import com.backend.smart_parking.vehicle.dto.UpdateVehicleRequest;
import com.backend.smart_parking.vehicle.dto.VehicleResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/users/me/vehicles")
public class VehicleController {

    private final VehicleService vehicleService;

    public VehicleController(VehicleService vehicleService) {
        this.vehicleService = vehicleService;
    }

    @GetMapping
    public List<VehicleResponse> getVehicles(@AuthenticationPrincipal User currentUser) {
        return vehicleService.getVehicles(currentUser);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public VehicleResponse addVehicle(@AuthenticationPrincipal User currentUser,
                                      @Valid @RequestBody CreateVehicleRequest request) {
        return vehicleService.addVehicle(currentUser, request);
    }

    @PutMapping("/{id}")
    public VehicleResponse updateVehicle(@AuthenticationPrincipal User currentUser,
                                         @PathVariable UUID id,
                                         @Valid @RequestBody UpdateVehicleRequest request) {
        return vehicleService.updateVehicle(currentUser, id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteVehicle(@AuthenticationPrincipal User currentUser,
                               @PathVariable UUID id) {
        vehicleService.deleteVehicle(currentUser, id);
    }
}
