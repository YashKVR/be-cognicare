const prisma = require('../lib/prisma');

// GET /api/analytics/dashboard
const getDashboardAnalytics = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
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

        // 1. Get date range from query parameters (default: last 30 days)
        // 2. Calculate key metrics for user's organization:
        //    - Total patients, new patients this month
        //    - Total appointments, completed appointments
        //    - Revenue (if billing add-on enabled)
        //    - Doctor utilization rates
        // 3. Return dashboard metrics

        const end = endDate ? new Date(endDate) : new Date();
        const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

        // Get organization clinics
        const clinics = await prisma.clinic.findMany({
            where: {
                organizationId: user.organization.id
            },
            select: {
                id: true
            }
        });

        const clinicIds = clinics.map(clinic => clinic.id);

        // Calculate metrics
        const [
            totalPatients,
            newPatientsThisMonth,
            totalAppointments,
            completedAppointments,
            doctorUtilization
        ] = await Promise.all([
            // Total patients
            prisma.patient.count({
                where: {
                    clinicId: {
                        in: clinicIds
                    }
                }
            }),

            // New patients this month
            prisma.patient.count({
                where: {
                    clinicId: {
                        in: clinicIds
                    },
                    createdAt: {
                        gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                    }
                }
            }),

            // Total appointments in date range
            prisma.appointment.count({
                where: {
                    clinicId: {
                        in: clinicIds
                    },
                    appointmentDate: {
                        gte: start,
                        lte: end
                    }
                }
            }),

            // Completed appointments in date range
            prisma.appointment.count({
                where: {
                    clinicId: {
                        in: clinicIds
                    },
                    appointmentDate: {
                        gte: start,
                        lte: end
                    },
                    status: 'COMPLETED'
                }
            }),

            // Doctor utilization rates
            prisma.user.findMany({
                where: {
                    organizationId: user.organization.id,
                    role: 'DOCTOR'
                },
                select: {
                    id: true,
                    name: true,
                    specialization: true,
                    _count: {
                        select: {
                            appointments: {
                                where: {
                                    appointmentDate: {
                                        gte: start,
                                        lte: end
                                    },
                                    status: 'COMPLETED'
                                }
                            }
                        }
                    }
                }
            })
        ]);

        // Calculate revenue (placeholder - implement based on your billing system)
        const revenue = 0; // TODO: Calculate based on billing add-on

        res.json({
            metrics: {
                totalPatients,
                newPatientsThisMonth,
                totalAppointments,
                completedAppointments,
                revenue,
                doctorUtilization: doctorUtilization.map(doctor => ({
                    id: doctor.id,
                    name: doctor.name,
                    specialization: doctor.specialization,
                    completedAppointments: doctor._count.appointments,
                    utilizationRate: totalAppointments > 0 ? (doctor._count.appointments / totalAppointments) * 100 : 0
                }))
            }
        });
    } catch (error) {
        console.error('Dashboard analytics error:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard analytics' });
    }
};

