// routes/analytics.js
const express = require('express');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const {
    getDashboardAnalytics,
    getAppointmentAnalytics,
    getPatientAnalytics
} = require('../controllers/analytics.controller');

const router = express.Router();

// GET /api/analytics/dashboard
router.get('/dashboard', authenticateToken, requireAdmin, getDashboardAnalytics);

// GET /api/analytics/appointments
router.get('/appointments', authenticateToken, requireAdmin, getAppointmentAnalytics);

// GET /api/analytics/patients
router.get('/patients', authenticateToken, requireAdmin, getPatientAnalytics);

module.exports = router;