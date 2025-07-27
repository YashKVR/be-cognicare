const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const prisma = require('../lib/prisma');
const { sendEmail } = require('../utils/email');

// POST /api/auth/signup
const signup = async (req, res) => {
    try {
        const { email, password, name, role, organizationId } = req.body;

        // 1. Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // 2. Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // 3. Generate email verification token
        const emailVerificationToken = crypto.randomBytes(32).toString('hex');

        // 4. Create user in database
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                role: role || 'DOCTOR',
                organizationId,
                emailVerificationToken
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                organizationId: true,
                isEmailVerified: true
            }
        });

        // 5. Send verification email
        await sendEmail({
            to: email,
            subject: 'Verify your email address',
            template: 'email-verification',
            data: {
                name,
                verificationToken: emailVerificationToken
            }
        });

        // 6. Return success message (don't return sensitive data)
        res.status(201).json({
            message: 'User created successfully. Please check your email to verify your account.'
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// POST /api/auth/verify-email
const verifyEmail = async (req, res) => {
    try {
        const { token } = req.body;

        // 1. Find user by verification token
        const user = await prisma.user.findUnique({
            where: { emailVerificationToken: token }
        });

        if (!user) {
            return res.status(400).json({ error: 'Invalid verification token' });
        }

        // 2. Check if token is valid and not expired (tokens expire after 24 hours)
        const tokenAge = Date.now() - new Date(user.createdAt).getTime();
        const tokenExpiry = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

        if (tokenAge > tokenExpiry) {
            return res.status(400).json({ error: 'Verification token has expired' });
        }

        // 3. Update user: set isEmailVerified = true, clear verification token
        await prisma.user.update({
            where: { id: user.id },
            data: {
                isEmailVerified: true,
                emailVerificationToken: null
            }
        });

        // 4. Return success message
        res.json({ message: 'Email verified successfully. You can now login.' });
    } catch (error) {
        console.error('Email verification error:', error);
        res.status(400).json({ error: 'Invalid or expired verification token' });
    }
};

// POST /api/auth/login
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Find user by email
        const user = await prisma.user.findUnique({
            where: { email },
            include: {
                organization: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // 2. Check if user exists and email is verified
        if (!user.isEmailVerified) {
            return res.status(401).json({ error: 'Please verify your email before logging in' });
        }

        // 3. Compare password with hashed password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // 4. Generate JWT token
        const token = jwt.sign(
            {
                userId: user.id,
                email: user.email,
                role: user.role,
                organizationId: user.organizationId
            },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );

        // 5. Return token and user info (exclude password)
        const { password: _, ...userWithoutPassword } = user;

        res.json({
            token,
            user: userWithoutPassword
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(401).json({ error: 'Invalid credentials' });
    }
};

// POST /api/auth/forgot-password
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        // 1. Find user by email
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            // Don't reveal if user exists or not for security
            return res.json({ message: 'Password reset link sent to your email' });
        }

        // 2. Generate password reset token with expiry (1 hour)
        const passwordResetToken = crypto.randomBytes(32).toString('hex');
        const passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        // 3. Update user with reset token and expiry
        await prisma.user.update({
            where: { id: user.id },
            data: {
                passwordResetToken,
                passwordResetExpires
            }
        });

        // 4. Send password reset email with token
        await sendEmail({
            to: email,
            subject: 'Reset your password',
            template: 'password-reset',
            data: {
                name: user.name,
                resetToken: passwordResetToken
            }
        });

        // 5. Return success message
        res.json({ message: 'Password reset link sent to your email' });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// POST /api/auth/reset-password
const resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        // 1. Validate token and new password from request
        if (!token || !newPassword) {
            return res.status(400).json({ error: 'Token and new password are required' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters long' });
        }

        // 2. Find user by reset token
        const user = await prisma.user.findUnique({
            where: { passwordResetToken: token }
        });

        if (!user) {
            return res.status(400).json({ error: 'Invalid reset token' });
        }

        // 3. Check if token is valid and not expired
        if (user.passwordResetExpires < new Date()) {
            return res.status(400).json({ error: 'Reset token has expired' });
        }

        // 4. Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 12);

        // 5. Update user: set new password, clear reset token and expiry
        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                passwordResetToken: null,
                passwordResetExpires: null
            }
        });

        // 6. Return success message
        res.json({ message: 'Password reset successfully' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(400).json({ error: 'Invalid or expired reset token' });
    }
};

// POST /api/auth/resend-verification
const resendVerification = async (req, res) => {
    try {
        const { email } = req.body;

        // 1. Find user by email
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            return res.status(400).json({ error: 'User not found' });
        }

        // 2. Check if user exists and email is not already verified
        if (user.isEmailVerified) {
            return res.status(400).json({ error: 'Email is already verified' });
        }

        // 3. Generate new verification token
        const emailVerificationToken = crypto.randomBytes(32).toString('hex');

        // 4. Update user with new token
        await prisma.user.update({
            where: { id: user.id },
            data: {
                emailVerificationToken
            }
        });

        // 5. Send verification email
        await sendEmail({
            to: email,
            subject: 'Verify your email address',
            template: 'email-verification',
            data: {
                name: user.name,
                verificationToken: emailVerificationToken
            }
        });

        // 6. Return success message
        res.json({ message: 'Verification email sent' });
    } catch (error) {
        console.error('Resend verification error:', error);
        res.status(400).json({ error: 'User not found or already verified' });
    }
};

module.exports = {
    signup,
    verifyEmail,
    login,
    forgotPassword,
    resetPassword,
    resendVerification
}; 