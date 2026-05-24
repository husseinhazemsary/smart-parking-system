package com.backend.smart_parking.email;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${app.mail.enabled:false}")
    private boolean mailEnabled;

    @Value("${spring.mail.username:}")
    private String fromAddress;

    public void sendInvitationEmail(String to, String fullName, String setupUrl, List<String> lotNames) {
        String lotsList = lotNames.isEmpty()
                ? "  • (no lots assigned)"
                : lotNames.stream().map(n -> "  • " + n).reduce("", (a, b) -> a + "\n" + b).strip();

        if (!mailEnabled || mailSender == null) {
            log.info("""
                    ========== INVITATION EMAIL (mail disabled) ==========
                    To:        {}
                    Name:      {}
                    Lots:      {}
                    Setup URL: {}
                    =======================================================""",
                    to, fullName, String.join(", ", lotNames), setupUrl);
            return;
        }

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromAddress);
        message.setTo(to);
        message.setSubject("You've been invited to manage a parking lot on EzRakna");
        message.setText("""
                Hello %s,

                You have been invited to manage the following parking lot(s) on EzRakna:

                %s

                Click the link below to set up your password and access the admin dashboard:
                %s

                Please note that this invitation link will expire in 48 hours.
                
                If you did not expect this invitation, you can safely ignore this email.

                Best regards,
                The EzRakna Team
                """.formatted(fullName, lotsList, setupUrl));
        mailSender.send(message);
    }
}
