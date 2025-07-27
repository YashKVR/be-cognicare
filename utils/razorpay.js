// utils/razorpay.js
const Razorpay = require('razorpay');

// Lazy initialization of Razorpay instance
let razorpay = null;

const getRazorpayInstance = () => {
    if (!razorpay) {
        const keyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_dummy_key_id';
        const keySecret = process.env.RAZORPAY_KEY_SECRET || 'dummy_key_secret_for_development';

        // Use dummy values for development
        razorpay = new Razorpay({
            key_id: keyId,
            key_secret: keySecret
        });
    }
    return razorpay;
};

/**
 * Create Razorpay subscription
 * @param {Object} options - Subscription options
 * @param {string} options.organizationId - Organization ID
 * @param {number} options.amount - Amount in paise
 * @param {Array} options.addonIds - Array of add-on IDs
 * @returns {Promise<Object>} - Razorpay subscription object
 */
const createRazorpaySubscription = async ({ organizationId, amount, addonIds }) => {
    try {
        const instance = getRazorpayInstance();

        // TODO: Implement actual Razorpay subscription creation
        // This is a placeholder implementation
        console.log('Creating Razorpay subscription (using dummy credentials)...');

        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Return mock subscription object
        return {
            id: `sub_${Date.now()}`,
            short_url: `https://pay.razorpay.com/subscription/${Date.now()}`,
            status: 'created',
            amount: amount,
            currency: 'INR'
        };
    } catch (error) {
        console.error('Razorpay subscription creation error:', error);
        throw new Error('Failed to create subscription');
    }
};

/**
 * Verify Razorpay webhook signature
 * @param {Object} webhookBody - Webhook request body
 * @param {string} webhookSignature - Webhook signature from headers
 * @returns {boolean} - True if signature is valid
 */
const verifyRazorpayWebhook = (webhookBody, webhookSignature) => {
    try {
        const instance = getRazorpayInstance();

        // TODO: Implement actual webhook signature verification
        // This is a placeholder implementation
        console.log('Verifying Razorpay webhook signature (using dummy credentials)...');

        // For now, return true (you should implement proper signature verification)
        return true;
    } catch (error) {
        console.error('Webhook signature verification error:', error);
        return false;
    }
};

module.exports = {
    createRazorpaySubscription,
    verifyRazorpayWebhook
}; 