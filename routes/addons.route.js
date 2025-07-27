// routes/addons.js
const express = require('express');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const {
    getAddons,
    getOrganizationAddons,
    subscribeToAddons,
    handleRazorpayWebhook
} = require('../controllers/addons.controller');

const router = express.Router();

// GET /api/addons
router.get('/', authenticateToken, getAddons);

// GET /api/addons/organization
router.get('/organization', authenticateToken, getOrganizationAddons);

// POST /api/addons/subscribe
router.post('/subscribe', authenticateToken, requireAdmin, subscribeToAddons);

// POST /api/addons/razorpay-webhook
router.post('/razorpay-webhook', handleRazorpayWebhook);

module.exports = router;