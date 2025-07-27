const prisma = require('../lib/prisma');

// GET /api/appointments
const getAppointments = async (req, res) => {
    try {
        const { date, doctor, clinic, status } = req.query;
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

        // 1. Get query parameters (date, doctor, clinic, status)
        // 2. Filter appointments by user's organization
        // 3. Apply role-based filtering (doctors see only their appointments)
        // 4. Include patient and clinic details
        // 5. Return appointments list

        const whereConditions = {
            clinic: {
                organizationId: user.organization.id
            }
        };

        // Apply role-based filtering
        if (user.role === 'DOCTOR') {
            whereConditions.doctorId = userId;
        }

        // Filter by date
        if (date) {
            const startDate = new Date(date);
            const endDate = new Date(date);
            endDate.setDate(endDate.getDate() + 1);

            whereConditions.appointmentDate = {
                gte: startDate,
                lt: endDate
            };
        }

        // Filter by doctor
        if (doctor) {
            whereConditions.doctorId = doctor;
        }

        // Filter by clinic
        if (clinic) {
            whereConditions.clinicId = clinic;
        }

        // Filter by status
        if (status) {
            whereConditions.status = status;
        }

        const appointments = await prisma.appointment.findMany({
            where: whereConditions,
            include: {
                patient: {
                    select: {
                        id: true,
                        name: true,
                        phone: true,
                        email: true
                    }
                },
                doctor: {
                    select: {
                        id: true,
                        name: true,
                        specialization: true
                    }
                },
                clinic: {
                    select: {
                        id: true,
                        name: true,
                        address: true
                    }
                }
            },
            orderBy: {
                appointmentDate: 'asc'
            }
        });

        res.json({
            appointments
        });
    } catch (error) {
        console.error('Get appointments error:', error);
        res.status(500).json({ error: 'Failed to fetch appointments' });
    }
};

// POST /api/appointments
const createAppointment = async (req, res) => {
    try {
        const { patientId, doctorId, clinicId, appointmentDate, duration, notes } = req.body;
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

        // 1. Validate patient and doctor belong to organization
        // 2. Check for scheduling conflicts
        // 3. Validate appointment time (business hours, future date)
        // 4. Create new appointment
        // 5. Send confirmation notifications
        // 6. Return created appointment

        // Validate patient belongs to organization
        const patient = await prisma.patient.findFirst({
            where: {
                id: patientId,
                clinic: {
                    organizationId: user.organization.id
                }
            }
        });

        if (!patient) {
            return res.status(400).json({ error: 'Invalid patient selected' });
        }

        // Validate doctor belongs to organization
        const doctor = await prisma.user.findFirst({
            where: {
                id: doctorId,
                organizationId: user.organization.id,
                role: 'DOCTOR'
            }
        });

        if (!doctor) {
            return res.status(400).json({ error: 'Invalid doctor selected' });
        }

        // Validate clinic belongs to organization
        const clinic = await prisma.clinic.findFirst({
            where: {
                id: clinicId,
                organizationId: user.organization.id
            }
        });

        if (!clinic) {
            return res.status(400).json({ error: 'Invalid clinic selected' });
        }

        // Validate appointment time (future date)
        const appointmentDateTime = new Date(appointmentDate);
        if (appointmentDateTime <= new Date()) {
            return res.status(400).json({ error: 'Appointment must be scheduled for a future date and time' });
        }

        // Check for scheduling conflicts
        const conflictingAppointment = await prisma.appointment.findFirst({
            where: {
                doctorId,
                appointmentDate: {
                    gte: new Date(appointmentDateTime.getTime() - (duration || 30) * 60 * 1000),
                    lte: new Date(appointmentDateTime.getTime() + (duration || 30) * 60 * 1000)
                },
                status: {
                    in: ['SCHEDULED', 'CONFIRMED']
                }
            }
        });

        if (conflictingAppointment) {
            return res.status(400).json({ error: 'Doctor has a conflicting appointment at this time' });
        }

        // Create appointment
        const appointment = await prisma.appointment.create({
            data: {
                patientId,
                doctorId,
                clinicId,
                appointmentDate: appointmentDateTime,
                duration: duration || 30,
                notes,
                status: 'SCHEDULED'
            },
            include: {
                patient: {
                    select: {
                        id: true,
                        name: true,
                        phone: true,
                        email: true
                    }
                },
                doctor: {
                    select: {
                        id: true,
                        name: true,
                        specialization: true
                    }
                },
                clinic: {
                    select: {
                        id: true,
                        name: true,
                        address: true
                    }
                }
            }
        });

        // TODO: Send confirmation notifications
        // await sendAppointmentConfirmation(appointment);

        res.status(201).json({
            appointment
        });
    } catch (error) {
        console.error('Create appointment error:', error);
        res.status(500).json({ error: 'Failed to create appointment' });
    }
};

