package com.backend.smart_parking.exception;

public class AuthException extends RuntimeException {
    public AuthException(String message) {
        super(message);
    }
}
