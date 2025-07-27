// routes/appointments.js
const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { validateAppointment } = require('../middleware/validation');
const {
    getAppointments,
    createAppointment,
    getAppointmentById,
    updateAppointment,
    deleteAppointment
} = require('../controllers/appointments.controller');

const router = express.Router();

// GET /api/appointments
router.get('/', authenticateToken, getAppointments);

// POST /api/appointments
router.post('/', authenticateToken, validateAppointment, createAppointment);

// GET /api/appointments/:id
router.get('/:id', authenticateToken, getAppointmentById);

// PUT /api/appointments/:id
router.put('/:id', authenticateToken, validateAppointment, updateAppointment);

// DELETE /api/appointments/:id
router.delete('/:id', authenticateToken, deleteAppointment);

module.exports = router;