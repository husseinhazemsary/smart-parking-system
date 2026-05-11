package com.backend.smart_parking.reservation.dto;

public class ActiveSessionResponse {

    private ReservationResponse reservation;
    private long elapsedMinutes;

    public ActiveSessionResponse(ReservationResponse reservation, long elapsedMinutes) {
        this.reservation = reservation;
        this.elapsedMinutes = elapsedMinutes;
    }

    public ReservationResponse getReservation() { return reservation; }
    public long getElapsedMinutes() { return elapsedMinutes; }
}
