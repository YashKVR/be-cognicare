// routes/patients.js
const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { validatePatient, validatePhone } = require('../middleware/validation');
const {
    getPatients,
    searchPatientByPhone,
    createPatient,
    getPatientById,
    updatePatient,
    deletePatient,
    bulkImportPatients
} = require('../controllers/patients.controller');

const router = express.Router();

// GET /api/patients
router.get('/', authenticateToken, getPatients);

// GET /api/patients/search-by-phone/:phone
router.get('/search-by-phone/:phone', authenticateToken, searchPatientByPhone);

// POST /api/patients
router.post('/', authenticateToken, validatePatient, createPatient);

// GET /api/patients/:id
router.get('/:id', authenticateToken, getPatientById);

// PUT /api/patients/:id
router.put('/:id', authenticateToken, validatePatient, updatePatient);

// DELETE /api/patients/:id
router.delete('/:id', authenticateToken, deletePatient);

// POST /api/patients/bulk-import
router.post('/bulk-import', authenticateToken, bulkImportPatients);

module.exports = router;