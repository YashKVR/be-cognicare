// routes/auth.js
const express = require('express');
const { validateSignup, validateLogin, validateEmail } = require('../middleware/validation');
const {
    signup,
    verifyEmail,
    login,
    forgotPassword,
    resetPassword,
    resendVerification
} = require('../controllers/auth.controller');

const router = express.Router();

// POST /api/auth/signup
router.post('/signup', validateSignup, signup);

// POST /api/auth/verify-email
router.post('/verify-email', validateEmail, verifyEmail);

// POST /api/auth/login
router.post('/login', validateLogin, login);

// POST /api/auth/forgot-password
router.post('/forgot-password', validateEmail, forgotPassword);

// POST /api/auth/reset-password
router.post('/reset-password', resetPassword);

// POST /api/auth/resend-verification
router.post('/resend-verification', validateEmail, resendVerification);

module.exports = router;