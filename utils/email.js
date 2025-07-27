// utils/email.js
const nodemailer = require('nodemailer');

// Configure email transporter (you'll need to set up your email service)
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER || 'dummy-email@example.com',
        pass: process.env.EMAIL_PASS || 'dummy-password'
    }
});

/**
 * Send email using templates
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.template - Template name
 * @param {Object} options.data - Template data
 */
const sendEmail = async ({ to, subject, template, data }) => {
    try {
        // Get template content based on template name
        const templateContent = getEmailTemplate(template, data);

        const mailOptions = {
            from: process.env.EMAIL_FROM || process.env.EMAIL_USER || 'dummy-email@example.com',
            to,
            subject,
            html: templateContent
        };

        // For development, just log the email instead of actually sending
        if (process.env.NODE_ENV === 'development' && (!process.env.EMAIL_USER || !process.env.EMAIL_PASS)) {
            console.log('📧 Email would be sent (development mode):', {
                to: mailOptions.to,
                subject: mailOptions.subject,
                from: mailOptions.from
            });
            console.log('📧 Email content:', templateContent);
            return { messageId: 'dummy-message-id' };
        }

        const result = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', result.messageId);
        return result;
    } catch (error) {
        console.error('Email sending failed:', error);
        throw error;
    }
};

/**
 * Get email template content
 * @param {string} template - Template name
 * @param {Object} data - Template data
 * @returns {string} - HTML content
 */
const getEmailTemplate = (template, data) => {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    switch (template) {
        case 'email-verification':
            return `
                <h2>Welcome to CogniCare!</h2>
                <p>Hi ${data.name},</p>
                <p>Please verify your email address by clicking the link below:</p>
                <a href="${frontendUrl}/verify-email?token=${data.verificationToken}">
                    Verify Email Address
                </a>
                <p>This link will expire in 24 hours.</p>
                <p>If you didn't create an account, please ignore this email.</p>
            `;

        case 'password-reset':
            return `
                <h2>Password Reset Request</h2>
                <p>Hi ${data.name},</p>
                <p>You requested a password reset. Click the link below to reset your password:</p>
                <a href="${frontendUrl}/reset-password?token=${data.resetToken}">
                    Reset Password
                </a>
                <p>This link will expire in 1 hour.</p>
                <p>If you didn't request a password reset, please ignore this email.</p>
            `;

        case 'organization-invite':
            return `
                <h2>You're Invited to Join ${data.organizationName}</h2>
                <p>Hi there,</p>
                <p>${data.inviterName} has invited you to join ${data.organizationName} as a ${data.role}.</p>
                <p>Click the link below to accept the invitation:</p>
                <a href="${frontendUrl}/join-organization?token=${data.inviteToken}">
                    Accept Invitation
                </a>
                <p>This invitation will expire in 7 days.</p>
            `;

        default:
            return `
                <h2>Notification</h2>
                <p>This is a notification from CogniCare.</p>
            `;
    }
};

module.exports = {
    sendEmail
}; 