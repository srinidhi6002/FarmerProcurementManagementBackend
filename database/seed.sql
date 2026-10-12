-- ============================================================
-- SMART FARMER PROCUREMENT SYSTEM - SEED DATA SCRIPT
-- ============================================================

-- 1. SEED USERS
INSERT INTO users (full_name, phone, role) VALUES
('Rameshwar Prasad', '9876543210', 'farmer'),
('Suresh Kumar Patel', '9123456789', 'farmer'),
('Baldev Singh', '9988776655', 'farmer'),
('Sunita Devi', '9765432109', 'farmer'),
('Mandi Administrator', '9000000000', 'admin');

-- 2. SEED FARMERS
INSERT INTO farmers (user_id, farmer_code, name, phone, aadhaar, village, district, land_acres, bank_name, bank_acc, ifsc, status) VALUES
(1, 'F-1001', 'Rameshwar Prasad', '9876543210', '4521-8890-1234', 'Rampur', 'Lucknow', 5.5, 'State Bank of India', '30894726194', 'SBIN0001234', 'Verified'),
(2, 'F-1002', 'Suresh Kumar Patel', '9123456789', '6712-4411-9081', 'Sonpur', 'Lucknow', 3.2, 'Punjab National Bank', '50192847162', 'PUNB0109200', 'Verified'),
(3, 'F-1003', 'Baldev Singh', '9988776655', '9910-3344-5566', 'Krishnapur', 'Lakhimpur', 8.0, 'HDFC Bank', '91827364501', 'HDFC0000412', 'Verified'),
(4, 'F-1004', 'Sunita Devi', '9765432109', '1234-5678-9012', 'Devpur', 'Sitapur', 4.1, 'Bank of Baroda', '10928374651', 'BARB0DEVPUR', 'Verified');

-- 3. SEED CROP MSP RATES
INSERT INTO crop_msp (crop_name, category, msp_per_qtl, max_moisture_pct, effective_year) VALUES
('Paddy (Common)', 'Kharif Cereal', 2183.00, 17.0, '2026-27'),
('Paddy (Grade A)', 'Kharif Cereal', 2203.00, 17.0, '2026-27'),
('Wheat', 'Rabi Cereal', 2275.00, 12.0, '2026-27'),
('Maize', 'Coarse Grain', 2090.00, 14.0, '2026-27'),
('Mustard', 'Oilseed', 5650.00, 8.0, '2026-27'),
('Cotton', 'Commercial', 6620.00, 8.0, '2026-27');

-- 4. SEED PROCUREMENT CENTERS (MANDIS)
INSERT INTO procurement_centers (center_code, name, district, location, max_daily_capacity_qtl, operating_hours, status) VALUES
('MND-LKO-01', 'Central Grain Mandi Lucknow', 'Lucknow', 'Transport Nagar, Lucknow', 8000.00, '08:00 AM - 06:00 PM', 'Active'),
('MND-LKP-02', 'Regional Procurement Hub Lakhimpur', 'Lakhimpur', 'Mandi Samiti Compound, Lakhimpur', 10000.00, '07:30 AM - 06:30 PM', 'Active'),
('MND-STP-03', 'Sitapur Grains & Oilseed Depot', 'Sitapur', 'GT Road, Sitapur', 6000.00, '08:00 AM - 05:00 PM', 'Active');

-- 5. SEED CENTER TIME SLOTS
INSERT INTO center_slots (center_id, slot_date, time_window, capacity_qtl, booked_qtl, status) VALUES
(1, CURRENT_DATE, '08:00 AM - 11:00 AM', 2000.00, 350.00, 'Available'),
(1, CURRENT_DATE, '11:00 AM - 02:00 PM', 2000.00, 800.00, 'Available'),
(1, CURRENT_DATE, '02:00 PM - 05:00 PM', 2000.00, 1500.00, 'Available'),
(2, CURRENT_DATE, '08:00 AM - 11:00 AM', 2500.00, 210.00, 'Available'),
(3, CURRENT_DATE, '09:00 AM - 12:00 PM', 1500.00, 0.00, 'Available');

-- 6. SEED SLOT BOOKINGS
INSERT INTO slot_bookings (booking_token, farmer_id, center_id, slot_id, crop_name, estimated_qtl, vehicle_no, booking_date, queue_number, status) VALUES
('TKN-8001', 1, 1, 1, 'Paddy (Common)', 145.00, 'UP 32 AB 1234', CURRENT_DATE, 1, 'Completed'),
('TKN-8002', 2, 1, 1, 'Wheat', 88.50, 'UP 32 XY 9876', CURRENT_DATE, 2, 'Inspected'),
('TKN-8003', 3, 2, 4, 'Paddy (Grade A)', 210.00, 'PB 10 Z 4411', CURRENT_DATE, 3, 'Booked');

-- 7. SEED INSPECTIONS
INSERT INTO procurement_inspections (booking_id, gross_weight_kg, tare_weight_kg, net_weight_qtl, moisture_pct, impurity_pct, quality_grade, rate_applied_per_qtl, inspector_name) VALUES
(1, 18700.00, 4200.00, 145.00, 14.2, 1.0, 'Grade A', 2183.00, 'Senior Inspector V. K. Sharma'),
(2, 12450.00, 3600.00, 88.50, 11.5, 0.8, 'Grade A', 2275.00, 'Senior Inspector V. K. Sharma');

-- 8. SEED PAYOUTS
INSERT INTO payouts (transaction_ref, booking_id, farmer_id, crop_name, net_quantity_qtl, msp_rate_per_qtl, total_amount, payment_status) VALUES
('DBT-2026-9001', 1, 1, 'Paddy (Common)', 145.00, 2183.00, 316535.00, 'Disbursed'),
('DBT-2026-9002', 2, 2, 'Wheat', 88.50, 2275.00, 201337.50, 'Approved'),
('DBT-2026-9003', 3, 3, 'Paddy (Grade A)', 210.00, 2203.00, 462630.00, 'Pending');

-- 9. SEED NOTIFICATIONS
INSERT INTO notifications (farmer_id, booking_id, type, message) VALUES
(1, 1, 'Payment_Disbursed', 'Your DBT payout of Rs. 3,16,535.00 for Paddy (Common) has been credited to your SBI A/C ending 6194.'),
(2, 2, 'Queue_Update', 'Your token TKN-8002 quality verification has passed. Payment calculation approved.'),
(3, 3, 'Queue_Update', 'Your slot booking TKN-8003 is confirmed at Regional Procurement Hub Lakhimpur.');
