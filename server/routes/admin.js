const express = require('express');
const router = express.Router();
const db = require('../db');

// GET Executive Dashboard Statistics
router.get('/dashboard-stats', async (req, res) => {
    try {
        if (db.pool) {
            const farmersCountRes = await db.query('SELECT COUNT(*) FROM farmers');
            const totalProcurementRes = await db.query('SELECT COALESCE(SUM(net_weight_qtl), 0) AS total_qtl FROM procurement_inspections');
            const totalPayoutsRes = await db.query('SELECT COALESCE(SUM(total_amount), 0) AS total_amount FROM payouts WHERE payment_status = \'Disbursed\'');
            const pendingPayoutsRes = await db.query('SELECT COALESCE(SUM(total_amount), 0) AS pending_amount FROM payouts WHERE payment_status = \'Approved\' OR payment_status = \'Pending\'');
            const queueCountRes = await db.query('SELECT COUNT(*) FROM slot_bookings WHERE status = \'Booked\' OR status = \'Arrived\'');

            return res.json({
                success: true,
                stats: {
                    totalFarmers: parseInt(farmersCountRes.rows[0].count),
                    totalProcurementQtl: parseFloat(totalProcurementRes.rows[0].total_qtl).toFixed(2),
                    totalDisbursedPayouts: parseFloat(totalPayoutsRes.rows[0].total_amount).toFixed(2),
                    totalPendingPayouts: parseFloat(pendingPayoutsRes.rows[0].pending_amount).toFixed(2),
                    activeQueueCount: parseInt(queueCountRes.rows[0].count)
                }
            });
        } else {
            return res.json({
                success: true,
                stats: {
                    totalFarmers: 4,
                    totalProcurementQtl: "443.50",
                    totalDisbursedPayouts: "316535.00",
                    totalPendingPayouts: "657037.50",
                    activeQueueCount: 3
                }
            });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET Crop MSP Rates
router.get('/msp', async (req, res) => {
    try {
        if (db.pool) {
            const result = await db.query('SELECT * FROM crop_msp ORDER BY id ASC');
            return res.json({ success: true, rates: result.rows });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// PUT Update Crop MSP Rate
router.put('/msp/:id', async (req, res) => {
    const { id } = req.params;
    const { mspPerQtl, maxMoisturePct } = req.body;

    try {
        if (db.pool) {
            const result = await db.query(
                'UPDATE crop_msp SET msp_per_qtl = $1, max_moisture_pct = $2 WHERE id = $3 RETURNING *',
                [mspPerQtl, maxMoisturePct, id]
            );
            return res.json({ success: true, message: 'MSP rate updated successfully', crop: result.rows[0] });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
