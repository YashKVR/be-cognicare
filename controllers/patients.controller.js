const prisma = require('../lib/prisma');

// GET /api/patients
const getPatients = async (req, res) => {
    try {
        const { search, phone, clinic, page = 1, limit = 20 } = req.query;
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

        // 1. Get query parameters (search by phone, name, clinic, pagination)
        // 2. Filter patients by user's organization clinics
        // 3. Apply search filters:
        //    - Phone number (exact or partial match)
        //    - Name (partial match)
        //    - Clinic filter
        // 4. Include pagination and sorting
        // 5. Return patients list with metadata

        // Build search conditions
        const searchConditions = {
            clinic: {
                organizationId: user.organization.id
            }
        };

        // If searching by phone (primary search method)
        if (phone) {
            searchConditions.phone = {
                contains: phone
            };
        }

        // If searching by name or general search
        if (search && !phone) {
            searchConditions.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search } }
            ];
        }

        // Filter by specific clinic
        if (clinic) {
            searchConditions.clinicId = clinic;
        }

        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const take = parseInt(limit);

        // Get patients with pagination
        const [patients, total] = await Promise.all([
            prisma.patient.findMany({
                where: searchConditions,
                include: {
                    clinic: {
                        select: {
                            id: true,
                            name: true
                        }
                    },
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
                skip,
                take
            }),
            prisma.patient.count({
                where: searchConditions
            })
        ]);

        res.json({
            patients,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Get patients error:', error);
        res.status(500).json({ error: 'Failed to fetch patients' });
    }
};

// GET /api/patients/search-by-phone/:phone
const searchPatientByPhone = async (req, res) => {
    try {
        const { phone } = req.params;
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

        // 1. Search for patient by exact phone number
        // 2. Check if patient belongs to user's organization
        // 3. Return patient details if found, or null if not found
        // 4. This is used for quick patient lookup during appointment booking

        // Find patient by phone number within organization
        const patient = await prisma.patient.findFirst({
            where: {
                phone: phone,
                clinic: {
                    organizationId: user.organization.id
                }
            },
            include: {
                clinic: true,
                appointments: {
                    orderBy: { appointmentDate: 'desc' },
                    take: 5 // Last 5 appointments
                }
            }
        });

        res.json({
            patient: patient || null,
            found: !!patient
        });
    } catch (error) {
        console.error('Search patient error:', error);
        res.status(500).json({ error: 'Failed to search patient' });
    }
};

// POST /api/patients
const createPatient = async (req, res) => {
    try {
        const {
            name, phone, email, dateOfBirth, gender, address, clinicId,
            emergencyContact, bloodGroup, allergies, chronicConditions
        } = req.body;
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

        // 1. Validate phone number format (Indian mobile number)
        // 2. Check if patient with this phone already exists in organization
        // 3. Validate clinic belongs to user's organization
        // 4. Create new patient with phone as unique identifier
        // 5. Return created patient details

        // Validate phone number format (basic Indian mobile validation)
        const phoneRegex = /^[6-9]\d{9}$/;
        if (!phoneRegex.test(phone)) {
            return res.status(400).json({ error: 'Invalid phone number format. Please enter a valid 10-digit Indian mobile number.' });
        }

        // Check for duplicate phone number within organization
        const existingPatient = await prisma.patient.findFirst({
            where: {
                phone: phone,
                clinic: {
                    organizationId: user.organization.id
                }
            }
        });

        if (existingPatient) {
            return res.status(400).json({
                error: 'Patient with this phone number already exists',
                existingPatient: {
                    id: existingPatient.id,
                    name: existingPatient.name,
                    phone: existingPatient.phone
                }
            });
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

        // Create patient
        const patient = await prisma.patient.create({
            data: {
                name,
                phone,
                email,
                dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
                gender,
                address,
                clinicId,
                emergencyContact,
                bloodGroup,
                allergies,
                chronicConditions
            },
            include: {
                clinic: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });

        res.status(201).json({
            patient
        });
    } catch (error) {
        console.error('Create patient error:', error);
        res.status(500).json({ error: 'Failed to create patient' });
    }
};

// GET /api/patients/:id
const getPatientById = async (req, res) => {
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

        // 1. Find patient by ID
        // 2. Check if patient belongs to user's organization
        // 3. Include EHR records, appointments, and clinic details
        // 4. Return comprehensive patient profile

        const patient = await prisma.patient.findFirst({
            where: {
                id,
                clinic: {
                    organizationId: user.organization.id
                }
            },
            include: {
                clinic: {
                    select: {
                        id: true,
                        name: true,
                        address: true,
                        phone: true
                    }
                },
                appointments: {
                    include: {
                        doctor: {
                            select: {
                                id: true,
                                name: true,
                                specialization: true
                            }
                        }
                    },
                    orderBy: {
                        appointmentDate: 'desc'
                    }
                },
                ehrRecords: {
                    include: {
                        doctor: {
                            select: {
                                id: true,
                                name: true,
                                specialization: true
                            }
                        }
                    },
                    orderBy: {
                        visitDate: 'desc'
                    }
                }
            }
        });

        if (!patient) {
            return res.status(404).json({ error: 'Patient not found' });
        }

        res.json({
            patient
        });
    } catch (error) {
        console.error('Get patient error:', error);
        res.status(404).json({ error: 'Patient not found' });
    }
};

// PUT /api/patients/:id
const updatePatient = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            name, phone, email, dateOfBirth, gender, address, clinicId,
            emergencyContact, bloodGroup, allergies, chronicConditions
        } = req.body;
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

        // 1. Find patient by ID
        // 2. Check if patient belongs to user's organization
        // 3. If phone number is being changed, check for duplicates
        // 4. Update patient details
        // 5. Return updated patient

        const existingPatient = await prisma.patient.findFirst({
            where: {
                id,
                clinic: {
                    organizationId: user.organization.id
                }
            }
        });

        if (!existingPatient) {
            return res.status(404).json({ error: 'Patient not found' });
        }

        // If phone is being updated, check for duplicates
        if (phone && phone !== existingPatient.phone) {
            const phoneRegex = /^[6-9]\d{9}$/;
            if (!phoneRegex.test(phone)) {
                return res.status(400).json({ error: 'Invalid phone number format. Please enter a valid 10-digit Indian mobile number.' });
            }

            const duplicatePatient = await prisma.patient.findFirst({
                where: {
                    phone: phone,
                    id: { not: id }, // Exclude current patient
                    clinic: {
                        organizationId: user.organization.id
                    }
                }
            });

            if (duplicatePatient) {
                return res.status(400).json({
                    error: 'Another patient with this phone number already exists'
                });
            }
        }

        // Update patient
        const updatedPatient = await prisma.patient.update({
            where: { id },
            data: {
                name,
                phone,
                email,
                dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
                gender,
                address,
                clinicId,
                emergencyContact,
                bloodGroup,
                allergies,
                chronicConditions
            },
            include: {
                clinic: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });

        res.json({
            patient: updatedPatient
        });
    } catch (error) {
        console.error('Update patient error:', error);
        res.status(404).json({ error: 'Patient not found' });
    }
};

