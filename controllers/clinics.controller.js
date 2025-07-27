const prisma = require('../lib/prisma');

// GET /api/clinics
const getClinics = async (req, res) => {
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

        // 1. Get all clinics in user's organization
        const clinics = await prisma.clinic.findMany({
            where: {
                organizationId: user.organization.id
            },
            include: {
                _count: {
                    select: {
                        patients: true,
                        appointments: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        // 2. Include basic stats (patient count, appointment count)
        // 3. Return clinics list
        res.json({
            clinics
        });
    } catch (error) {
        console.error('Get clinics error:', error);
        res.status(500).json({ error: 'Failed to fetch clinics' });
    }
};

// POST /api/clinics
const createClinic = async (req, res) => {
    try {
        const { name, address, phone } = req.body;
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

        // 1. Create new clinic under user's organization
        const clinic = await prisma.clinic.create({
            data: {
                name,
                address,
                phone,
                organizationId: user.organization.id
            }
        });

        // 2. Return created clinic details
        res.status(201).json({
            clinic
        });
    } catch (error) {
        console.error('Create clinic error:', error);
        res.status(500).json({ error: 'Failed to create clinic' });
    }
};

// GET /api/clinics/:id
const getClinicById = async (req, res) => {
    try {
        const { id } = req.params;
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

        // 1. Find clinic by ID
        const clinic = await prisma.clinic.findFirst({
            where: {
                id,
                organizationId: user.organization.id
            },
            include: {
                patients: {
                    select: {
                        id: true,
                        name: true,
                        phone: true,
                        email: true,
                        dateOfBirth: true,
                        gender: true,
                        _count: {
                            select: {
                                appointments: true,
                                ehrRecords: true
                            }
                        }
                    },
                    orderBy: {
                        createdAt: 'desc'
                    },
                    take: 10 // Limit to recent patients
                },
                appointments: {
                    where: {
                        appointmentDate: {
                            gte: new Date()
                        }
                    },
                    include: {
                        patient: {
                            select: {
                                id: true,
                                name: true,
                                phone: true
                            }
                        },
                        doctor: {
                            select: {
                                id: true,
                                name: true,
                                specialization: true
                            }
                        }
                    },
                    orderBy: {
                        appointmentDate: 'asc'
                    },
                    take: 10 // Limit to upcoming appointments
                },
                _count: {
                    select: {
                        patients: true,
                        appointments: true
                    }
                }
            }
        });

        // 2. Check if clinic belongs to user's organization
        if (!clinic) {
            return res.status(404).json({ error: 'Clinic not found' });
        }

        // 3. Include related data (patients, appointments, doctors)
        // 4. Return clinic details
        res.json({
            clinic
        });
    } catch (error) {
        console.error('Get clinic error:', error);
        res.status(404).json({ error: 'Clinic not found' });
    }
};

// PUT /api/clinics/:id
const updateClinic = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, address, phone } = req.body;
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

        // 1. Find clinic by ID
        const existingClinic = await prisma.clinic.findFirst({
            where: {
                id,
                organizationId: user.organization.id
            }
        });

        // 2. Check if clinic belongs to user's organization
        if (!existingClinic) {
            return res.status(404).json({ error: 'Clinic not found' });
        }

        // 3. Update clinic details
        const updatedClinic = await prisma.clinic.update({
            where: { id },
            data: {
                name,
                address,
                phone
            }
        });

        // 4. Return updated clinic
        res.json({
            clinic: updatedClinic
        });
    } catch (error) {
        console.error('Update clinic error:', error);
        res.status(404).json({ error: 'Clinic not found' });
    }
};

// DELETE /api/clinics/:id
const deleteClinic = async (req, res) => {
    try {
        const { id } = req.params;
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

        // 1. Find clinic by ID
        const clinic = await prisma.clinic.findFirst({
            where: {
                id,
                organizationId: user.organization.id
            },
            include: {
                _count: {
                    select: {
                        patients: true,
                        appointments: true
                    }
                }
            }
        });

        // 2. Check if clinic belongs to user's organization
        if (!clinic) {
            return res.status(404).json({ error: 'Clinic not found' });
        }

        // 3. Check if clinic has no active appointments or patients
        if (clinic._count.patients > 0) {
            return res.status(400).json({
                error: 'Cannot delete clinic with existing patients. Please transfer or archive patients first.'
            });
        }

        if (clinic._count.appointments > 0) {
            return res.status(400).json({
                error: 'Cannot delete clinic with existing appointments. Please cancel or reschedule appointments first.'
            });
        }

        // 4. Delete clinic
        await prisma.clinic.delete({
            where: { id }
        });

        // 5. Return success message
        res.json({ message: 'Clinic deleted successfully' });
    } catch (error) {
        console.error('Delete clinic error:', error);
        res.status(400).json({ error: 'Cannot delete clinic with active data' });
    }
};

module.exports = {
    getClinics,
    createClinic,
    getClinicById,
    updateClinic,
    deleteClinic
}; 