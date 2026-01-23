-- Function to check vehicle access and log the attempt
CREATE OR REPLACE FUNCTION check_and_log_access(
    p_gate_id UUID,
    p_plate_text TEXT
)
RETURNS TABLE(decision access_decision, reason TEXT)
LANGUAGE plpgsql
AS $$
DECLARE
    v_vehicle_id UUID;
    v_reservation_id UUID;
    v_decision access_decision;
    v_reason TEXT;
    v_plate_norm TEXT;
BEGIN
    -- Normalize the plate text (remove spaces, convert to uppercase)
    v_plate_norm := UPPER(REPLACE(p_plate_text, ' ', ''));
    
    -- Check if vehicle exists and is active
    SELECT id INTO v_vehicle_id
    FROM vehicle
    WHERE plate_norm = v_plate_norm
    AND is_active = true;
    
    -- If vehicle not found
    IF v_vehicle_id IS NULL THEN
        v_decision := 'DENY';
        v_reason := 'Vehicle not registered in system';
    ELSE
        -- Check if there's an active reservation for this vehicle at this gate
        SELECT r.id INTO v_reservation_id
        FROM reservation r
        WHERE r.vehicle_id = v_vehicle_id
        AND r.gate_id = p_gate_id
        AND r.status = 'CONFIRMED'
        AND NOW() BETWEEN r.start_time AND r.end_time;
        
        -- If reservation found
        IF v_reservation_id IS NOT NULL THEN
            v_decision := 'ALLOW';
            v_reason := 'Valid reservation found';
            
            -- Update reservation entered_at timestamp if not already set
            UPDATE reservation
            SET entered_at = COALESCE(entered_at, NOW())
            WHERE id = v_reservation_id;
        ELSE
            v_decision := 'DENY';
            v_reason := 'No valid reservation for this time and gate';
        END IF;
    END IF;
    
    -- Log the access attempt
    INSERT INTO access_log (
        detected_at,
        gate_id,
        plate_raw,
        plate_norm,
        decision,
        reason,
        reservation_id
    ) VALUES (
        NOW(),
        p_gate_id,
        p_plate_text,
        v_plate_norm,
        v_decision,
        v_reason,
        v_reservation_id
    );
    
    -- Return the decision and reason
    RETURN QUERY SELECT v_decision, v_reason;
END;
$$;