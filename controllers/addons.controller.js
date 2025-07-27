const prisma = require('../lib/prisma');
const { createRazorpaySubscription, verifyRazorpayWebhook } = require('../utils/razorpay');

// GET /api/addons
const getAddons = async (req, res) => {
    try {
        const userId = req.user.userId;

        // Get user's organization
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                organization: true
            }
        });

        if (!user.organization) {
            return res.status(404).json({ error: 'Organization not found' });
        }

        // 1. Get all available add-ons
        // 2. Mark which ones are enabled for user's organization
        // 3. Return add-ons list with pricing

        const [allAddons, organizationAddons] = await Promise.all([
            prisma.addOn.findMany({
                orderBy: {
                    name: 'asc'
                }
            }),
            prisma.organizationAddOn.findMany({
                where: {
                    organizationId: user.organization.id,
                    isActive: true
                },
                include: {
                    addOn: true
                }
            })
        ]);

        // Mark which add-ons are enabled for the organization
        const addonsWithStatus = allAddons.map(addon => {
            const orgAddon = organizationAddons.find(oa => oa.addOnId === addon.id);
            return {
                ...addon,
                isEnabled: !!orgAddon,
                usageCount: orgAddon?.usageCount || 0
            };
        });

        res.json({
            addons: addonsWithStatus
        });
    } catch (error) {
        console.error('Get addons error:', error);
        res.status(500).json({ error: 'Failed to fetch add-ons' });
    }
};

// GET /api/addons/organization
const getOrganizationAddons = async (req, res) => {
    try {
        const userId = req.user.userId;

        // Get user's organization
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                organization: true
            }
        });

        if (!user.organization) {
            return res.status(404).json({ error: 'Organization not found' });
        }

        // 1. Get organization's enabled add-ons
        // 2. Include usage statistics for usage-based add-ons
        // 3. Return enabled add-ons with usage data

        const enabledAddons = await prisma.organizationAddOn.findMany({
            where: {
                organizationId: user.organization.id,
                isActive: true
            },
            include: {
                addOn: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        res.json({
            enabledAddons
        });
    } catch (error) {
        console.error('Get organization addons error:', error);
        res.status(500).json({ error: 'Failed to fetch organization add-ons' });
    }
};

// POST /api/addons/subscribe
const subscribeToAddons = async (req, res) => {
    try {
        const { addonIds } = req.body; // Array of add-on IDs to subscribe to
        const userId = req.user.userId;

        // Get user's organization
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                organization: true
            }
        });

        if (!user.organization) {
            return res.status(404).json({ error: 'Organization not found' });
        }

        // 1. Validate selected add-ons from request
        // 2. Calculate total subscription amount
        // 3. Create/update organization add-ons
        // 4. Create Razorpay subscription
        // 5. Return subscription details and payment link

        if (!Array.isArray(addonIds) || addonIds.length === 0) {
            return res.status(400).json({ error: 'Please select at least one add-on' });
        }

        // Validate add-ons exist
        const addons = await prisma.addOn.findMany({
            where: {
                id: {
                    in: addonIds
                }
            }
        });

        if (addons.length !== addonIds.length) {
            return res.status(400).json({ error: 'One or more selected add-ons are invalid' });
        }

        // Calculate total amount
        const totalAmount = addons.reduce((sum, addon) => sum + addon.price, 0);

        // Create/update organization add-ons
        const organizationAddons = await Promise.all(
            addonIds.map(addonId =>
                prisma.organizationAddOn.upsert({
                    where: {
                        organizationId_addOnId: {
                            organizationId: user.organization.id,
                            addOnId: addonId
                        }
                    },
                    update: {
                        isActive: true
                    },
                    create: {
                        organizationId: user.organization.id,
                        addOnId: addonId,
                        isActive: true,
                        usageCount: 0
                    }
                })
            )
        );

        // Create Razorpay subscription
        const subscription = await createRazorpaySubscription({
            organizationId: user.organization.id,
            amount: totalAmount,
            addonIds
        });

        // Create subscription record in database
        const dbSubscription = await prisma.subscription.create({
            data: {
                organizationId: user.organization.id,
                razorpaySubscriptionId: subscription.id,
                amount: totalAmount,
                status: 'ACTIVE'
            }
        });

        res.json({
            subscription: {
                id: dbSubscription.id,
                amount: totalAmount,
                status: dbSubscription.status,
                addons: addons.map(addon => ({
                    id: addon.id,
                    name: addon.name,
                    price: addon.price
                }))
            },
            paymentLink: subscription.short_url || null
        });
    } catch (error) {
        console.error('Subscribe to addons error:', error);
        res.status(500).json({ error: 'Failed to create subscription' });
    }
};

