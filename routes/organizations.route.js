// routes/organizations.js
const express = require('express');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { validateOrganization, validateInvite } = require('../middleware/validation');
const {
    createOrganization,
    getMyOrganization,
    updateMyOrganization,
    inviteUser,
    joinOrganization,
    getOrganizationUsers,
    removeUserFromOrganization
} = require('../controllers/organizations.controller');

const router = express.Router();

// POST /api/organizations
router.post('/', authenticateToken, validateOrganization, createOrganization);

// GET /api/organizations/me
router.get('/me', authenticateToken, getMyOrganization);

// PUT /api/organizations/me
router.put('/me', authenticateToken, requireAdmin, validateOrganization, updateMyOrganization);

// POST /api/organizations/invite
router.post('/invite', authenticateToken, requireAdmin, validateInvite, inviteUser);

// POST /api/organizations/join/:token
router.post('/join/:token', authenticateToken, joinOrganization);

// GET /api/organizations/users
router.get('/users', authenticateToken, getOrganizationUsers);

// DELETE /api/organizations/users/:userId
router.delete('/users/:userId', authenticateToken, requireAdmin, removeUserFromOrganization);

module.exports = router;