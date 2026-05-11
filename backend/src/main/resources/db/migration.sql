-- ============================================================
-- Run this ONCE on ocr_db before starting the Spring Boot app
-- ============================================================

-- 1. Extend app_user with auth fields
ALTER TABLE app_user
    ADD COLUMN IF NOT EXISTS password_hash   text,
    ADD COLUMN IF NOT EXISTS auth_provider   varchar(20) NOT NULL DEFAULT 'LOCAL',
    ADD COLUMN IF NOT EXISTS provider_id     text,
    ADD COLUMN IF NOT EXISTS date_of_birth   date,
    ADD COLUMN IF NOT EXISTS updated_at      timestamptz NOT NULL DEFAULT now();

-- 2. Extend vehicle with app-level fields
ALTER TABLE vehicle
    ADD COLUMN IF NOT EXISTS plate_number   text,
    ADD COLUMN IF NOT EXISTS nickname       text,
    ADD COLUMN IF NOT EXISTS vehicle_type   varchar(30),
    ADD COLUMN IF NOT EXISTS make_and_model text,
    ADD COLUMN IF NOT EXISTS is_default     boolean NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS auto_pay       boolean NOT NULL DEFAULT false;

-- 3. Create parking_lot (new table, not in ocr_db)
CREATE TABLE IF NOT EXISTS parking_lot (
    id               uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
    name             text         NOT NULL,
    address          text         NOT NULL,
    latitude         double precision NOT NULL,
    longitude        double precision NOT NULL,
    hourly_rate      numeric(10,2) NOT NULL,
    opening_time     time         NOT NULL,
    closing_time     time         NOT NULL,
    number_of_gates  int          NOT NULL DEFAULT 1,
    is_active        boolean      NOT NULL DEFAULT true,
    created_at       timestamptz  NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS parking_lot_amenities (
    parking_lot_id uuid NOT NULL REFERENCES parking_lot(id) ON DELETE CASCADE,
    amenity        text NOT NULL
);

-- 4. Link gate → parking_lot
ALTER TABLE gate
    ADD COLUMN IF NOT EXISTS parking_lot_id uuid REFERENCES parking_lot(id);

-- 5. Extend parking_spot with slot metadata
ALTER TABLE parking_spot
    ADD COLUMN IF NOT EXISTS parking_lot_id uuid REFERENCES parking_lot(id),
    ADD COLUMN IF NOT EXISTS slot_type      varchar(30) NOT NULL DEFAULT 'REGULAR',
    ADD COLUMN IF NOT EXISTS status         varchar(30) NOT NULL DEFAULT 'AVAILABLE',
    ADD COLUMN IF NOT EXISTS created_at     timestamptz NOT NULL DEFAULT now();

-- 6. saved_places table
CREATE TABLE IF NOT EXISTS saved_places (
    id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        uuid        NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    parking_lot_id uuid        NOT NULL REFERENCES parking_lot(id),
    saved_at       timestamptz NOT NULL DEFAULT now(),
    UNIQUE(user_id, parking_lot_id)
);

-- 7. refresh_tokens table
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    token      text        NOT NULL UNIQUE,
    user_id    uuid        NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    expires_at timestamptz NOT NULL,
    revoked    boolean     NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- 8. Ensure reservation_status enum has all required values
DO $$
BEGIN
    ALTER TYPE reservation_status ADD VALUE IF NOT EXISTS 'PENDING';
EXCEPTION WHEN others THEN null;
END$$;
DO $$
BEGIN
    ALTER TYPE reservation_status ADD VALUE IF NOT EXISTS 'ACTIVE';
EXCEPTION WHEN others THEN null;
END$$;
DO $$
BEGIN
    ALTER TYPE reservation_status ADD VALUE IF NOT EXISTS 'COMPLETED';
EXCEPTION WHEN others THEN null;
END$$;
DO $$
BEGIN
    ALTER TYPE reservation_status ADD VALUE IF NOT EXISTS 'CANCELLED';
EXCEPTION WHEN others THEN null;
END$$;
DO $$
BEGIN
    ALTER TYPE reservation_status ADD VALUE IF NOT EXISTS 'EXPIRED';
EXCEPTION WHEN others THEN null;
END$$;
