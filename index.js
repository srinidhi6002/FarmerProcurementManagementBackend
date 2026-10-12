/**
 * Smart Farmer Procurement System - Express API Server
 * Connects Vercel Frontend Client to Neon Cloud PostgreSQL Database
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware Configuration
app.use(cors({
    origin: '*', // Allows Vercel frontend, local development, and mobile clients
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Helper function to resolve routes regardless of flat or nested folder structure
const loadRoute = (routeName) => {
    const nestedPath = path.join(__dirname, 'routes', `${routeName}.js`);
    if (fs.existsSync(nestedPath)) {
        return require(`./routes/${routeName}`);
    }
    const flatPath = path.join(__dirname, `${routeName}.js`);
    if (fs.existsSync(flatPath)) {
        return require(`./${routeName}`);
    }
    console.warn(`⚠️ Warning: Route module ${routeName} not found.`);
    return (req, res) => res.status(404).json({ success: false, message: `Route ${routeName} unavailable` });
};

// Import Routes
const healthRoute = loadRoute('health');
const authRoute = loadRoute('auth');
const farmersRoute = loadRoute('farmers');
const centersRoute = loadRoute('centers');
const queueRoute = loadRoute('queue');
const verificationRoute = loadRoute('verification');
const payoutsRoute = loadRoute('payouts');
const adminRoute = loadRoute('admin');

// Mount Routes
app.use('/api/health', healthRoute);
app.use('/api/auth', authRoute);
app.use('/api/farmers', farmersRoute);
app.use('/api/centers', centersRoute);
app.use('/api/queue', queueRoute);
app.use('/api/verification', verificationRoute);
app.use('/api/payouts', payoutsRoute);
app.use('/api/admin', adminRoute);

// Root route: API Status & Welcome
app.get('/', (req, res) => {
    res.json({
        service: 'Smart Farmer Procurement System REST API',
        status: 'Online',
        documentation: '/api/health',
        render_deployment: 'Ready'
    });
});

// Explicit API Welcome Endpoint
app.get('/api', (req, res) => {
    res.json({
        service: 'Smart Farmer Procurement System REST API',
        status: 'Online',
        documentation: '/api/health',
        render_deployment: 'Ready'
    });
});

// Global 404 Route Handler
app.use((req, res) => {
    res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// Start Express Server
app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🌾 AgriProcure Express Server Running on Port ${PORT}`);
    console.log(`🔗 Health Check: http://localhost:${PORT}/api/health`);
    console.log(`====================================================`);
});
