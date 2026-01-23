-- Create ENUM types FIRST
CREATE TYPE reservation_status AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED');
CREATE TYPE access_decision AS ENUM ('ALLOW', 'DENY');

-- Table: gate
CREATE TABLE gate (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    location TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX gate_name_key ON gate(name);

-- Table: parking_spot
CREATE TABLE parking_spot (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    spot_code TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE UNIQUE INDEX parking_spot_spot_code_key ON parking_spot(spot_code);

-- Table: app_user
CREATE TABLE app_user (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX app_user_email_key ON app_user(email);

-- Table: vehicle
CREATE TABLE vehicle (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    plate_raw TEXT NOT NULL,
    num_main SMALLINT NOT NULL,
    num_side SMALLINT NOT NULL,
    letters_ar TEXT NOT NULL,
    plate_norm TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT vehicle_user_id_fkey FOREIGN KEY (user_id) REFERENCES app_user(id) ON DELETE CASCADE
);

CREATE INDEX idx_vehicle_plate_norm ON vehicle(plate_norm);
CREATE UNIQUE INDEX vehicle_plate_norm_key ON vehicle(plate_norm);

ALTER TABLE vehicle ADD CONSTRAINT vehicle_letters_ar_check CHECK (length(letters_ar) >= 1 AND length(letters_ar) <= 5);
ALTER TABLE vehicle ADD CONSTRAINT vehicle_num_main_check CHECK (num_main >= 0 AND num_main <= 9999);
ALTER TABLE vehicle ADD CONSTRAINT vehicle_num_side_check CHECK (num_side >= 0 AND num_side <= 99);

-- Table: reservation
CREATE TABLE reservation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    vehicle_id UUID NOT NULL,
    gate_id UUID NOT NULL,
    spot_id UUID,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status reservation_status NOT NULL DEFAULT 'PENDING',
    entered_at TIMESTAMP WITH TIME ZONE,
    exited_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT reservation_user_id_fkey FOREIGN KEY (user_id) REFERENCES app_user(id) ON DELETE CASCADE,
    CONSTRAINT reservation_gate_id_fkey FOREIGN KEY (gate_id) REFERENCES gate(id) ON DELETE SET NULL,
    CONSTRAINT reservation_spot_id_fkey FOREIGN KEY (spot_id) REFERENCES parking_spot(id) ON DELETE SET NULL
);

ALTER TABLE reservation ADD CONSTRAINT reservation_check CHECK (end_time > start_time);
CREATE INDEX idx_reservation_active_window ON reservation(vehicle_id, start_time, end_time) WHERE status = 'CONFIRMED';

-- Table: access_log
CREATE TABLE access_log (
    id BIGSERIAL PRIMARY KEY,
    detected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    gate_id UUID NOT NULL,
    plate_raw TEXT NOT NULL,
    plate_norm TEXT,
    decision access_decision NOT NULL,
    reason TEXT,
    reservation_id UUID,
    CONSTRAINT access_log_gate_id_fkey FOREIGN KEY (gate_id) REFERENCES gate(id) ON DELETE SET NULL
);

CREATE INDEX idx_access_log_plate_time ON access_log(plate_norm, detected_at DESC);