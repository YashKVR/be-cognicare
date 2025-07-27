const prisma = require('../lib/prisma');
const { sendEmail } = require('../utils/email');
const crypto = require('crypto');

// POST /api/organizations
const createOrganization = async (req, res) => {
    try {
        const { name, address, gstNumber, contactEmail, contactPhone } = req.body;
        const userId = req.user.userId;

        // 1. Check if user already belongs to an organization
        const existingUser = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (existingUser.organizationId) {
            return res.status(400).json({ error: 'User already belongs to an organization' });
        }

        // 2. Create new organization with provided details
        const organization = await prisma.organization.create({
            data: {
                name,
                address,
                gstNumber,
                contactEmail,
                contactPhone
            }
        });

        // 3. Update user: set organizationId and role as ADMIN
        await prisma.user.update({
            where: { id: userId },
            data: {
                organizationId: organization.id,
                role: 'ADMIN'
            }
        });

        // 4. Return organization details
        res.status(201).json({
            organization: {
                id: organization.id,
                name: organization.name,
                address: organization.address,
                gstNumber: organization.gstNumber,
                contactEmail: organization.contactEmail,
                contactPhone: organization.contactPhone,
                createdAt: organization.createdAt
            }
        });
    } catch (error) {
        console.error('Create organization error:', error);
        res.status(500).json({ error: 'Failed to create organization' });
    }
};

// GET /api/organizations/me
const getMyOrganization = async (req, res) => {
    try {
        const userId = req.user.userId;

        // 1. Get user's organization with related data (clinics, users, add-ons)
        const organization = await prisma.organization.findFirst({
            where: {
                users: {
                    some: {
                        id: userId
                    }
                }
            },
            include: {
                clinics: {
                    select: {
                        id: true,
                        name: true,
                        address: true,
                        phone: true,
                        _count: {
                            select: {
                                patients: true,
                                appointments: true
                            }
                        }
                    }
                },
                users: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                        specialization: true
                    }
                },
                organizationAddOns: {
                    include: {
                        addOn: true
                    }
                },
                subscriptions: {
                    where: {
                        status: 'ACTIVE'
                    },
                    orderBy: {
                        createdAt: 'desc'
                    },
                    take: 1
                },
                _count: {
                    select: {
                        users: true,
                        clinics: true,
                        patients: true,
                        appointments: true
                    }
                }
            }
        });

        if (!organization) {
            return res.status(404).json({ error: 'Organization not found' });
        }

        // 2. Return organization details
        res.json({
            organization
        });
    } catch (error) {
        console.error('Get organization error:', error);
        res.status(500).json({ error: 'Failed to fetch organization' });
    }
};

// PUT /api/organizations/me
const updateMyOrganization = async (req, res) => {
    try {
        const { name, address, gstNumber, contactEmail, contactPhone } = req.body;
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

        // 1. Update organization details
        const updatedOrganization = await prisma.organization.update({
            where: { id: user.organization.id },
            data: {
                name,
                address,
                gstNumber,
                contactEmail,
                contactPhone
            }
        });

        // 2. Return updated organization
        res.json({
            organization: updatedOrganization
        });
    } catch (error) {
        console.error('Update organization error:', error);
        res.status(500).json({ error: 'Failed to update organization' });
    }
};

// POST /api/organizations/invite
const inviteUser = async (req, res) => {
    try {
        const { email, role } = req.body;
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

        // 1. Check if email is already registered or invited
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return res.status(400).json({ error: 'User with this email already exists' });
        }

        const existingInvite = await prisma.invite.findFirst({
            where: {
                email,
                organizationId: user.organization.id,
                isUsed: false,
                expiresAt: {
                    gt: new Date()
                }
            }
        });

        if (existingInvite) {
            return res.status(400).json({ error: 'Invitation already sent to this email' });
        }

        // 2. Generate invite token with expiry (7 days)
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

        // 3. Create invite record in database
        const invite = await prisma.invite.create({
            data: {
                email,
                token,
                role: role || 'DOCTOR',
                organizationId: user.organization.id,
                invitedBy: userId,
                expiresAt
            }
        });

        // 4. Send invite email with join link
        await sendEmail({
            to: email,
            subject: `You're invited to join ${user.organization.name}`,
            template: 'organization-invite',
            data: {
                organizationName: user.organization.name,
                inviterName: user.name,
                role: role || 'DOCTOR',
                inviteToken: token
            }
        });

        // 5. Return success message
        res.json({ message: 'Invitation sent successfully' });
    } catch (error) {
        console.error('Invite user error:', error);
        res.status(500).json({ error: 'Failed to send invitation' });
    }
};