// GET /api/appointments/:id
const getAppointmentById = async (req, res) => {
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

        // 1. Find appointment by ID
        // 2. Check if appointment belongs to user's organization
        // 3. Include patient, doctor, and clinic details
        // 4. Return appointment details

        const whereConditions = {
            id,
            clinic: {
                organizationId: user.organization.id
            }
        };

        // Apply role-based filtering
        if (user.role === 'DOCTOR') {
            whereConditions.doctorId = userId;
        }

        const appointment = await prisma.appointment.findFirst({
            where: whereConditions,
            include: {
                patient: {
                    select: {
                        id: true,
                        name: true,
                        phone: true,
                        email: true,
                        dateOfBirth: true,
                        gender: true,
                        address: true,
                        emergencyContact: true,
                        bloodGroup: true,
                        allergies: true,
                        chronicConditions: true
                    }
                },
                doctor: {
                    select: {
                        id: true,
                        name: true,
                        specialization: true,
                        email: true
                    }
                },
                clinic: {
                    select: {
                        id: true,
                        name: true,
                        address: true,
                        phone: true
                    }
                }
            }
        });

        if (!appointment) {
            return res.status(404).json({ error: 'Appointment not found' });
        }

        res.json({
            appointment
        });
    } catch (error) {
        console.error('Get appointment error:', error);
        res.status(404).json({ error: 'Appointment not found' });
    }
};

// PUT /api/appointments/:id
const updateAppointment = async (req, res) => {
    try {
        const { id } = req.params;
        const { patientId, doctorId, clinicId, appointmentDate, duration, notes, status } = req.body;
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

        // 1. Find appointment by ID
        // 2. Check if appointment belongs to user's organization
        // 3. Validate updates (no conflicts, appropriate status changes)
        // 4. Update appointment
        // 5. Send update notifications if needed
        // 6. Return updated appointment

        const whereConditions = {
            id,
            clinic: {
                organizationId: user.organization.id
            }
        };

        // Apply role-based filtering
        if (user.role === 'DOCTOR') {
            whereConditions.doctorId = userId;
        }

        const existingAppointment = await prisma.appointment.findFirst({
            where: whereConditions
        });

        if (!existingAppointment) {
            return res.status(404).json({ error: 'Appointment not found' });
        }

        // Validate status changes
        if (status && !['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(status)) {
            return res.status(400).json({ error: 'Invalid appointment status' });
        }

        // Check for conflicts if appointment time is being changed
        if (appointmentDate && appointmentDate !== existingAppointment.appointmentDate) {
            const appointmentDateTime = new Date(appointmentDate);
            if (appointmentDateTime <= new Date()) {
                return res.status(400).json({ error: 'Appointment must be scheduled for a future date and time' });
            }

            const conflictingAppointment = await prisma.appointment.findFirst({
                where: {
                    doctorId: doctorId || existingAppointment.doctorId,
                    id: { not: id },
                    appointmentDate: {
                        gte: new Date(appointmentDateTime.getTime() - (duration || existingAppointment.duration) * 60 * 1000),
                        lte: new Date(appointmentDateTime.getTime() + (duration || existingAppointment.duration) * 60 * 1000)
                    },
                    status: {
                        in: ['SCHEDULED', 'CONFIRMED']
                    }
                }
            });

            if (conflictingAppointment) {
                return res.status(400).json({ error: 'Doctor has a conflicting appointment at this time' });
            }
        }

        // Update appointment
        const updatedAppointment = await prisma.appointment.update({
            where: { id },
            data: {
                patientId,
                doctorId,
                clinicId,
                appointmentDate: appointmentDate ? new Date(appointmentDate) : undefined,
                duration,
                notes,
                status
            },
            include: {
                patient: {
                    select: {
                        id: true,
                        name: true,
                        phone: true,
                        email: true
                    }
                },
                doctor: {
                    select: {
                        id: true,
                        name: true,
                        specialization: true
                    }
                },
                clinic: {
                    select: {
                        id: true,
                        name: true,
                        address: true
                    }
                }
            }
        });

        // TODO: Send update notifications if needed
        // if (status !== existingAppointment.status) {
        //     await sendAppointmentStatusUpdate(updatedAppointment);
        // }

        res.json({
            appointment: updatedAppointment
        });
    } catch (error) {
        console.error('Update appointment error:', error);
        res.status(404).json({ error: 'Appointment not found' });
    }
};

// DELETE /api/appointments/:id
const deleteAppointment = async (req, res) => {
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

        // 1. Find appointment by ID
        // 2. Check if appointment belongs to user's organization
        // 3. Check if appointment can be cancelled (not in past, not completed)
        // 4. Update status to CANCELLED
        // 5. Send cancellation notifications
        // 6. Return success message

        const whereConditions = {
            id,
            clinic: {
                organizationId: user.organization.id
            }
        };

        // Apply role-based filtering
        if (user.role === 'DOCTOR') {
            whereConditions.doctorId = userId;
        }

        const appointment = await prisma.appointment.findFirst({
            where: whereConditions
        });

        if (!appointment) {
            return res.status(404).json({ error: 'Appointment not found' });
        }

        // Check if appointment can be cancelled
        if (appointment.appointmentDate <= new Date()) {
            return res.status(400).json({ error: 'Cannot cancel past appointments' });
        }

        if (['COMPLETED', 'CANCELLED'].includes(appointment.status)) {
            return res.status(400).json({ error: 'Appointment is already completed or cancelled' });
        }

        // Update status to CANCELLED
        await prisma.appointment.update({
            where: { id },
            data: { status: 'CANCELLED' }
        });

        // TODO: Send cancellation notifications
        // await sendAppointmentCancellation(appointment);

        res.json({ message: 'Appointment cancelled successfully' });
    } catch (error) {
        console.error('Delete appointment error:', error);
        res.status(400).json({ error: 'Cannot cancel appointment' });
    }
};

module.exports = {
    getAppointments,
    createAppointment,
    getAppointmentById,
    updateAppointment,
    deleteAppointment
}; 