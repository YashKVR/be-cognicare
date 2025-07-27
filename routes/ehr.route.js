// routes/ehr.js
const express = require('express');
const { authenticateToken, checkAddOn } = require('../middleware/auth');
const { validateEHRRecord } = require('../middleware/validation');
const {
    getPatientEHRRecords,
    createEHRRecord,
    getEHRRecordById,
    updateEHRRecord,
    voiceToText,
    extractTextFromImage,
    generateSummary
} = require('../controllers/ehr.controller');

const router = express.Router();

// POST /api/ehr
router.post('/', authenticateToken, checkAddOn('AI Scribe'), validateEHRRecord, createEHRRecord);

// POST /api/ehr/voice-to-text
router.post('/voice-to-text', authenticateToken, checkAddOn('AI Scribe'), voiceToText);

// POST /api/ehr/ocr
router.post('/ocr', authenticateToken, checkAddOn('AI Scribe'), extractTextFromImage);

// POST /api/ehr/ai-summary
router.post('/ai-summary', authenticateToken, checkAddOn('AI Scribe'), generateSummary);

// GET /api/ehr/patient/:patientId
router.get('/patient/:patientId', authenticateToken, getPatientEHRRecords);

// GET /api/ehr/:id
router.get('/:id', authenticateToken, getEHRRecordById);

// PUT /api/ehr/:id
router.put('/:id', authenticateToken, checkAddOn('AI Scribe'), validateEHRRecord, updateEHRRecord);

module.exports = router;