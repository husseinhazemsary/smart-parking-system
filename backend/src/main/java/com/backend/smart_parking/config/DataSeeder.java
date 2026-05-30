package com.backend.smart_parking.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.backend.smart_parking.user.AuthProvider;
import com.backend.smart_parking.user.Role;
import com.backend.smart_parking.user.User;
import com.backend.smart_parking.user.UserRepository;

@Component
public class DataSeeder {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    private final UserRepository  userRepo;
    private final PasswordEncoder passwordEncoder;

    public DataSeeder(UserRepository userRepo, PasswordEncoder passwordEncoder) {
        this.userRepo        = userRepo;
        this.passwordEncoder = passwordEncoder;
    }

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void seed() {
        seedAdminUser();
    }

    private void seedAdminUser() {
        if (!userRepo.existsByEmailIgnoreCase("admin@parking.com")) {
            User admin = new User();
            admin.setFullName("Admin");
            admin.setEmail("admin@parking.com");
            admin.setPassword(passwordEncoder.encode("Admin@1234"));
            admin.setProvider(AuthProvider.LOCAL);
            admin.setRole(Role.ROLE_ADMIN);
            userRepo.save(admin);
            log.info("Admin user created: admin@parking.com");
        }
    }
}
