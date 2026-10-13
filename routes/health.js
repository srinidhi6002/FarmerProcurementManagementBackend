const express = require('express');
const router = express.Router();
const db = require('../db');

// Health & DB Connection Check
router.get('/', async (req, res) => {
    let dbStatus = 'Not Configured';
    let dbTime = null;

    if (db.pool) {
        try {
            const result = await db.query('SELECT NOW() as now_time');
            dbStatus = 'Connected to Neon PostgreSQL';
            dbTime = result.rows[0].now_time;
        } catch (err) {
            dbStatus = `Connection Error: ${err.message}`;
        }
    }

    res.json({
        status: 'Online',
        service: 'Smart Farmer Procurement API',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        database: {
            status: dbStatus,
            time: dbTime
        }
    });
});

// Auto-initialize DB Schema + Seed Data
// Also support GET so it can be triggered directly from a browser
router.get('/init-db', async (req, res) => {
    if (!db.pool) {
        return res.status(503).json({ success: false, message: 'Database not configured' });
    }

    try {
        // Create tables
        await db.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                full_name VARCHAR(120) NOT NULL,
                phone VARCHAR(15) UNIQUE NOT NULL,
                role VARCHAR(20) NOT NULL DEFAULT 'farmer',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await db.query(`
            CREATE TABLE IF NOT EXISTS farmers (
                id SERIAL PRIMARY KEY,
                user_id INT REFERENCES users(id) ON DELETE SET NULL,
                farmer_code VARCHAR(20) UNIQUE NOT NULL,
                name VARCHAR(120) NOT NULL,
                phone VARCHAR(15) UNIQUE NOT NULL,
                aadhaar VARCHAR(20) UNIQUE NOT NULL,
                village VARCHAR(100) NOT NULL,
                district VARCHAR(100) DEFAULT 'Lucknow',
                land_acres NUMERIC(6,2) NOT NULL DEFAULT 1.0,
                bank_name VARCHAR(120) NOT NULL,
                bank_acc VARCHAR(30) NOT NULL,
                ifsc VARCHAR(20) NOT NULL,
                status VARCHAR(20) NOT NULL DEFAULT 'Verified',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await db.query(`
            CREATE TABLE IF NOT EXISTS procurement_centers (
                id SERIAL PRIMARY KEY,
                center_code VARCHAR(20) UNIQUE NOT NULL,
                name VARCHAR(150) NOT NULL,
                district VARCHAR(100) NOT NULL,
                location VARCHAR(255) NOT NULL,
                max_daily_capacity_qtl NUMERIC(10,2) NOT NULL DEFAULT 5000.00,
                operating_hours VARCHAR(50) DEFAULT '08:00 AM - 06:00 PM',
                status VARCHAR(20) DEFAULT 'Active',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await db.query(`
            CREATE TABLE IF NOT EXISTS center_slots (
                id SERIAL PRIMARY KEY,
                center_id INT REFERENCES procurement_centers(id) ON DELETE CASCADE,
                slot_date DATE NOT NULL,
                time_window VARCHAR(50) NOT NULL,
                capacity_qtl NUMERIC(10,2) NOT NULL DEFAULT 1000.00,
                booked_qtl NUMERIC(10,2) NOT NULL DEFAULT 0.00,
                status VARCHAR(20) DEFAULT 'Available',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await db.query(`
            CREATE TABLE IF NOT EXISTS crop_msp (
                id SERIAL PRIMARY KEY,
                crop_name VARCHAR(100) UNIQUE NOT NULL,
                category VARCHAR(50) NOT NULL,
                msp_per_qtl NUMERIC(10,2) NOT NULL,
                max_moisture_pct NUMERIC(4,2) NOT NULL DEFAULT 17.0,
                effective_year VARCHAR(10) DEFAULT '2026-27',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await db.query(`
            CREATE TABLE IF NOT EXISTS slot_bookings (
                id SERIAL PRIMARY KEY,
                booking_token VARCHAR(30) UNIQUE NOT NULL,
                farmer_id INT REFERENCES farmers(id) ON DELETE CASCADE,
                center_id INT REFERENCES procurement_centers(id) ON DELETE CASCADE,
                slot_id INT REFERENCES center_slots(id) ON DELETE SET NULL,
                crop_name VARCHAR(100) NOT NULL,
                estimated_qtl NUMERIC(10,2) NOT NULL,
                vehicle_no VARCHAR(30),
                booking_date DATE NOT NULL DEFAULT CURRENT_DATE,
                queue_number INT,
                status VARCHAR(30) DEFAULT 'Booked',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await db.query(`
            CREATE TABLE IF NOT EXISTS procurement_inspections (
                id SERIAL PRIMARY KEY,
                booking_id INT REFERENCES slot_bookings(id) ON DELETE CASCADE,
                gross_weight_kg NUMERIC(10,2) NOT NULL,
                tare_weight_kg NUMERIC(10,2) NOT NULL,
                net_weight_qtl NUMERIC(10,2) NOT NULL,
                moisture_pct NUMERIC(4,2) NOT NULL,
                impurity_pct NUMERIC(4,2) NOT NULL,
                quality_grade VARCHAR(20) NOT NULL,
                rate_applied_per_qtl NUMERIC(10,2) NOT NULL,
                inspector_name VARCHAR(100) DEFAULT 'Chief Mandi Officer',
                inspected_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await db.query(`
            CREATE TABLE IF NOT EXISTS payouts (
                id SERIAL PRIMARY KEY,
                transaction_ref VARCHAR(50) UNIQUE NOT NULL,
                booking_id INT REFERENCES slot_bookings(id) ON DELETE CASCADE,
                farmer_id INT REFERENCES farmers(id) ON DELETE CASCADE,
                crop_name VARCHAR(100) NOT NULL,
                net_quantity_qtl NUMERIC(10,2) NOT NULL,
                msp_rate_per_qtl NUMERIC(10,2) NOT NULL,
                total_amount NUMERIC(12,2) NOT NULL,
                payment_status VARCHAR(20) DEFAULT 'Pending',
                payout_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await db.query(`
            CREATE TABLE IF NOT EXISTS notifications (
                id SERIAL PRIMARY KEY,
                farmer_id INT REFERENCES farmers(id) ON DELETE CASCADE,
                booking_id INT REFERENCES slot_bookings(id) ON DELETE CASCADE,
                type VARCHAR(50) NOT NULL,
                message TEXT NOT NULL,
                is_read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create indexes (ignore if exist)
        await db.query(`CREATE INDEX IF NOT EXISTS idx_farmers_phone ON farmers(phone)`);
        await db.query(`CREATE INDEX IF NOT EXISTS idx_bookings_token ON slot_bookings(booking_token)`);
        await db.query(`CREATE INDEX IF NOT EXISTS idx_bookings_status ON slot_bookings(status)`);
        await db.query(`CREATE INDEX IF NOT EXISTS idx_payouts_status ON payouts(payment_status)`);

        // Seed Crop MSP Rates (skip if already seeded)
        const mspCheck = await db.query(`SELECT COUNT(*) FROM crop_msp`);
        if (parseInt(mspCheck.rows[0].count) === 0) {
            await db.query(`
                INSERT INTO crop_msp (crop_name, category, msp_per_qtl, max_moisture_pct, effective_year) VALUES
                ('Paddy (Common)', 'Kharif Cereal', 2183.00, 17.0, '2026-27'),
                ('Paddy (Grade A)', 'Kharif Cereal', 2203.00, 17.0, '2026-27'),
                ('Wheat', 'Rabi Cereal', 2275.00, 12.0, '2026-27'),
                ('Maize', 'Coarse Grain', 2090.00, 14.0, '2026-27'),
                ('Mustard', 'Oilseed', 5650.00, 8.0, '2026-27'),
                ('Cotton', 'Commercial', 6620.00, 8.0, '2026-27')
            `);
        }

        // Seed Procurement Centers (skip if already seeded)
        const centersCheck = await db.query(`SELECT COUNT(*) FROM procurement_centers`);
        if (parseInt(centersCheck.rows[0].count) === 0) {
            await db.query(`
                INSERT INTO procurement_centers (center_code, name, district, location, max_daily_capacity_qtl, operating_hours, status) VALUES
                ('MND-LKO-01', 'Central Grain Mandi Lucknow', 'Lucknow', 'Transport Nagar, Lucknow', 8000.00, '08:00 AM - 06:00 PM', 'Active'),
                ('MND-LKP-02', 'Regional Procurement Hub Lakhimpur', 'Lakhimpur', 'Mandi Samiti Compound, Lakhimpur', 10000.00, '07:30 AM - 06:30 PM', 'Active'),
                ('MND-STP-03', 'Sitapur Grains & Oilseed Depot', 'Sitapur', 'GT Road, Sitapur', 6000.00, '08:00 AM - 05:00 PM', 'Active')
            `);

            // Seed time slots for today
            await db.query(`
                INSERT INTO center_slots (center_id, slot_date, time_window, capacity_qtl, booked_qtl, status) VALUES
                (1, CURRENT_DATE, '08:00 AM - 11:00 AM', 2000.00, 350.00, 'Available'),
                (1, CURRENT_DATE, '11:00 AM - 02:00 PM', 2000.00, 800.00, 'Available'),
                (1, CURRENT_DATE, '02:00 PM - 05:00 PM', 2000.00, 1500.00, 'Available'),
                (2, CURRENT_DATE, '08:00 AM - 11:00 AM', 2500.00, 210.00, 'Available'),
                (3, CURRENT_DATE, '09:00 AM - 12:00 PM', 1500.00, 0.00, 'Available')
            `);
        }

        // Seed Demo Farmers & Transactions (skip if already seeded)
        const farmersCheck = await db.query(`SELECT COUNT(*) FROM farmers`);
        if (parseInt(farmersCheck.rows[0].count) === 0) {
            await db.query(`
                INSERT INTO users (full_name, phone, role) VALUES
                ('Rameshwar Prasad', '9876543210', 'farmer'),
                ('Suresh Kumar Patel', '9123456789', 'farmer'),
                ('Baldev Singh', '9988776655', 'farmer'),
                ('Sunita Devi', '9765432109', 'farmer'),
                ('Mandi Administrator', '9000000000', 'admin')
            `);

            await db.query(`
                INSERT INTO farmers (user_id, farmer_code, name, phone, aadhaar, village, district, land_acres, bank_name, bank_acc, ifsc, status) VALUES
                (1, 'F-1001', 'Rameshwar Prasad', '9876543210', '4521-8890-1234', 'Rampur', 'Lucknow', 5.5, 'State Bank of India', '30894726194', 'SBIN0001234', 'Verified'),
                (2, 'F-1002', 'Suresh Kumar Patel', '9123456789', '6712-4411-9081', 'Sonpur', 'Lucknow', 3.2, 'Punjab National Bank', '50192847162', 'PUNB0109200', 'Verified'),
                (3, 'F-1003', 'Baldev Singh', '9988776655', '9910-3344-5566', 'Krishnapur', 'Lakhimpur', 8.0, 'HDFC Bank', '91827364501', 'HDFC0000412', 'Verified'),
                (4, 'F-1004', 'Sunita Devi', '9765432109', '2234-5678-9012', 'Devpur', 'Sitapur', 4.1, 'Bank of Baroda', '10928374651', 'BARB0DEVPUR', 'Verified')
            `);

            await db.query(`
                INSERT INTO slot_bookings (booking_token, farmer_id, center_id, slot_id, crop_name, estimated_qtl, vehicle_no, booking_date, queue_number, status) VALUES
                ('TKN-8001', 1, 1, 1, 'Paddy (Common)', 145.00, 'UP 32 AB 1234', CURRENT_DATE, 1, 'Completed'),
                ('TKN-8002', 2, 1, 1, 'Wheat', 88.50, 'UP 32 XY 9876', CURRENT_DATE, 2, 'Inspected'),
                ('TKN-8003', 3, 2, 4, 'Paddy (Grade A)', 210.00, 'PB 10 Z 4411', CURRENT_DATE, 3, 'Booked')
            `);

            await db.query(`
                INSERT INTO procurement_inspections (booking_id, gross_weight_kg, tare_weight_kg, net_weight_qtl, moisture_pct, impurity_pct, quality_grade, rate_applied_per_qtl, inspector_name) VALUES
                (1, 18700.00, 4200.00, 145.00, 14.2, 1.0, 'Grade A', 2183.00, 'Senior Inspector V. K. Sharma'),
                (2, 12450.00, 3600.00, 88.50, 11.5, 0.8, 'Grade A', 2275.00, 'Senior Inspector V. K. Sharma')
            `);

            await db.query(`
                INSERT INTO payouts (transaction_ref, booking_id, farmer_id, crop_name, net_quantity_qtl, msp_rate_per_qtl, total_amount, payment_status) VALUES
                ('DBT-2026-9001', 1, 1, 'Paddy (Common)', 145.00, 2183.00, 316535.00, 'Disbursed'),
                ('DBT-2026-9002', 2, 2, 'Wheat', 88.50, 2275.00, 201337.50, 'Approved'),
                ('DBT-2026-9003', 3, 3, 'Paddy (Grade A)', 210.00, 2203.00, 462630.00, 'Pending')
            `);

            await db.query(`
                INSERT INTO notifications (farmer_id, booking_id, type, message) VALUES
                (1, 1, 'Payment_Disbursed', 'Your DBT payout of Rs. 3,16,535.00 for Paddy (Common) has been credited to your SBI A/C ending 6194.'),
                (2, 2, 'Queue_Update', 'Your token TKN-8002 quality verification has passed. Payment calculation approved.'),
                (3, 3, 'Queue_Update', 'Your slot booking TKN-8003 is confirmed at Regional Procurement Hub Lakhimpur.')
            `);
        }

        return res.json({
            success: true,
            message: 'Database schema and seed data initialized successfully! All tables are ready.',
            tables: ['users', 'farmers', 'procurement_centers', 'center_slots', 'crop_msp', 'slot_bookings', 'procurement_inspections', 'payouts', 'notifications']
        });

    } catch (err) {
        console.error('DB Init Error:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