// POST /api/organizations/join/:token
const joinOrganization = async (req, res) => {
    try {
        const { token } = req.params;
        const userId = req.user.userId;

        // 1. Find invite by token
        const invite = await prisma.invite.findUnique({
            where: { token },
            include: {
                organization: true
            }
        });

        if (!invite) {
            return res.status(400).json({ error: 'Invalid invitation token' });
        }

        // 2. Check if invite is valid, not used, and not expired
        if (invite.isUsed) {
            return res.status(400).json({ error: 'Invitation has already been used' });
        }

        if (invite.expiresAt < new Date()) {
            return res.status(400).json({ error: 'Invitation has expired' });
        }

        // 3. Check if user doesn't already belong to an organization
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (user.organizationId) {
            return res.status(400).json({ error: 'User already belongs to an organization' });
        }

        // 4. Update user: set organizationId and role from invite
        await prisma.user.update({
            where: { id: userId },
            data: {
                organizationId: invite.organizationId,
                role: invite.role
            }
        });

        // 5. Mark invite as used
        await prisma.invite.update({
            where: { id: invite.id },
            data: { isUsed: true }
        });

        // 6. Return success message with organization details
        res.json({
            message: 'Successfully joined organization',
            organization: {
                id: invite.organization.id,
                name: invite.organization.name,
                address: invite.organization.address
            }
        });
    } catch (error) {
        console.error('Join organization error:', error);
        res.status(400).json({ error: 'Invalid or expired invitation' });
    }
};

// GET /api/organizations/users
const getOrganizationUsers = async (req, res) => {
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

        // 1. Get all users in the organization
        const users = await prisma.user.findMany({
            where: {
                organizationId: user.organization.id
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                specialization: true,
                isEmailVerified: true,
                createdAt: true,
                _count: {
                    select: {
                        appointments: true,
                        ehrRecords: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        // 2. Exclude sensitive data (passwords, tokens)
        // 3. Return users list
        res.json({
            users
        });
    } catch (error) {
        console.error('Get organization users error:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
};

// DELETE /api/organizations/users/:userId
const removeUserFromOrganization = async (req, res) => {
    try {
        const { userId: targetUserId } = req.params;
        const adminUserId = req.user.userId;

        // Get admin user's organization
        const adminUser = await prisma.user.findUnique({
            where: { id: adminUserId },
            include: {
                organization: true
            }
        });

        if (!adminUser.organization) {
            return res.status(404).json({ error: 'Organization not found' });
        }

        // 1. Check if user exists and belongs to the organization
        const targetUser = await prisma.user.findFirst({
            where: {
                id: targetUserId,
                organizationId: adminUser.organization.id
            }
        });

        if (!targetUser) {
            return res.status(404).json({ error: 'User not found in organization' });
        }

        // 2. Check if user is not the last admin
        if (targetUser.role === 'ADMIN') {
            const adminCount = await prisma.user.count({
                where: {
                    organizationId: adminUser.organization.id,
                    role: 'ADMIN'
                }
            });

            if (adminCount <= 1) {
                return res.status(400).json({ error: 'Cannot remove the last admin from organization' });
            }
        }

        // 3. Remove user from organization (set organizationId to null)
        await prisma.user.update({
            where: { id: targetUserId },
            data: {
                organizationId: null
            }
        });

        // 4. Return success message
        res.json({ message: 'User removed from organization' });
    } catch (error) {
        console.error('Remove user error:', error);
        res.status(400).json({ error: 'Cannot remove user' });
    }
};

module.exports = {
    createOrganization,
    getMyOrganization,
    updateMyOrganization,
    inviteUser,
    joinOrganization,
    getOrganizationUsers,
    removeUserFromOrganization
}; 