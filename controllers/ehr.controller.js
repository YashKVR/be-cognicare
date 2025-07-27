const prisma = require('../lib/prisma');
const { speechToText, ocrText, generateAISummary } = require('../utils/ai');

// GET /api/ehr/patient/:patientId
const getPatientEHRRecords = async (req, res) => {
    try {
        const { patientId } = req.params;
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

        // 1. Validate patient belongs to user's organization
        // 2. Get all EHR records for the patient
        // 3. Sort by visit date (newest first)
        // 4. Include doctor details
        // 5. Return EHR records

        const patient = await prisma.patient.findFirst({
            where: {
                id: patientId,
                clinic: {
                    organizationId: user.organization.id
                }
            }
        });

        if (!patient) {
            return res.status(404).json({ error: 'Patient not found' });
        }

        const ehrRecords = await prisma.eHRRecord.findMany({
            where: {
                patientId
            },
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
        });

        res.json({
            ehrRecords
        });
    } catch (error) {
        console.error('Get EHR records error:', error);
        res.status(404).json({ error: 'Patient not found' });
    }
};

// POST /api/ehr
const createEHRRecord = async (req, res) => {
    try {
        const {
            patientId,
            chiefComplaint,
            history,
            examination,
            diagnosis,
            treatment,
            prescription,
            notes,
            transcribedNotes,
            ocrNotes,
            aiSummary,
            attachments
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

        // 1. Validate patient belongs to user's organization
        // 2. Create new EHR record
        // 3. If AI features are enabled, process transcribed/OCR notes
        // 4. Return created EHR record

        const patient = await prisma.patient.findFirst({
            where: {
                id: patientId,
                clinic: {
                    organizationId: user.organization.id
                }
            }
        });

        if (!patient) {
            return res.status(404).json({ error: 'Patient not found' });
        }

        // Create EHR record
        const ehrRecord = await prisma.eHRRecord.create({
            data: {
                patientId,
                doctorId: userId,
                chiefComplaint,
                history,
                examination,
                diagnosis,
                treatment,
                prescription,
                notes,
                transcribedNotes,
                ocrNotes,
                aiSummary,
                attachments: attachments || []
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
            }
        });

        res.status(201).json({
            ehrRecord
        });
    } catch (error) {
        console.error('Create EHR record error:', error);
        res.status(500).json({ error: 'Failed to create EHR record' });
    }
};

// GET /api/ehr/:id
const getEHRRecordById = async (req, res) => {
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

        // 1. Find EHR record by ID
        // 2. Check if record belongs to user's organization
        // 3. Include patient and doctor details
        // 4. Return EHR record details

        const ehrRecord = await prisma.eHRRecord.findFirst({
            where: {
                id,
                patient: {
                    clinic: {
                        organizationId: user.organization.id
                    }
                }
            },
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
                }
            }
        });

        if (!ehrRecord) {
            return res.status(404).json({ error: 'EHR record not found' });
        }

        res.json({
            ehrRecord
        });
    } catch (error) {
        console.error('Get EHR record error:', error);
        res.status(404).json({ error: 'EHR record not found' });
    }
};

// PUT /api/ehr/:id
const updateEHRRecord = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            chiefComplaint,
            history,
            examination,
            diagnosis,
            treatment,
            prescription,
            notes,
            transcribedNotes,
            ocrNotes,
            aiSummary,
            attachments
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

        // 1. Find EHR record by ID
        // 2. Check if record belongs to user's organization
        // 3. Check if user has permission to edit (doctor who created it or admin)
        // 4. Update EHR record
        // 5. Return updated record

        const ehrRecord = await prisma.eHRRecord.findFirst({
            where: {
                id,
                patient: {
                    clinic: {
                        organizationId: user.organization.id
                    }
                }
            }
        });

        if (!ehrRecord) {
            return res.status(404).json({ error: 'EHR record not found' });
        }

        // Check if user has permission to edit
        if (ehrRecord.doctorId !== userId && user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'You do not have permission to edit this record' });
        }

        const updatedEHRRecord = await prisma.eHRRecord.update({
            where: { id },
            data: {
                chiefComplaint,
                history,
                examination,
                diagnosis,
                treatment,
                prescription,
                notes,
                transcribedNotes,
                ocrNotes,
                aiSummary,
                attachments: attachments || ehrRecord.attachments
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
            }
        });

        res.json({
            ehrRecord: updatedEHRRecord
        });
    } catch (error) {
        console.error('Update EHR record error:', error);
        res.status(404).json({ error: 'EHR record not found' });
    }
};

// POST /api/ehr/voice-to-text
const voiceToText = async (req, res) => {
    try {
        const { audioData } = req.body; // Base64 encoded audio or file path
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

        // 1. Validate uploaded audio file
        // 2. Call speech-to-text AI service
        // 3. Increment usage count for billing
        // 4. Return transcribed text

        if (!audioData) {
            return res.status(400).json({ error: 'Audio data is required' });
        }

        // Call AI service for speech-to-text
        const transcribedText = await speechToText(audioData);

        // Increment usage count for billing
        await prisma.organizationAddOn.updateMany({
            where: {
                organizationId: user.organization.id,
                addOn: {
                    name: 'AI Scribe'
                }
            },
            data: {
                usageCount: {
                    increment: 1
                }
            }
        });

        res.json({
            transcribedText
        });
    } catch (error) {
        console.error('Voice to text error:', error);
        res.status(500).json({ error: 'Failed to transcribe audio' });
    }
};

// POST /api/ehr/ocr
const extractTextFromImage = async (req, res) => {
    try {
        const { imageData } = req.body; // Base64 encoded image or file path
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

        // 1. Validate uploaded image file
        // 2. Call OCR AI service
        // 3. Increment usage count for billing
        // 4. Return extracted text

        if (!imageData) {
            return res.status(400).json({ error: 'Image data is required' });
        }

        // Call AI service for OCR
        const extractedText = await ocrText(imageData);

        // Increment usage count for billing
        await prisma.organizationAddOn.updateMany({
            where: {
                organizationId: user.organization.id,
                addOn: {
                    name: 'AI Scribe'
                }
            },
            data: {
                usageCount: {
                    increment: 1
                }
            }
        });

        res.json({
            extractedText
        });
    } catch (error) {
        console.error('OCR error:', error);
        res.status(500).json({ error: 'Failed to extract text from image' });
    }
};

// POST /api/ehr/ai-summary
const generateSummary = async (req, res) => {
    try {
        const { text } = req.body;
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

        // 1. Validate input text from request
        // 2. Call AI summarization service
        // 3. Increment usage count for billing
        // 4. Return AI-generated summary

        if (!text) {
            return res.status(400).json({ error: 'Text input is required' });
        }

        // Call AI service for summarization
        const aiSummary = await generateAISummary(text);

        // Increment usage count for billing
        await prisma.organizationAddOn.updateMany({
            where: {
                organizationId: user.organization.id,
                addOn: {
                    name: 'AI Scribe'
                }
            },
            data: {
                usageCount: {
                    increment: 1
                }
            }
        });

        res.json({
            aiSummary
        });
    } catch (error) {
        console.error('AI summary error:', error);
        res.status(500).json({ error: 'Failed to generate AI summary' });
    }
};

module.exports = {
    getPatientEHRRecords,
    createEHRRecord,
    getEHRRecordById,
    updateEHRRecord,
    voiceToText,
    extractTextFromImage,
    generateSummary
}; 