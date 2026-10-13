const express = require('express');
const router = express.Router();
let db;
try { db = require('./db'); } catch (e) { db = require('../db'); }

// GET all payouts
router.get('/', async (req, res) => {
    try {
        if (db && db.pool) {
            const queryText = `
                SELECT 
                    p.id,
                    p.transaction_ref AS "txnRef",
                    p.booking_id AS "bookingId",
                    p.farmer_id AS "farmerId",
                    p.crop_name AS crop,
                    p.net_quantity_qtl AS "netQtl",
                    p.msp_rate_per_qtl AS "ratePerQtl",
                    p.total_amount AS "totalPayout",
                    p.payment_status AS "paymentStatus",
                    p.payout_date AS "payoutDate",
                    f.name AS "farmerName",
                    f.farmer_code AS "farmerCode",
                    f.bank_name AS "bankName",
                    f.bank_acc AS "bankAcc",
                    f.ifsc,
                    b.booking_token AS token
                FROM payouts p
                JOIN farmers f ON p.farmer_id = f.id
                JOIN slot_bookings b ON p.booking_id = b.id
                ORDER BY p.id DESC;
            `;
            const result = await db.query(queryText);
            return res.json({ success: true, count: result.rows.length, payouts: result.rows });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// PUT Disburse / Process DBT Payment
router.put('/:id/disburse', async (req, res) => {
    const { id } = req.params;

    try {
        if (db && db.pool) {
            const updateRes = await db.query(
                `UPDATE payouts 
                 SET payment_status = 'Disbursed', updated_at = CURRENT_TIMESTAMP 
                 WHERE id = $1 RETURNING *`,
                [id]
            );

            if (updateRes.rows.length === 0) {
                return res.status(404).json({ success: false, message: 'Payout record not found' });
            }

            const payout = updateRes.rows[0];

            await db.query('UPDATE slot_bookings SET status = \'Completed\' WHERE id = $1', [payout.booking_id]);

            await db.query(
                `INSERT INTO notifications (farmer_id, booking_id, type, message)
                 VALUES ($1, $2, 'Payment_Disbursed', $3)`,
                [payout.farmer_id, payout.booking_id, `DBT Payout of Rs. ${parseFloat(payout.total_amount).toLocaleString()} successfully processed and disbursed to your registered bank account.`]
            );

            return res.json({
                success: true,
                message: 'DBT Payment successfully disbursed to farmer bank account',
                payout
            });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
