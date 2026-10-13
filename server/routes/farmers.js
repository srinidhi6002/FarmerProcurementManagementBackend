const express = require('express');
const router = express.Router();
const db = require('../db');

// GET all farmers
router.get('/', async (req, res) => {
    try {
        if (db.pool) {
            const result = await db.query('SELECT * FROM farmers ORDER BY id DESC');
            return res.json({ success: true, count: result.rows.length, farmers: result.rows });
        } else {
            return res.json({ success: true, count: 0, farmers: [] });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET farmer by ID or Code
router.get('/:id', async (req, res) => {
    try {
        if (db.pool) {
            const { id } = req.params;
            const result = await db.query('SELECT * FROM farmers WHERE id = $1 OR farmer_code = $2', [isNaN(id) ? -1 : parseInt(id), id]);
            if (result.rows.length === 0) {
                return res.status(404).json({ success: false, message: 'Farmer not found' });
            }
            return res.json({ success: true, farmer: result.rows[0] });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// POST Register new Farmer Profile
router.post('/', async (req, res) => {
    let { name, phone, aadhaar, village, landAcres, bankName, bankAcc, ifsc } = req.body;

    name = (name || '').trim();
    phone = (phone || '').toString().replace(/\D/g, '');
    const cleanAadhaar = (aadhaar || '').toString().replace(/\D/g, '');
    village = (village || '').trim() || 'Rampur';
    bankName = (bankName || '').trim() || 'State Bank of India';
    bankAcc = (bankAcc || '').toString().replace(/\D/g, '');
    ifsc = (ifsc || '').trim().toUpperCase();
    const parsedLand = parseFloat(landAcres);

    // 1. Full Name Validation
    if (!name || name.length < 3) {
        return res.status(400).json({ success: false, field: 'name', message: 'Full Name must be at least 3 characters' });
    }
    if (!/^[a-zA-Z\s.]+$/.test(name)) {
        return res.status(400).json({ success: false, field: 'name', message: 'Full Name can only contain alphabetic characters and spaces' });
    }

    // 2. Phone Number Validation (10 digits starting with 6-9)
    if (!phone || phone.length !== 10 || !/^[6-9]\d{9}$/.test(phone)) {
        return res.status(400).json({ success: false, field: 'phone', message: 'Invalid phone number. Must be a 10-digit Indian mobile number starting with 6, 7, 8, or 9' });
    }

    // 3. Aadhaar Number Validation (12 digits, cannot start with 0 or 1)
    if (!cleanAadhaar || cleanAadhaar.length !== 12 || !/^[2-9]\d{11}$/.test(cleanAadhaar)) {
        return res.status(400).json({ success: false, field: 'aadhaar', message: 'Invalid Aadhaar number. Must be a 12-digit number (cannot start with 0 or 1)' });
    }

    // Formatted Aadhaar for display (XXXX-XXXX-XXXX)
    const formattedAadhaar = cleanAadhaar.replace(/(\d{4})(\d{4})(\d{4})/, '$1-$2-$3');

    // 4. Land Acres Validation
    if (isNaN(parsedLand) || parsedLand <= 0 || parsedLand > 500) {
        return res.status(400).json({ success: false, field: 'landAcres', message: 'Land holding must be between 0.1 and 500 acres' });
    }

    // 5. Bank Account Validation (9 to 18 digits)
    if (!bankAcc || bankAcc.length < 9 || bankAcc.length > 18) {
        return res.status(400).json({ success: false, field: 'bankAcc', message: 'Bank account number must be between 9 and 18 digits' });
    }

    // 6. IFSC Code Validation (4 letters, 0, 6 characters)
    if (!ifsc || !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc)) {
        return res.status(400).json({ success: false, field: 'ifsc', message: 'Invalid IFSC code format (e.g. SBIN0001234)' });
    }

    const farmerCode = `F-${Math.floor(1000 + Math.random() * 9000)}`;

    try {
        if (db.pool) {
            // Check for existing farmer with duplicate phone or aadhaar
            const dupCheck = await db.query(
                'SELECT id, phone, aadhaar FROM farmers WHERE phone = $1 OR aadhaar = $2 OR aadhaar = $3',
                [phone, cleanAadhaar, formattedAadhaar]
            );
            if (dupCheck.rows.length > 0) {
                const existing = dupCheck.rows[0];
                const dupField = existing.phone === phone ? 'Phone Number' : 'Aadhaar Card Number';
                return res.status(409).json({
                    success: false,
                    message: `A farmer profile with this ${dupField} is already registered in the system.`
                });
            }

            const result = await db.query(
                `INSERT INTO farmers (farmer_code, name, phone, aadhaar, village, land_acres, bank_name, bank_acc, ifsc, status)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'Verified') RETURNING *`,
                [farmerCode, name, phone, formattedAadhaar, village, parsedLand, bankName, bankAcc, ifsc]
            );
            return res.status(201).json({ success: true, message: 'Farmer registered successfully', farmer: result.rows[0] });
        } else {
            const farmer = { id: Date.now(), farmer_code: farmerCode, name, phone, aadhaar: formattedAadhaar, village, land_acres: parsedLand, bank_name: bankName, bank_acc: bankAcc, ifsc, status: 'Verified' };
            return res.status(201).json({ success: true, message: 'Farmer registered (Local)', farmer });
        }
    } catch (err) {
        console.error('Error registering farmer:', err);
        if (err.code === '23505') {
            return res.status(409).json({ success: false, message: 'Farmer with this Phone number or Aadhaar already exists in the database.' });
        }
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
