package com.backend.smart_parking.plate;

import com.backend.smart_parking.plate.dto.PlateScanResponse;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/plates")
public class PlateController {

    private final PlateService plateService;

    public PlateController(PlateService plateService) {
        this.plateService = plateService;
    }

    @PostMapping(value = "/scan", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public PlateScanResponse scanPlate(
            @AuthenticationPrincipal UserDetails currentUser,
            @RequestParam("image") MultipartFile image) {
        return plateService.scanPlate(image);
    }
}
