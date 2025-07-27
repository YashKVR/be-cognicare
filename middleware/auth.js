// middleware/auth.js
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Middleware to authenticate JWT token and attach user info to request
 * Verifies token, checks user exists, and adds user data to req.user
 */
const authenticateToken = async (req, res, next) => {
    try {
        // 1. Extract token from Authorization header
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({
                error: 'Access token required',
                code: 'TOKEN_MISSING'
            });
        }

        // 2. Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

        // 3. Find user in database and verify they still exist
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            include: {
                organization: {
                    select: {
                        id: true,
                        name: true,
                        clinics: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    }
                }
            }
        });

        if (!user) {
            return res.status(401).json({
                error: 'User not found',
                code: 'USER_NOT_FOUND'
            });
        }

        // 4. Check if user's email is verified
        if (!user.isEmailVerified) {
            return res.status(403).json({
                error: 'Email verification required',
                code: 'EMAIL_NOT_VERIFIED'
            });
        }

        // 5. Check if user belongs to an organization
        if (!user.organizationId) {
            return res.status(403).json({
                error: 'User must belong to an organization',
                code: 'NO_ORGANIZATION'
            });
        }

        // 6. Attach user info to request object
        req.user = {
            id: user.id,
            email: user.email,
            role: user.role,
            name: user.name,
            specialization: user.specialization,
            organizationId: user.organizationId,
            organization: user.organization,
            clinics: user.organization?.clinics || []
        };

        next();
    } catch (error) {
        // Handle different JWT errors
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                error: 'Invalid token',
                code: 'INVALID_TOKEN'
            });
        }

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                error: 'Token expired',
                code: 'TOKEN_EXPIRED'
            });
        }

        console.error('Auth middleware error:', error);
        return res.status(500).json({
            error: 'Authentication failed',
            code: 'AUTH_ERROR'
        });
    }
};

/**
 * Middleware to check if user has admin role
 * Must be used after authenticateToken
 */
const requireAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            error: 'Authentication required',
            code: 'AUTH_REQUIRED'
        });
    }

    if (req.user.role !== 'ADMIN') {
        return res.status(403).json({
            error: 'Admin access required',
            code: 'ADMIN_REQUIRED'
        });
    }

    next();
};

/**
 * Middleware to check if user has doctor role or higher
 * Must be used after authenticateToken
 */
const requireDoctor = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            error: 'Authentication required',
            code: 'AUTH_REQUIRED'
        });
    }

    if (!['ADMIN', 'DOCTOR'].includes(req.user.role)) {
        return res.status(403).json({
            error: 'Doctor access required',
            code: 'DOCTOR_REQUIRED'
        });
    }

    next();
};

/**
 * Middleware to check if organization has a specific add-on enabled
 * Must be used after authenticateToken
 */
const checkAddOn = (addOnName) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    error: 'Authentication required',
                    code: 'AUTH_REQUIRED'
                });
            }

            // Check if organization has the add-on enabled
            const organizationAddOn = await prisma.organizationAddOn.findFirst({
                where: {
                    organizationId: req.user.organizationId,
                    addOn: {
                        name: addOnName
                    },
                    isActive: true
                }
            });

            if (!organizationAddOn) {
                return res.status(403).json({
                    error: `${addOnName} add-on is required for this feature`,
                    code: 'ADDON_REQUIRED'
                });
            }

            next();
        } catch (error) {
            console.error('Add-on check error:', error);
            return res.status(500).json({
                error: 'Failed to verify add-on access',
                code: 'ADDON_VERIFICATION_ERROR'
            });
        }
    };
};

/**
 * Middleware to verify clinic access
 * Checks if user's organization owns the clinic
 */
const verifyClinicAccess = async (req, res, next) => {
    try {
        const clinicId = req.params.clinicId || req.body.clinicId;

        if (!clinicId) {
            return res.status(400).json({
                error: 'Clinic ID required',
                code: 'CLINIC_ID_REQUIRED'
            });
        }

        // Check if clinic belongs to user's organization
        const clinic = await prisma.clinic.findFirst({
            where: {
                id: clinicId,
                organizationId: req.user.organizationId
            }
        });

        if (!clinic) {
            return res.status(403).json({
                error: 'Access denied to this clinic',
                code: 'CLINIC_ACCESS_DENIED'
            });
        }

        req.clinic = clinic;
        next();
    } catch (error) {
        console.error('Clinic access verification error:', error);
        return res.status(500).json({
            error: 'Failed to verify clinic access',
            code: 'CLINIC_VERIFICATION_ERROR'
        });
    }
};

/**
 * Middleware to verify patient access
 * Checks if patient belongs to user's organization clinics
 */
const verifyPatientAccess = async (req, res, next) => {
    try {
        const patientId = req.params.patientId || req.params.id || req.body.patientId;

        if (!patientId) {
            return res.status(400).json({
                error: 'Patient ID required',
                code: 'PATIENT_ID_REQUIRED'
            });
        }

        // Check if patient belongs to user's organization
        const patient = await prisma.patient.findFirst({
            where: {
                id: patientId,
                clinic: {
                    organizationId: req.user.organizationId
                }
            },
            include: {
                clinic: true
            }
        });

        if (!patient) {
            return res.status(403).json({
                error: 'Access denied to this patient',
                code: 'PATIENT_ACCESS_DENIED'
            });
        }

        req.patient = patient;
        next();
    } catch (error) {
        console.error('Patient access verification error:', error);
        return res.status(500).json({
            error: 'Failed to verify patient access',
            code: 'PATIENT_VERIFICATION_ERROR'
        });
    }
};

/**
 * Optional authentication middleware
 * Attaches user info if token is present, but doesn't require it
 */
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return next(); // Continue without user info
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            include: {
                organization: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });

        if (user && user.isEmailVerified) {
            req.user = {
                id: user.id,
                email: user.email,
                role: user.role,
                name: user.name,
                organizationId: user.organizationId,
                organization: user.organization
            };
        }

        next();
    } catch (error) {
        // Ignore auth errors for optional auth
        next();
    }
};

module.exports = {
    authenticateToken,
    requireAdmin,
    requireDoctor,
    checkAddOn,
    verifyClinicAccess,
    verifyPatientAccess,
    optionalAuth
};