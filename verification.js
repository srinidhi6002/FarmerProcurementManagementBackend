const express = require('express');
const router = express.Router();
let db;
try { db = require('./db'); } catch (e) { db = require('../db'); }

// POST Submit Quality & Weighbridge Verification
router.post('/inspect', async (req, res) => {
    const { bookingId, grossKg, tareKg, moisturePct, impurityPct, inspectorName } = req.body;

    if (!bookingId || grossKg === undefined || tareKg === undefined || moisturePct === undefined) {
        return res.status(400).json({ success: false, message: 'Booking ID, Gross Weight, Tare Weight, and Moisture % are required' });
    }

    const parsedGross = parseFloat(grossKg);
    const parsedTare = parseFloat(tareKg);
    const moisture = parseFloat(moisturePct);
    const impurity = parseFloat(impurityPct || 0);

    if (isNaN(parsedGross) || parsedGross <= 0) {
        return res.status(400).json({ success: false, message: 'Gross weight must be a positive number greater than 0 kg' });
    }

    if (isNaN(parsedTare) || parsedTare < 0) {
        return res.status(400).json({ success: false, message: 'Tare weight cannot be negative' });
    }

    const netKg = parsedGross - parsedTare;
    if (netKg <= 0) {
        return res.status(400).json({ success: false, message: 'Gross weight must be strictly greater than tare weight (Net weight cannot be zero or negative)' });
    }

    if (isNaN(moisture) || moisture < 0 || moisture > 50) {
        return res.status(400).json({ success: false, message: 'Moisture percentage must be between 0% and 50%' });
    }

    if (isNaN(impurity) || impurity < 0 || impurity > 30) {
        return res.status(400).json({ success: false, message: 'Impurity percentage must be between 0% and 30%' });
    }

    const netQtl = parseFloat((netKg / 100).toFixed(2));

    try {
        if (db && db.pool) {
            const bookingRes = await db.query('SELECT * FROM slot_bookings WHERE id = $1', [bookingId]);
            if (bookingRes.rows.length === 0) {
                return res.status(404).json({ success: false, message: 'Booking not found' });
            }

            const booking = bookingRes.rows[0];

            const mspRes = await db.query('SELECT * FROM crop_msp WHERE crop_name = $1', [booking.crop_name]);
            let baseMsp = 2183.00;
            let maxMoisture = 17.0;

            if (mspRes.rows.length > 0) {
                baseMsp = parseFloat(mspRes.rows[0].msp_per_qtl);
                maxMoisture = parseFloat(mspRes.rows[0].max_moisture_pct);
            }

            let qualityGrade = 'Grade A';
            let finalRate = baseMsp;

            if (moisture > maxMoisture || impurity > 2.5) {
                qualityGrade = 'Rejected';
                finalRate = 0;
            } else if (moisture > maxMoisture - 2.0 || impurity > 1.5) {
                qualityGrade = 'Grade B';
                finalRate = baseMsp - 50.00;
            }

            const totalPayout = parseFloat((netQtl * finalRate).toFixed(2));

            const inspectionRes = await db.query(
                `INSERT INTO procurement_inspections 
                (booking_id, gross_weight_kg, tare_weight_kg, net_weight_qtl, moisture_pct, impurity_pct, quality_grade, rate_applied_per_qtl, inspector_name)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
                [bookingId, grossKg, tareKg, netQtl, moisture, impurity, qualityGrade, finalRate, inspectorName || 'Chief Mandi Inspector']
            );

            const newBookingStatus = qualityGrade === 'Rejected' ? 'Cancelled' : 'Inspected';
            await db.query('UPDATE slot_bookings SET status = $1 WHERE id = $2', [newBookingStatus, bookingId]);

            const txnRef = `DBT-2026-${Math.floor(9000 + Math.random() * 1000)}`;
            const payoutRes = await db.query(
                `INSERT INTO payouts (transaction_ref, booking_id, farmer_id, crop_name, net_quantity_qtl, msp_rate_per_qtl, total_amount, payment_status)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                 ON CONFLICT (transaction_ref) DO UPDATE SET total_amount = EXCLUDED.total_amount
                 RETURNING *`,
                [txnRef, bookingId, booking.farmer_id, booking.crop_name, netQtl, finalRate, totalPayout, qualityGrade === 'Rejected' ? 'Rejected' : 'Approved']
            );

            await db.query(
                'INSERT INTO notifications (farmer_id, booking_id, type, message) VALUES ($1, $2, $3, $4)',
                [booking.farmer_id, bookingId, 'Quality_Verified', `Inspection completed: ${netQtl} Quintals verified (${qualityGrade}). Estimated payout: Rs. ${totalPayout.toLocaleString()}`]
            );

            return res.status(201).json({
                success: true,
                message: 'Quality & weight verification submitted successfully',
                inspection: inspectionRes.rows[0],
                payout: payoutRes.rows[0]
            });
        }
    } catch (err) {
        console.error('Verification Error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
