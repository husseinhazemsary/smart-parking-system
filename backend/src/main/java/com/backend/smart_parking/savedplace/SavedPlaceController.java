package com.backend.smart_parking.savedplace;

import com.backend.smart_parking.savedplace.dto.SavedPlaceRequest;
import com.backend.smart_parking.savedplace.dto.SavedPlaceResponse;
import com.backend.smart_parking.user.User;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/saved-places")
public class SavedPlaceController {

    private final SavedPlaceService savedPlaceService;

    public SavedPlaceController(SavedPlaceService savedPlaceService) {
        this.savedPlaceService = savedPlaceService;
    }

    @GetMapping
    public List<SavedPlaceResponse> getSavedPlaces(@AuthenticationPrincipal User currentUser) {
        return savedPlaceService.getSavedPlaces(currentUser);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public SavedPlaceResponse savePlace(@AuthenticationPrincipal User currentUser,
                                        @Valid @RequestBody SavedPlaceRequest request) {
        return savedPlaceService.savePlace(currentUser, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeSavedPlace(@AuthenticationPrincipal User currentUser,
                                  @PathVariable UUID id) {
        savedPlaceService.removeSavedPlace(currentUser, id);
    }
}
