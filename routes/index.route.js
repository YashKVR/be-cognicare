const express = require('express');
const router = express.Router();

// Import route modules
const userRoutes = require('./users');

// Mount routes
router.use('/users', userRoutes);

// API info route
router.get('/api', (req, res) => {
    res.json({
        name: 'CogniCare API',
        version: '1.0.0',
        endpoints: {
            users: '/api/users',
            health: '/health'
        }
    });
});

module.exports = router; 