// GET /api/analytics/appointments
const getAppointmentAnalytics = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
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

        // 1. Get date range and filters from query parameters
        // 2. Generate appointment analytics:
        //    - Appointments by status
        //    - Appointments by time of day
        //    - No-show rates
        //    - Average wait times
        // 3. Return appointment analytics

        const end = endDate ? new Date(endDate) : new Date();
        const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

        // Get organization clinics
        const clinics = await prisma.clinic.findMany({
            where: {
                organizationId: user.organization.id
            },
            select: {
                id: true
            }
        });

        const clinicIds = clinics.map(clinic => clinic.id);

        // Get appointments in date range
        const appointments = await prisma.appointment.findMany({
            where: {
                clinicId: {
                    in: clinicIds
                },
                appointmentDate: {
                    gte: start,
                    lte: end
                }
            },
            select: {
                status: true,
                appointmentDate: true,
                duration: true
            }
        });

        // Calculate analytics
        const byStatus = {
            completed: appointments.filter(a => a.status === 'COMPLETED').length,
            cancelled: appointments.filter(a => a.status === 'CANCELLED').length,
            noShow: appointments.filter(a => a.status === 'NO_SHOW').length,
            scheduled: appointments.filter(a => a.status === 'SCHEDULED').length,
            confirmed: appointments.filter(a => a.status === 'CONFIRMED').length,
            inProgress: appointments.filter(a => a.status === 'IN_PROGRESS').length
        };

        // Appointments by time of day
        const byTimeOfDay = Array.from({ length: 24 }, (_, hour) => {
            const hourAppointments = appointments.filter(a => {
                const appointmentHour = new Date(a.appointmentDate).getHours();
                return appointmentHour === hour;
            });
            return {
                hour,
                count: hourAppointments.length
            };
        });

        // No-show rate
        const totalAppointmentsCount = appointments.length;
        const noShowRate = totalAppointmentsCount > 0 ? (byStatus.noShow / totalAppointmentsCount) * 100 : 0;

        // Average wait time (placeholder - implement based on your tracking system)
        const averageWaitTime = 15; // minutes

        res.json({
            appointmentAnalytics: {
                byStatus,
                byTimeOfDay,
                noShowRate,
                averageWaitTime
            }
        });
    } catch (error) {
        console.error('Appointment analytics error:', error);
        res.status(500).json({ error: 'Failed to fetch appointment analytics' });
    }
};

// GET /api/analytics/patients
const getPatientAnalytics = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
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

        // 1. Get date range and filters from query parameters
        // 2. Generate patient analytics:
        //    - Patient demographics (age, gender)
        //    - New vs returning patients
        //    - Patient visit frequency
        //    - Top diagnoses/conditions
        // 3. Return patient analytics

        const end = endDate ? new Date(endDate) : new Date();
        const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

        // Get organization clinics
        const clinics = await prisma.clinic.findMany({
            where: {
                organizationId: user.organization.id
            },
            select: {
                id: true
            }
        });

        const clinicIds = clinics.map(clinic => clinic.id);

        // Get patients with their details
        const patients = await prisma.patient.findMany({
            where: {
                clinicId: {
                    in: clinicIds
                }
            },
            select: {
                id: true,
                name: true,
                dateOfBirth: true,
                gender: true,
                createdAt: true,
                appointments: {
                    where: {
                        appointmentDate: {
                            gte: start,
                            lte: end
                        }
                    }
                }
            }
        });

        // Calculate demographics
        const ageGroups = [
            { range: '0-18', count: 0 },
            { range: '19-30', count: 0 },
            { range: '31-50', count: 0 },
            { range: '51-65', count: 0 },
            { range: '65+', count: 0 }
        ];

        const genderDistribution = {
            male: 0,
            female: 0,
            other: 0
        };

        patients.forEach(patient => {
            // Calculate age
            if (patient.dateOfBirth) {
                const age = new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear();
                if (age <= 18) ageGroups[0].count++;
                else if (age <= 30) ageGroups[1].count++;
                else if (age <= 50) ageGroups[2].count++;
                else if (age <= 65) ageGroups[3].count++;
                else ageGroups[4].count++;
            }

            // Gender distribution
            if (patient.gender === 'MALE') genderDistribution.male++;
            else if (patient.gender === 'FEMALE') genderDistribution.female++;
            else genderDistribution.other++;
        });

        // New vs returning patients
        const newPatients = patients.filter(p =>
            new Date(p.createdAt) >= start && new Date(p.createdAt) <= end
        ).length;
        const returningPatients = patients.length - newPatients;

        // Patient visit frequency
        const visitFrequency = patients.map(patient => ({
            patientId: patient.id,
            patientName: patient.name,
            visitCount: patient.appointments.length
        })).sort((a, b) => b.visitCount - a.visitCount).slice(0, 10);

        res.json({
            patientAnalytics: {
                demographics: {
                    ageGroups,
                    genderDistribution
                },
                newVsReturning: {
                    new: newPatients,
                    returning: returningPatients
                },
                visitFrequency
            }
        });
    } catch (error) {
        console.error('Patient analytics error:', error);
        res.status(500).json({ error: 'Failed to fetch patient analytics' });
    }
};

module.exports = {
    getDashboardAnalytics,
    getAppointmentAnalytics,
    getPatientAnalytics
}; 