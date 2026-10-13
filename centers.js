const express = require('express');
const router = express.Router();
let db;
try { db = require('./db'); } catch (e) { db = require('../db'); }

// GET all Procurement Centers (Mandis)
router.get('/', async (req, res) => {
    try {
        if (db && db.pool) {
            const result = await db.query('SELECT * FROM procurement_centers WHERE status = \'Active\' ORDER BY id ASC');
            return res.json({ success: true, centers: result.rows });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET slots for a specific center
router.get('/:centerId/slots', async (req, res) => {
    const { centerId } = req.params;
    try {
        if (db && db.pool) {
            const result = await db.query(
                'SELECT * FROM center_slots WHERE center_id = $1 ORDER BY slot_date ASC, time_window ASC',
                [centerId]
            );
            return res.json({ success: true, slots: result.rows });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// POST Book a Procurement Slot (Get Booking Token ID)
router.post('/book-slot', async (req, res) => {
    const { farmerId, centerId, slotId, cropName, estimatedQtl, vehicleNo } = req.body;

    if (!farmerId || !centerId || !cropName || estimatedQtl === undefined) {
        return res.status(400).json({ success: false, message: 'Farmer ID, Center ID, Crop Name, and Quantity are required' });
    }

    const parsedQtl = parseFloat(estimatedQtl);
    if (isNaN(parsedQtl) || parsedQtl <= 0 || parsedQtl > 10000) {
        return res.status(400).json({ success: false, message: 'Estimated Quantity must be a positive number between 0.1 and 10,000 Quintals' });
    }

    const cleanVehicle = (vehicleNo || 'UP 32 AB 1234').toString().trim().toUpperCase();
    const bookingToken = `TKN-${Math.floor(8000 + Math.random() * 1000)}`;

    try {
        if (db && db.pool) {
            if (slotId) {
                const slotCheck = await db.query('SELECT * FROM center_slots WHERE id = $1', [slotId]);
                if (slotCheck.rows.length > 0) {
                    const slot = slotCheck.rows[0];
                    if (parseFloat(slot.booked_qtl) + parseFloat(estimatedQtl) > parseFloat(slot.capacity_qtl)) {
                        return res.status(400).json({
                            success: false,
                            exception: 'Slot Unavailable',
                            message: 'Selected slot capacity exceeded. Please select another slot.'
                        });
                    }
                    await db.query(
                        'UPDATE center_slots SET booked_qtl = booked_qtl + $1 WHERE id = $2',
                        [estimatedQtl, slotId]
                    );
                }
            }

            const bookingRes = await db.query(
                `INSERT INTO slot_bookings (booking_token, farmer_id, center_id, slot_id, crop_name, estimated_qtl, vehicle_no, queue_number, status)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, (SELECT COALESCE(MAX(queue_number), 0) + 1 FROM slot_bookings WHERE booking_date = CURRENT_DATE), 'Booked')
                 RETURNING *`,
                [bookingToken, farmerId, centerId, slotId || null, cropName, estimatedQtl, vehicleNo || 'UP 32 AB 0000']
            );

            const newBooking = bookingRes.rows[0];

            await db.query(
                `INSERT INTO notifications (farmer_id, booking_id, type, message)
                 VALUES ($1, $2, 'Slot_Booked', $3)`,
                [farmerId, newBooking.id, `Slot booking confirmed! Your Token ID is ${bookingToken}.`]
            );

            return res.status(201).json({
                success: true,
                message: 'Slot booked successfully',
                bookingToken,
                booking: newBooking
            });
        } else {
            return res.status(201).json({
                success: true,
                message: 'Slot booked (Local)',
                bookingToken,
                booking: { booking_token: bookingToken, crop_name: cropName, estimated_qtl: estimatedQtl }
            });
        }
    } catch (err) {
        console.error('Slot Booking Error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
