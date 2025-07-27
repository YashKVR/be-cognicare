// routes/clinics.js
const express = require('express');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { validateClinic } = require('../middleware/validation');
const {
    getClinics,
    createClinic,
    getClinicById,
    updateClinic,
    deleteClinic
} = require('../controllers/clinics.controller');

const router = express.Router();

// GET /api/clinics
router.get('/', authenticateToken, getClinics);

// POST /api/clinics
router.post('/', authenticateToken, requireAdmin, validateClinic, createClinic);

// GET /api/clinics/:id
router.get('/:id', authenticateToken, getClinicById);

// PUT /api/clinics/:id
router.put('/:id', authenticateToken, requireAdmin, validateClinic, updateClinic);

// DELETE /api/clinics/:id
router.delete('/:id', authenticateToken, requireAdmin, deleteClinic);

module.exports = router;