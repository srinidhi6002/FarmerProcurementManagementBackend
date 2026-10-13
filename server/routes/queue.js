const express = require('express');
const router = express.Router();
const db = require('../db');

// GET Live Queue List
router.get('/', async (req, res) => {
    try {
        if (db.pool) {
            const queryText = `
                SELECT 
                    b.id,
                    b.booking_token AS token,
                    b.booking_date,
                    b.queue_number,
                    b.crop_name AS crop,
                    b.estimated_qtl AS "quantityQtl",
                    b.vehicle_no AS vehicle,
                    b.status,
                    f.id AS "farmerId",
                    f.farmer_code AS "farmerCode",
                    f.name AS "farmerName",
                    c.name AS "centerName",
                    p.payment_status AS "paymentStatus",
                    p.total_amount AS "totalPayout"
                FROM slot_bookings b
                JOIN farmers f ON b.farmer_id = f.id
                LEFT JOIN procurement_centers c ON b.center_id = c.id
                LEFT JOIN payouts p ON p.booking_id = b.id
                ORDER BY b.id DESC;
            `;
            const result = await db.query(queryText);
            return res.json({ success: true, count: result.rows.length, queue: result.rows });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// PUT Update Queue Status (e.g. 'Arrived', 'Inspected', 'Completed')
router.put('/:id/status', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    try {
        if (db.pool) {
            const updateRes = await db.query(
                'UPDATE slot_bookings SET status = $1 WHERE id = $2 RETURNING *',
                [status, id]
            );

            if (updateRes.rows.length === 0) {
                return res.status(404).json({ success: false, message: 'Booking not found' });
            }

            const booking = updateRes.rows[0];

            // Send system notification
            await db.query(
                'INSERT INTO notifications (farmer_id, booking_id, type, message) VALUES ($1, $2, $3, $4)',
                [booking.farmer_id, booking.id, 'Queue_Update', `Queue status updated to '${status}' for Token ${booking.booking_token}.`]
            );

            return res.json({ success: true, message: `Queue status updated to ${status}`, booking });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
