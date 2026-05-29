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

    public void sendEmailVerification(String to, String fullName, String code) {
        String subject = "Your EzRakna verification code";
        String body = """
                Hello %s,

                Your email verification code is:

                    %s

                Enter this code in the app to verify your account.
                This code expires in 15 minutes.

                If you did not create an account, you can safely ignore this email.

                Best regards,
                The EzRakna Team
                """.formatted(fullName, code);

        send(to, subject, body, "EMAIL VERIFICATION CODE", code);
    }

    public void sendPasswordReset(String to, String fullName, String code) {
        String subject = "Your EzRakna password reset code";
        String body = """
                Hello %s,

                Your password reset code is:

                    %s

                Enter this code in the app to reset your password.
                This code expires in 15 minutes.

                If you did not request a password reset, you can safely ignore this email.

                Best regards,
                The EzRakna Team
                """.formatted(fullName, code);

        send(to, subject, body, "PASSWORD RESET CODE", code);
    }

    public void sendEmailChangeVerification(String to, String fullName, String code) {
        String subject = "Your EzRakna email change code";
        String body = """
                Hello %s,

                Your email change verification code is:

                    %s

                Enter this code in the app to confirm your new email address.
                This code expires in 15 minutes.

                If you did not request this change, please ignore this email.

                Best regards,
                The EzRakna Team
                """.formatted(fullName, code);

        send(to, subject, body, "EMAIL CHANGE CODE", code);
    }

    public void sendInvitationEmail(String to, String fullName, String setupUrl, List<String> lotNames) {
        String lotsList = lotNames.isEmpty()
                ? "  • (no lots assigned)"
                : lotNames.stream().map(n -> "  • " + n).reduce("", (a, b) -> a + "\n" + b).strip();

        String body = """
                Hello %s,

                You have been invited to manage the following parking lot(s) on EzRakna:

                %s

                Click the link below to set up your password and access the admin dashboard:
                %s

                Please note that this invitation link will expire in 48 hours.

                If you did not expect this invitation, you can safely ignore this email.

                Best regards,
                The EzRakna Team
                """.formatted(fullName, lotsList, setupUrl);

        send(to, "You've been invited to manage a parking lot on EzRakna", body,
                "INVITATION — lots: " + String.join(", ", lotNames), setupUrl);
    }

    private void send(String to, String subject, String body, String logLabel, String logValue) {
        if (!mailEnabled || mailSender == null) {
            log.info("""
                    ========== EMAIL ({}) ==========
                    To:    {}
                    Value: {}
                    =================================""",
                    logLabel, to, logValue);
            return;
        }

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromAddress);
        message.setTo(to);
        message.setSubject(subject);
        message.setText(body);
        mailSender.send(message);
    }
}
