// middleware/validation.js
const { body, param, query, validationResult } = require('express-validator');

/**
 * Middleware to handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Validation failed',
            details: errors.array()
        });
    }
    next();
};

/**
 * Validation for user signup
 */
const validateSignup = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email address'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long'),
    body('name')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Name must be between 2 and 100 characters'),
    body('role')
        .optional()
        .isIn(['ADMIN', 'DOCTOR', 'STAFF'])
        .withMessage('Invalid role specified'),
    body('organizationId')
        .optional()
        .isUUID()
        .withMessage('Invalid organization ID'),
    handleValidationErrors
];

/**
 * Validation for user login
 */
const validateLogin = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email address'),
    body('password')
        .notEmpty()
        .withMessage('Password is required'),
    handleValidationErrors
];

/**
 * Validation for email operations
 */
const validateEmail = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email address'),
    handleValidationErrors
];

/**
 * Validation for organization creation/update
 */
const validateOrganization = [
    body('name')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Organization name must be between 2 and 100 characters'),
    body('address')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Address must not exceed 500 characters'),
    body('gstNumber')
        .optional()
        .matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/)
        .withMessage('Please provide a valid GST number'),
    body('contactEmail')
        .optional()
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid contact email'),
    body('contactPhone')
        .optional()
        .matches(/^[6-9]\d{9}$/)
        .withMessage('Please provide a valid 10-digit Indian mobile number'),
    handleValidationErrors
];

/**
 * Validation for clinic creation/update
 */
const validateClinic = [
    body('name')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Clinic name must be between 2 and 100 characters'),
    body('address')
        .trim()
        .isLength({ min: 10, max: 500 })
        .withMessage('Address must be between 10 and 500 characters'),
    body('phone')
        .matches(/^[6-9]\d{9}$/)
        .withMessage('Please provide a valid 10-digit Indian mobile number'),
    handleValidationErrors
];

/**
 * Validation for patient creation/update
 */
const validatePatient = [
    body('name')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Patient name must be between 2 and 100 characters'),
    body('phone')
        .matches(/^[6-9]\d{9}$/)
        .withMessage('Please provide a valid 10-digit Indian mobile number'),
    body('email')
        .optional()
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email address'),
    body('dateOfBirth')
        .optional()
        .isISO8601()
        .withMessage('Please provide a valid date of birth'),
    body('gender')
        .optional()
        .isIn(['MALE', 'FEMALE', 'OTHER'])
        .withMessage('Invalid gender specified'),
    body('address')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Address must not exceed 500 characters'),
    body('clinicId')
        .isUUID()
        .withMessage('Invalid clinic ID'),
    body('emergencyContact')
        .optional()
        .matches(/^[6-9]\d{9}$/)
        .withMessage('Please provide a valid emergency contact number'),
    body('bloodGroup')
        .optional()
        .isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
        .withMessage('Invalid blood group'),
    body('allergies')
        .optional()
        .isArray()
        .withMessage('Allergies must be an array'),
    body('chronicConditions')
        .optional()
        .isArray()
        .withMessage('Chronic conditions must be an array'),
    handleValidationErrors
];

/**
 * Validation for phone number
 */
const validatePhone = [
    param('phone')
        .matches(/^[6-9]\d{9}$/)
        .withMessage('Please provide a valid 10-digit Indian mobile number'),
    handleValidationErrors
];

/**
 * Validation for appointment creation/update
 */
const validateAppointment = [
    body('patientId')
        .isUUID()
        .withMessage('Invalid patient ID'),
    body('doctorId')
        .isUUID()
        .withMessage('Invalid doctor ID'),
    body('clinicId')
        .isUUID()
        .withMessage('Invalid clinic ID'),
    body('appointmentDate')
        .isISO8601()
        .withMessage('Please provide a valid appointment date and time'),
    body('duration')
        .optional()
        .isInt({ min: 15, max: 480 })
        .withMessage('Duration must be between 15 and 480 minutes'),
    body('notes')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Notes must not exceed 1000 characters'),
    handleValidationErrors
];

/**
 * Validation for EHR record creation/update
 */
const validateEHRRecord = [
    body('patientId')
        .isUUID()
        .withMessage('Invalid patient ID'),
    body('chiefComplaint')
        .trim()
        .isLength({ min: 5, max: 500 })
        .withMessage('Chief complaint must be between 5 and 500 characters'),
    body('history')
        .optional()
        .trim()
        .isLength({ max: 2000 })
        .withMessage('History must not exceed 2000 characters'),
    body('examination')
        .optional()
        .trim()
        .isLength({ max: 2000 })
        .withMessage('Examination must not exceed 2000 characters'),
    body('diagnosis')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Diagnosis must not exceed 1000 characters'),
    body('treatment')
        .optional()
        .trim()
        .isLength({ max: 2000 })
        .withMessage('Treatment must not exceed 2000 characters'),
    body('prescription')
        .optional()
        .trim()
        .isLength({ max: 2000 })
        .withMessage('Prescription must not exceed 2000 characters'),
    body('notes')
        .optional()
        .trim()
        .isLength({ max: 2000 })
        .withMessage('Notes must not exceed 2000 characters'),
    body('attachments')
        .optional()
        .isArray()
        .withMessage('Attachments must be an array'),
    handleValidationErrors
];

/**
 * Validation for user invitation
 */
const validateInvite = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email address'),
    body('role')
        .isIn(['ADMIN', 'DOCTOR', 'STAFF'])
        .withMessage('Invalid role specified'),
    handleValidationErrors
];

/**
 * Validation for pagination parameters
 */
const validatePagination = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),
    handleValidationErrors
];

/**
 * Validation for date range parameters
 */
const validateDateRange = [
    query('startDate')
        .optional()
        .isISO8601()
        .withMessage('Start date must be a valid ISO date'),
    query('endDate')
        .optional()
        .isISO8601()
        .withMessage('End date must be a valid ISO date'),
    handleValidationErrors
];

/**
 * Validation for UUID parameters
 */
const validateUUID = (paramName) => [
    param(paramName)
        .isUUID()
        .withMessage(`Invalid ${paramName} format`),
    handleValidationErrors
];

module.exports = {
    handleValidationErrors,
    validateSignup,
    validateLogin,
    validateEmail,
    validateOrganization,
    validateClinic,
    validatePatient,
    validatePhone,
    validateAppointment,
    validateEHRRecord,
    validateInvite,
    validatePagination,
    validateDateRange,
    validateUUID
}; 