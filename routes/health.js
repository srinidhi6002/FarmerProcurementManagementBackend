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

module.exports = router;
