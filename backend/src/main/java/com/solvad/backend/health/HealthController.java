package com.solvad.backend.health;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class HealthController {

    @GetMapping("/health")
    public ResponseEntity<String> healthCheck() {
        // A simple, fast response to tell UptimeRobot the server is alive
        return ResponseEntity.ok("Solvad Backend is awake and healthy!");
    }
}