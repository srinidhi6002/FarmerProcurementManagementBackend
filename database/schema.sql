-- ============================================================
-- SMART FARMER PROCUREMENT SYSTEM - NEON POSTGRESQL SCHEMA
-- ============================================================

-- Drop tables if exists (for clean re-runs)
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS payouts CASCADE;
DROP TABLE IF EXISTS procurement_inspections CASCADE;
DROP TABLE IF EXISTS slot_bookings CASCADE;
DROP TABLE IF EXISTS center_slots CASCADE;
DROP TABLE IF EXISTS procurement_centers CASCADE;
DROP TABLE IF EXISTS crop_msp CASCADE;
DROP TABLE IF EXISTS farmers CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 1. USERS & AUTHENTICATION TABLE
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(120) NOT NULL,
    phone VARCHAR(15) UNIQUE NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'farmer', -- 'farmer', 'admin', 'inspector'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. FARMERS PROFILE TABLE
CREATE TABLE farmers (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    farmer_code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(120) NOT NULL,
    phone VARCHAR(15) UNIQUE NOT NULL,
    aadhaar VARCHAR(20) UNIQUE NOT NULL,
    village VARCHAR(100) NOT NULL,
    district VARCHAR(100) DEFAULT 'Lucknow',
    land_acres NUMERIC(6, 2) NOT NULL DEFAULT 1.0,
    bank_name VARCHAR(120) NOT NULL,
    bank_acc VARCHAR(30) NOT NULL,
    ifsc VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Verified', -- 'Pending', 'Verified', 'Rejected'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. PROCUREMENT CENTERS (MANDIS)
CREATE TABLE procurement_centers (
    id SERIAL PRIMARY KEY,
    center_code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    district VARCHAR(100) NOT NULL,
    location VARCHAR(255) NOT NULL,
    max_daily_capacity_qtl NUMERIC(10, 2) NOT NULL DEFAULT 5000.00,
    operating_hours VARCHAR(50) DEFAULT '08:00 AM - 06:00 PM',
    status VARCHAR(20) DEFAULT 'Active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. CENTER TIME SLOTS
CREATE TABLE center_slots (
    id SERIAL PRIMARY KEY,
    center_id INT REFERENCES procurement_centers(id) ON DELETE CASCADE,
    slot_date DATE NOT NULL,
    time_window VARCHAR(50) NOT NULL, -- e.g. '08:00 AM - 11:00 AM'
    capacity_qtl NUMERIC(10, 2) NOT NULL DEFAULT 1000.00,
    booked_qtl NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(20) DEFAULT 'Available', -- 'Available', 'Full', 'Closed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. MINIMUM SUPPORT PRICE (MSP) TABLE
CREATE TABLE crop_msp (
    id SERIAL PRIMARY KEY,
    crop_name VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(50) NOT NULL,
    msp_per_qtl NUMERIC(10, 2) NOT NULL,
    max_moisture_pct NUMERIC(4, 2) NOT NULL DEFAULT 17.0,
    effective_year VARCHAR(10) DEFAULT '2026-27',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. SLOT BOOKINGS TABLE
CREATE TABLE slot_bookings (
    id SERIAL PRIMARY KEY,
    booking_token VARCHAR(30) UNIQUE NOT NULL,
    farmer_id INT REFERENCES farmers(id) ON DELETE CASCADE,
    center_id INT REFERENCES procurement_centers(id) ON DELETE CASCADE,
    slot_id INT REFERENCES center_slots(id) ON DELETE SET NULL,
    crop_name VARCHAR(100) NOT NULL,
    estimated_qtl NUMERIC(10, 2) NOT NULL,
    vehicle_no VARCHAR(30),
    booking_date DATE NOT NULL DEFAULT CURRENT_DATE,
    queue_number INT,
    status VARCHAR(30) DEFAULT 'Booked', -- 'Booked', 'Arrived', 'Inspected', 'Completed', 'Cancelled'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. QUALITY & WEIGHBRIDGE INSPECTIONS TABLE
CREATE TABLE procurement_inspections (
    id SERIAL PRIMARY KEY,
    booking_id INT REFERENCES slot_bookings(id) ON DELETE CASCADE,
    gross_weight_kg NUMERIC(10, 2) NOT NULL,
    tare_weight_kg NUMERIC(10, 2) NOT NULL,
    net_weight_qtl NUMERIC(10, 2) NOT NULL,
    moisture_pct NUMERIC(4, 2) NOT NULL,
    impurity_pct NUMERIC(4, 2) NOT NULL,
    quality_grade VARCHAR(20) NOT NULL, -- 'Grade A', 'Grade B', 'Rejected'
    rate_applied_per_qtl NUMERIC(10, 2) NOT NULL,
    inspector_name VARCHAR(100) DEFAULT 'Chief Mandi Officer',
    inspected_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. PAYOUTS & DIRECT BENEFIT TRANSFER (DBT) TABLE
CREATE TABLE payouts (
    id SERIAL PRIMARY KEY,
    transaction_ref VARCHAR(50) UNIQUE NOT NULL,
    booking_id INT REFERENCES slot_bookings(id) ON DELETE CASCADE,
    farmer_id INT REFERENCES farmers(id) ON DELETE CASCADE,
    crop_name VARCHAR(100) NOT NULL,
    net_quantity_qtl NUMERIC(10, 2) NOT NULL,
    msp_rate_per_qtl NUMERIC(10, 2) NOT NULL,
    total_amount NUMERIC(12, 2) NOT NULL,
    payment_status VARCHAR(20) DEFAULT 'Pending', -- 'Pending', 'Approved', 'Disbursed', 'Rejected'
    payout_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. NOTIFICATIONS & EXCEPTION LOGS TABLE
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    farmer_id INT REFERENCES farmers(id) ON DELETE CASCADE,
    booking_id INT REFERENCES slot_bookings(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'Queue_Update', 'Quality_Issue', 'Payment_Disbursed', 'Slot_Reallocated'
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- INDEXES FOR FAST QUERYING
CREATE INDEX idx_farmers_phone ON farmers(phone);
CREATE INDEX idx_bookings_token ON slot_bookings(booking_token);
CREATE INDEX idx_bookings_status ON slot_bookings(status);
CREATE INDEX idx_payouts_status ON payouts(payment_status);