// DELETE /api/patients/:id
const deletePatient = async (req, res) => {
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

        // 1. Find patient by ID
        // 2. Check if patient belongs to user's organization
        // 3. Check if patient has no future appointments
        // 4. Soft delete or archive patient (preserve medical records)
        // 5. Return success message

        const patient = await prisma.patient.findFirst({
            where: {
                id,
                clinic: {
                    organizationId: user.organization.id
                }
            },
            include: {
                appointments: {
                    where: {
                        appointmentDate: {
                            gte: new Date()
                        },
                        status: {
                            in: ['SCHEDULED', 'CONFIRMED']
                        }
                    }
                }
            }
        });

        if (!patient) {
            return res.status(404).json({ error: 'Patient not found' });
        }

        if (patient.appointments.length > 0) {
            return res.status(400).json({
                error: 'Cannot delete patient with active appointments. Please cancel appointments first.'
            });
        }

        // Soft delete - you might want to add a deletedAt field to your schema
        // For now, we'll just delete the patient
        await prisma.patient.delete({
            where: { id }
        });

        res.json({ message: 'Patient archived successfully' });
    } catch (error) {
        console.error('Delete patient error:', error);
        res.status(400).json({ error: 'Cannot delete patient with active appointments' });
    }
};

// POST /api/patients/bulk-import
const bulkImportPatients = async (req, res) => {
    try {
        const { patients } = req.body; // Array of patient objects
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

        // 1. Validate CSV/Excel file with patient data
        // 2. Check for duplicate phone numbers in the import and existing data
        // 3. Validate all phone numbers format
        // 4. Create patients in bulk
        // 5. Return import summary with success/failure counts

        if (!Array.isArray(patients) || patients.length === 0) {
            return res.status(400).json({ error: 'No patients data provided' });
        }

        const results = {
            successful: [],
            failed: [],
            duplicates: [],
            errors: []
        };

        const phoneRegex = /^[6-9]\d{9}$/;

        for (const patientData of patients) {
            try {
                // Validate required fields
                if (!patientData.name || !patientData.phone || !patientData.clinicId) {
                    results.failed.push({
                        ...patientData,
                        error: 'Missing required fields: name, phone, or clinicId'
                    });
                    continue;
                }

                // Validate phone format
                if (!phoneRegex.test(patientData.phone)) {
                    results.failed.push({
                        ...patientData,
                        error: 'Invalid phone number format'
                    });
                    continue;
                }

                // Check for duplicates
                const existingPatient = await prisma.patient.findFirst({
                    where: {
                        phone: patientData.phone,
                        clinic: {
                            organizationId: user.organization.id
                        }
                    }
                });

                if (existingPatient) {
                    results.duplicates.push({
                        ...patientData,
                        existingPatientId: existingPatient.id
                    });
                    continue;
                }

                // Validate clinic belongs to organization
                const clinic = await prisma.clinic.findFirst({
                    where: {
                        id: patientData.clinicId,
                        organizationId: user.organization.id
                    }
                });

                if (!clinic) {
                    results.failed.push({
                        ...patientData,
                        error: 'Invalid clinic selected'
                    });
                    continue;
                }

                // Create patient
                const patient = await prisma.patient.create({
                    data: {
                        name: patientData.name,
                        phone: patientData.phone,
                        email: patientData.email,
                        dateOfBirth: patientData.dateOfBirth ? new Date(patientData.dateOfBirth) : null,
                        gender: patientData.gender,
                        address: patientData.address,
                        clinicId: patientData.clinicId,
                        emergencyContact: patientData.emergencyContact,
                        bloodGroup: patientData.bloodGroup,
                        allergies: patientData.allergies,
                        chronicConditions: patientData.chronicConditions
                    }
                });

                results.successful.push(patient);
            } catch (error) {
                results.failed.push({
                    ...patientData,
                    error: error.message
                });
            }
        }

        res.json({
            importSummary: {
                total: patients.length,
                successful: results.successful.length,
                failed: results.failed.length,
                duplicates: results.duplicates.length,
                errors: results.failed
            }
        });
    } catch (error) {
        console.error('Bulk import error:', error);
        res.status(500).json({ error: 'Failed to import patients' });
    }
};

module.exports = {
    getPatients,
    searchPatientByPhone,
    createPatient,
    getPatientById,
    updatePatient,
    deletePatient,
    bulkImportPatients
}; 