// POST /api/addons/razorpay-webhook
const handleRazorpayWebhook = async (req, res) => {
    try {
        // 1. Verify Razorpay webhook signature
        // 2. Handle different webhook events:
        //    - subscription.activated: Enable add-ons
        //    - subscription.cancelled: Disable add-ons
        //    - payment.failed: Send notification
        // 3. Update subscription status in database
        // 4. Return success response

        const webhookBody = req.body;
        const webhookSignature = req.headers['x-razorpay-signature'];

        // Verify webhook signature
        const isValidSignature = verifyRazorpayWebhook(webhookBody, webhookSignature);
        if (!isValidSignature) {
            return res.status(400).json({ error: 'Invalid webhook signature' });
        }

        const event = webhookBody.event;
        const payload = webhookBody.payload;

        switch (event) {
            case 'subscription.activated':
                // Enable add-ons for the organization
                await prisma.subscription.updateMany({
                    where: {
                        razorpaySubscriptionId: payload.subscription.id
                    },
                    data: {
                        status: 'ACTIVE'
                    }
                });

                // Enable organization add-ons
                const subscription = await prisma.subscription.findFirst({
                    where: {
                        razorpaySubscriptionId: payload.subscription.id
                    }
                });

                if (subscription) {
                    // You might want to store which add-ons were subscribed to
                    // For now, we'll just mark all as active
                    await prisma.organizationAddOn.updateMany({
                        where: {
                            organizationId: subscription.organizationId
                        },
                        data: {
                            isActive: true
                        }
                    });
                }
                break;

            case 'subscription.cancelled':
                // Disable add-ons for the organization
                await prisma.subscription.updateMany({
                    where: {
                        razorpaySubscriptionId: payload.subscription.id
                    },
                    data: {
                        status: 'CANCELLED',
                        endDate: new Date()
                    }
                });

                // Disable organization add-ons
                const cancelledSubscription = await prisma.subscription.findFirst({
                    where: {
                        razorpaySubscriptionId: payload.subscription.id
                    }
                });

                if (cancelledSubscription) {
                    await prisma.organizationAddOn.updateMany({
                        where: {
                            organizationId: cancelledSubscription.organizationId
                        },
                        data: {
                            isActive: false
                        }
                    });
                }
                break;

            case 'payment.failed':
                // Send notification about failed payment
                const failedSubscription = await prisma.subscription.findFirst({
                    where: {
                        razorpaySubscriptionId: payload.subscription.id
                    },
                    include: {
                        organization: true
                    }
                });

                if (failedSubscription) {
                    // TODO: Send notification to organization admin
                    console.log(`Payment failed for organization: ${failedSubscription.organization.name}`);
                }
                break;

            default:
                console.log(`Unhandled webhook event: ${event}`);
        }

        res.json({ status: 'ok' });
    } catch (error) {
        console.error('Razorpay webhook error:', error);
        res.status(400).json({ error: 'Webhook verification failed' });
    }
};

module.exports = {
    getAddons,
    getOrganizationAddons,
    subscribeToAddons,
    handleRazorpayWebhook
}; 