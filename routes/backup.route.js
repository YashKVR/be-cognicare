// routes/backup.js
const express = require('express');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const {
    getLatestCloudBackup,
    triggerCloudBackup,
    downloadLocalBackup,
    restoreBackup,
    getBackupHistory
} = require('../controllers/backup.controller');

const router = express.Router();

// GET /api/backup/cloud/latest
router.get('/cloud/latest', authenticateToken, requireAdmin, getLatestCloudBackup);

// POST /api/backup/cloud/trigger
router.post('/cloud/trigger', authenticateToken, requireAdmin, triggerCloudBackup);

// GET /api/backup/local
router.get('/local', authenticateToken, requireAdmin, downloadLocalBackup);

// POST /api/backup/restore
router.post('/restore', authenticateToken, requireAdmin, restoreBackup);

// GET /api/backup/history
router.get('/history', authenticateToken, requireAdmin, getBackupHistory);

module.exports = router;