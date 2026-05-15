package com.backend.smart_parking.plate;

import com.backend.smart_parking.plate.dto.PlateScanResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.concurrent.CompletableFuture;

@Service
public class PlateService {

    private final RestTemplate restTemplate;

    @Value("${lpr.service.url:http://localhost:8001}")
    private String lprServiceUrl;

    public PlateService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    @Async("lprExecutor")
    public CompletableFuture<PlateScanResponse> scanPlate(MultipartFile image) {
        try {
            byte[] bytes = image.getBytes();
            String filename = image.getOriginalFilename() != null ? image.getOriginalFilename() : "plate.jpg";

            ByteArrayResource resource = new ByteArrayResource(bytes) {
                @Override
                public String getFilename() {
                    return filename;
                }
            };

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("image", resource);

            HttpEntity<MultiValueMap<String, Object>> request = new HttpEntity<>(body, headers);

            PlateScanResponse response = restTemplate.postForObject(
                    lprServiceUrl + "/scan-plate",
                    request,
                    PlateScanResponse.class
            );

            return CompletableFuture.completedFuture(
                    response != null ? response : new PlateScanResponse(null, 0.0, false)
            );

        } catch (IOException | RestClientException e) {
            return CompletableFuture.completedFuture(new PlateScanResponse(null, 0.0, false));
        }
    }
}
