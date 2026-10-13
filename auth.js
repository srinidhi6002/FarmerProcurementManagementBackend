const express = require('express');
const router = express.Router();
let db;
try { db = require('./db'); } catch (e) { db = require('../db'); }

// Register / Login Farmer or Admin
router.post('/login', async (req, res) => {
    const { phone, role } = req.body;

    if (!phone) {
        return res.status(400).json({ success: false, message: 'Phone number is required' });
    }

    try {
        if (db && db.pool) {
            let userRes = await db.query('SELECT * FROM users WHERE phone = $1', [phone]);
            let user;

            if (userRes.rows.length === 0) {
                const newRole = role || 'farmer';
                const name = newRole === 'admin' ? 'Mandi Admin' : `Farmer (${phone.slice(-4)})`;
                const insertRes = await db.query(
                    'INSERT INTO users (full_name, phone, role) VALUES ($1, $2, $3) RETURNING *',
                    [name, phone, newRole]
                );
                user = insertRes.rows[0];

                if (newRole === 'farmer') {
                    const farmerCode = `F-${Math.floor(1000 + Math.random() * 9000)}`;
                    await db.query(
                        'INSERT INTO farmers (user_id, farmer_code, name, phone, aadhaar, village, bank_name, bank_acc, ifsc) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
                        [user.id, farmerCode, name, phone, `4521-${Math.floor(1000 + Math.random() * 9000)}-1234`, 'Rampur', 'State Bank of India', '30894726194', 'SBIN0001234']
                    );
                }
            } else {
                user = userRes.rows[0];
            }

            return res.json({
                success: true,
                message: 'Login successful',
                user
            });
        } else {
            return res.json({
                success: true,
                message: 'Logged in (Local Mode)',
                user: { id: 1, full_name: 'Rameshwar Prasad', phone, role: role || 'farmer' }
            });
        }
    } catch (err) {
        console.error('Login Auth Error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
