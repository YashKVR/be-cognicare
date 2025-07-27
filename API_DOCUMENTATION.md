# CogniCare API Documentation

## Overview

CogniCare is a comprehensive healthcare management system API built with Node.js, Express, Prisma, and PostgreSQL. This documentation provides detailed information for frontend developers to integrate with the backend services.

### Base URL
```
Development: http://localhost:3000
Production: https://your-domain.com
```

### API Base Path
```
/api
```

### Content Type
```
Content-Type: application/json
```

## Authentication

### JWT Token Authentication
All protected endpoints require a JWT token in the Authorization header.

```
Authorization: Bearer <your-jwt-token>
```

### Token Format
- **Type**: JWT (JSON Web Token)
- **Algorithm**: HS256
- **Expiration**: 24 hours
- **Payload**: Contains user ID, email, role, and organization ID

### Getting a Token
1. Register a new account via `/api/auth/signup`
2. Verify your email via `/api/auth/verify-email`
3. Login via `/api/auth/login` to receive a token

### Token Refresh
Tokens expire after 24 hours. Users need to login again to get a new token.

## Error Responses

### Standard Error Format
```json
{
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

### Common HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Too Many Requests
- `500` - Internal Server Error

### Rate Limiting
- **Limit**: 100 requests per 15 minutes per IP
- **Headers**: Rate limit information included in response headers

## User Roles

### Role Types
- `ADMIN` - Full access to organization and all features
- `DOCTOR` - Access to patient data, appointments, and EHR
- `STAFF` - Limited access to basic features

### Role-Based Access
- Admin endpoints require `ADMIN` role
- Doctor endpoints require `DOCTOR` or `ADMIN` role
- Staff endpoints are accessible to all authenticated users

---

## Authentication API

### Base Path: `/api/auth`

#### 1. User Registration
**POST** `/api/auth/signup`

Creates a new user account and sends verification email.

**Request Body:**
```json
{
  "email": "doctor@example.com",
  "password": "securepassword123",
  "name": "Dr. John Doe",
  "role": "DOCTOR",
  "organizationId": "org_123" // Optional
}
```

**Validation Rules:**
- Email: Valid email format
- Password: Minimum 6 characters
- Name: 2-100 characters
- Role: ADMIN, DOCTOR, or STAFF

**Response (201):**
```json
{
  "message": "User created successfully. Please check your email to verify your account."
}
```

**Error Responses:**
- `400` - Validation errors or user already exists
- `500` - Internal server error

#### 2. Email Verification
**POST** `/api/auth/verify-email`

Verifies user email using the token sent via email.

**Request Body:**
```json
{
  "token": "verification_token_from_email"
}
```

**Response (200):**
```json
{
  "message": "Email verified successfully. You can now login."
}
```

**Error Responses:**
- `400` - Invalid or expired token

#### 3. User Login
**POST** `/api/auth/login`

Authenticates user and returns JWT token.

**Request Body:**
```json
{
  "email": "doctor@example.com",
  "password": "securepassword123"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_123",
    "email": "doctor@example.com",
    "name": "Dr. John Doe",
    "role": "DOCTOR",
    "organizationId": "org_123",
    "isEmailVerified": true,
    "specialization": "Cardiology"
  }
}
```

**Error Responses:**
- `401` - Invalid credentials or email not verified

#### 4. Forgot Password
**POST** `/api/auth/forgot-password`

Sends password reset email.

**Request Body:**
```json
{
  "email": "doctor@example.com"
}
```

**Response (200):**
```json
{
  "message": "Password reset link sent to your email"
}
```

#### 5. Reset Password
**POST** `/api/auth/reset-password`

Resets password using token from email.

**Request Body:**
```json
{
  "token": "reset_token_from_email",
  "newPassword": "newsecurepassword123"
}
```

**Response (200):**
```json
{
  "message": "Password reset successfully"
}
```

**Error Responses:**
- `400` - Invalid or expired token, weak password

#### 6. Resend Verification Email
**POST** `/api/auth/resend-verification`

Resends email verification link.

**Request Body:**
```json
{
  "email": "doctor@example.com"
}
```

**Response (200):**
```json
{
  "message": "Verification email sent"
}
```

**Error Responses:**
- `400` - User not found or already verified

---

## Organizations API

### Base Path: `/api/organizations`

**Authentication Required:** All endpoints require authentication
**Admin Access Required:** Most endpoints require ADMIN role

#### 1. Create Organization
**POST** `/api/organizations`

Creates a new healthcare organization.

**Request Body:**
```json
{
  "name": "City General Hospital",
  "address": "123 Healthcare Ave, Medical District",
  "gstNumber": "27ABCDE1234F1Z5",
  "contactEmail": "admin@cityhospital.com",
  "contactPhone": "9876543210"
}
```

**Validation Rules:**
- Name: 2-100 characters
- Address: Optional, max 500 characters
- GST Number: Valid Indian GST format
- Contact Email: Valid email format
- Contact Phone: 10-digit Indian mobile number

**Response (201):**
```json
{
  "id": "org_123",
  "name": "City General Hospital",
  "address": "123 Healthcare Ave, Medical District",
  "gstNumber": "27ABCDE1234F1Z5",
  "contactEmail": "admin@cityhospital.com",
  "contactPhone": "9876543210",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

#### 2. Get Organization Details
**GET** `/api/organizations/:id`

Retrieves organization details by ID.

**Response (200):**
```json
{
  "id": "org_123",
  "name": "City General Hospital",
  "address": "123 Healthcare Ave, Medical District",
  "gstNumber": "27ABCDE1234F1Z5",
  "contactEmail": "admin@cityhospital.com",
  "contactPhone": "9876543210",
  "users": [
    {
      "id": "user_123",
      "name": "Dr. John Doe",
      "email": "doctor@cityhospital.com",
      "role": "DOCTOR"
    }
  ],
  "clinics": [
    {
      "id": "clinic_123",
      "name": "Cardiology Clinic",
      "address": "Building A, Floor 2"
    }
  ],
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

#### 3. Update Organization
**PUT** `/api/organizations/:id`

Updates organization information.

**Request Body:**
```json
{
  "name": "City General Hospital & Research Center",
  "address": "123 Healthcare Ave, Medical District, City",
  "contactEmail": "info@cityhospital.com"
}
```

**Response (200):**
```json
{
  "id": "org_123",
  "name": "City General Hospital & Research Center",
  "address": "123 Healthcare Ave, Medical District, City",
  "gstNumber": "27ABCDE1234F1Z5",
  "contactEmail": "info@cityhospital.com",
  "contactPhone": "9876543210",
  "updatedAt": "2024-01-15T11:30:00Z"
}
```

#### 4. Delete Organization
**DELETE** `/api/organizations/:id`

Deletes an organization and all associated data.

**Response (200):**
```json
{
  "message": "Organization deleted successfully"
}
```

#### 5. Get Organization Statistics
**GET** `/api/organizations/:id/stats`

Retrieves organization statistics and analytics.

**Response (200):**
```json
{
  "totalUsers": 25,
  "totalClinics": 5,
  "totalPatients": 1500,
  "totalAppointments": 8500,
  "activeSubscriptions": 3,
  "monthlyRevenue": 250000,
  "growthRate": 15.5
}
```

#### 6. Invite User to Organization
**POST** `/api/organizations/:id/invite`

Sends invitation email to join organization.

**Request Body:**
```json
{
  "email": "newdoctor@example.com",
  "role": "DOCTOR",
  "message": "You're invited to join our medical team"
}
```

**Response (200):**
```json
{
  "message": "Invitation sent successfully",
  "inviteId": "invite_123"
}
```

#### 7. Get Organization Users
**GET** `/api/organizations/:id/users`

Retrieves all users in the organization.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `role` (optional): Filter by role (ADMIN, DOCTOR, STAFF)

**Response (200):**
```json
{
  "users": [
    {
      "id": "user_123",
      "name": "Dr. John Doe",
      "email": "doctor@cityhospital.com",
      "role": "DOCTOR",
      "specialization": "Cardiology",
      "isEmailVerified": true,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "total": 25,
    "page": 1,
    "limit": 10,
    "totalPages": 3
  }
}
```

---

## Clinics API

### Base Path: `/api/clinics`

**Authentication Required:** All endpoints require authentication
**Access Control:** Users can only access clinics in their organization

#### 1. Create Clinic
**POST** `/api/clinics`

Creates a new clinic within the user's organization.

**Request Body:**
```json
{
  "name": "Cardiology Clinic",
  "address": "Building A, Floor 2, Room 201",
  "phone": "9876543210"
}
```

**Validation Rules:**
- Name: 2-100 characters
- Address: Optional, max 500 characters
- Phone: 10-digit Indian mobile number

**Response (201):**
```json
{
  "id": "clinic_123",
  "name": "Cardiology Clinic",
  "address": "Building A, Floor 2, Room 201",
  "phone": "9876543210",
  "organizationId": "org_123",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

#### 2. Get All Clinics
**GET** `/api/clinics`

Retrieves all clinics in the user's organization.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `search` (optional): Search by clinic name

**Response (200):**
```json
{
  "clinics": [
    {
      "id": "clinic_123",
      "name": "Cardiology Clinic",
      "address": "Building A, Floor 2, Room 201",
      "phone": "9876543210",
      "organizationId": "org_123",
      "patientCount": 150,
      "appointmentCount": 25,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "total": 5,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

#### 3. Get Clinic Details
**GET** `/api/clinics/:id`

Retrieves detailed information about a specific clinic.

**Response (200):**
```json
{
  "id": "clinic_123",
  "name": "Cardiology Clinic",
  "address": "Building A, Floor 2, Room 201",
  "phone": "9876543210",
  "organizationId": "org_123",
  "organization": {
    "id": "org_123",
    "name": "City General Hospital"
  },
  "patients": [
    {
      "id": "patient_123",
      "name": "John Smith",
      "age": 45,
      "gender": "MALE"
    }
  ],
  "appointments": [
    {
      "id": "appointment_123",
      "patientName": "John Smith",
      "doctorName": "Dr. Jane Doe",
      "date": "2024-01-20T10:00:00Z",
      "status": "SCHEDULED"
    }
  ],
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

#### 4. Update Clinic
**PUT** `/api/clinics/:id`

Updates clinic information.

**Request Body:**
```json
{
  "name": "Advanced Cardiology Clinic",
  "address": "Building A, Floor 2, Room 201-205",
  "phone": "9876543211"
}
```

**Response (200):**
```json
{
  "id": "clinic_123",
  "name": "Advanced Cardiology Clinic",
  "address": "Building A, Floor 2, Room 201-205",
  "phone": "9876543211",
  "organizationId": "org_123",
  "updatedAt": "2024-01-15T11:30:00Z"
}
```

#### 5. Delete Clinic
**DELETE** `/api/clinics/:id`

Deletes a clinic and all associated data.

**Response (200):**
```json
{
  "message": "Clinic deleted successfully"
}
```

#### 6. Get Clinic Statistics
**GET** `/api/clinics/:id/stats`

Retrieves clinic-specific statistics and analytics.

**Response (200):**
```json
{
  "totalPatients": 150,
  "totalAppointments": 850,
  "appointmentsThisMonth": 45,
  "averageWaitTime": 15,
  "patientSatisfaction": 4.5,
  "revenueThisMonth": 75000,
  "topDoctors": [
    {
      "id": "user_123",
      "name": "Dr. Jane Doe",
      "appointmentCount": 120
    }
  ]
}
```

#### 7. Get Clinic Patients
**GET** `/api/clinics/:id/patients`

Retrieves all patients registered at the clinic.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `search` (optional): Search by patient name
- `gender` (optional): Filter by gender (MALE, FEMALE, OTHER)

**Response (200):**
```json
{
  "patients": [
    {
      "id": "patient_123",
      "name": "John Smith",
      "age": 45,
      "gender": "MALE",
      "phone": "9876543210",
      "email": "john.smith@email.com",
      "lastVisit": "2024-01-10T10:00:00Z",
      "nextAppointment": "2024-01-20T10:00:00Z"
    }
  ],
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 10,
    "totalPages": 15
  }
}
```

#### 8. Get Clinic Appointments
**GET** `/api/clinics/:id/appointments`

Retrieves all appointments for the clinic.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `date` (optional): Filter by date (YYYY-MM-DD)
- `status` (optional): Filter by status (SCHEDULED, COMPLETED, CANCELLED)
- `doctorId` (optional): Filter by doctor

**Response (200):**
```json
{
  "appointments": [
    {
      "id": "appointment_123",
      "patientName": "John Smith",
      "doctorName": "Dr. Jane Doe",
      "date": "2024-01-20T10:00:00Z",
      "status": "SCHEDULED",
      "type": "CONSULTATION",
      "notes": "Follow-up appointment"
    }
  ],
  "pagination": {
    "total": 850,
    "page": 1,
    "limit": 10,
    "totalPages": 85
  }
}
```

---

## Patients API

### Base Path: `/api/patients`

**Authentication Required:** All endpoints require authentication
**Access Control:** Users can only access patients in their organization's clinics

#### 1. Create Patient
**POST** `/api/patients`

Creates a new patient record.

**Request Body:**
```json
{
  "name": "John Smith",
  "age": 45,
  "gender": "MALE",
  "phone": "9876543210",
  "email": "john.smith@email.com",
  "address": "123 Main Street, City",
  "emergencyContact": {
    "name": "Jane Smith",
    "phone": "9876543211",
    "relationship": "Spouse"
  },
  "medicalHistory": "Hypertension, Diabetes",
  "allergies": "Penicillin",
  "clinicId": "clinic_123"
}
```

**Validation Rules:**
- Name: 2-100 characters
- Age: 0-150 years
- Gender: MALE, FEMALE, OTHER
- Phone: 10-digit Indian mobile number
- Email: Valid email format (optional)
- Address: Optional, max 500 characters

**Response (201):**
```json
{
  "id": "patient_123",
  "name": "John Smith",
  "age": 45,
  "gender": "MALE",
  "phone": "9876543210",
  "email": "john.smith@email.com",
  "address": "123 Main Street, City",
  "emergencyContact": {
    "name": "Jane Smith",
    "phone": "9876543211",
    "relationship": "Spouse"
  },
  "medicalHistory": "Hypertension, Diabetes",
  "allergies": "Penicillin",
  "clinicId": "clinic_123",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

#### 2. Get All Patients
**GET** `/api/patients`

Retrieves all patients in the user's organization.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `search` (optional): Search by patient name
- `gender` (optional): Filter by gender (MALE, FEMALE, OTHER)
- `clinicId` (optional): Filter by clinic
- `ageMin` (optional): Minimum age
- `ageMax` (optional): Maximum age

**Response (200):**
```json
{
  "patients": [
    {
      "id": "patient_123",
      "name": "John Smith",
      "age": 45,
      "gender": "MALE",
      "phone": "9876543210",
      "email": "john.smith@email.com",
      "clinicId": "clinic_123",
      "clinicName": "Cardiology Clinic",
      "lastVisit": "2024-01-10T10:00:00Z",
      "nextAppointment": "2024-01-20T10:00:00Z",
      "totalAppointments": 15
    }
  ],
  "pagination": {
    "total": 1500,
    "page": 1,
    "limit": 10,
    "totalPages": 150
  }
}
```

#### 3. Get Patient Details
**GET** `/api/patients/:id`

Retrieves detailed information about a specific patient.

**Response (200):**
```json
{
  "id": "patient_123",
  "name": "John Smith",
  "age": 45,
  "gender": "MALE",
  "phone": "9876543210",
  "email": "john.smith@email.com",
  "address": "123 Main Street, City",
  "emergencyContact": {
    "name": "Jane Smith",
    "phone": "9876543211",
    "relationship": "Spouse"
  },
  "medicalHistory": "Hypertension, Diabetes",
  "allergies": "Penicillin",
  "clinicId": "clinic_123",
  "clinic": {
    "id": "clinic_123",
    "name": "Cardiology Clinic"
  },
  "appointments": [
    {
      "id": "appointment_123",
      "date": "2024-01-20T10:00:00Z",
      "status": "SCHEDULED",
      "doctorName": "Dr. Jane Doe",
      "type": "CONSULTATION"
    }
  ],
  "ehrRecords": [
    {
      "id": "ehr_123",
      "date": "2024-01-10T10:00:00Z",
      "diagnosis": "Hypertension",
      "prescription": "Amlodipine 5mg"
    }
  ],
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

#### 4. Update Patient
**PUT** `/api/patients/:id`

Updates patient information.

**Request Body:**
```json
{
  "name": "John Michael Smith",
  "phone": "9876543212",
  "address": "456 New Street, City",
  "medicalHistory": "Hypertension, Diabetes, Asthma"
}
```

**Response (200):**
```json
{
  "id": "patient_123",
  "name": "John Michael Smith",
  "age": 45,
  "gender": "MALE",
  "phone": "9876543212",
  "email": "john.smith@email.com",
  "address": "456 New Street, City",
  "medicalHistory": "Hypertension, Diabetes, Asthma",
  "updatedAt": "2024-01-15T11:30:00Z"
}
```

#### 5. Delete Patient
**DELETE** `/api/patients/:id`

Deletes a patient and all associated data.

**Response (200):**
```json
{
  "message": "Patient deleted successfully"
}
```

#### 6. Get Patient Statistics
**GET** `/api/patients/:id/stats`

Retrieves patient-specific statistics and analytics.

**Response (200):**
```json
{
  "totalAppointments": 25,
  "completedAppointments": 20,
  "cancelledAppointments": 2,
  "totalEHRRecords": 15,
  "lastVisit": "2024-01-10T10:00:00Z",
  "nextAppointment": "2024-01-20T10:00:00Z",
  "averageWaitTime": 12,
  "preferredDoctors": [
    {
      "id": "user_123",
      "name": "Dr. Jane Doe",
      "appointmentCount": 8
    }
  ],
  "commonDiagnoses": [
    {
      "diagnosis": "Hypertension",
      "count": 5
    }
  ]
}
```

#### 7. Search Patients
**GET** `/api/patients/search`

Advanced patient search functionality.

**Query Parameters:**
- `q` (required): Search query
- `fields` (optional): Search fields (name, phone, email)
- `clinicId` (optional): Filter by clinic
- `gender` (optional): Filter by gender
- `ageRange` (optional): Age range (e.g., "20-40")

**Response (200):**
```json
{
  "patients": [
    {
      "id": "patient_123",
      "name": "John Smith",
      "age": 45,
      "gender": "MALE",
      "phone": "9876543210",
      "clinicName": "Cardiology Clinic",
      "matchScore": 0.95
    }
  ],
  "totalResults": 5,
  "searchTime": 0.15
}
```

#### 8. Bulk Import Patients
**POST** `/api/patients/bulk-import`

Imports multiple patients from CSV/JSON file.

**Request Body:**
```json
{
  "patients": [
    {
      "name": "John Smith",
      "age": 45,
      "gender": "MALE",
      "phone": "9876543210",
      "email": "john@email.com",
      "clinicId": "clinic_123"
    }
  ],
  "clinicId": "clinic_123"
}
```

**Response (200):**
```json
{
  "message": "Patients imported successfully",
  "imported": 10,
  "failed": 2,
  "errors": [
    {
      "row": 3,
      "error": "Invalid phone number format"
    }
  ]
}
```

---

## Appointments API

### Base Path: `/api/appointments`

**Authentication Required:** All endpoints require authentication
**Access Control:** Users can only access appointments in their organization

#### 1. Create Appointment
**POST** `/api/appointments`

Creates a new appointment.

**Request Body:**
```json
{
  "patientId": "patient_123",
  "doctorId": "user_123",
  "clinicId": "clinic_123",
  "date": "2024-01-20T10:00:00Z",
  "duration": 30,
  "type": "CONSULTATION",
  "notes": "Follow-up appointment for hypertension",
  "status": "SCHEDULED"
}
```

**Validation Rules:**
- Patient ID: Valid patient ID
- Doctor ID: Valid doctor user ID
- Clinic ID: Valid clinic ID
- Date: Future date and time
- Duration: 15-120 minutes
- Type: CONSULTATION, PROCEDURE, EMERGENCY, FOLLOW_UP
- Status: SCHEDULED, COMPLETED, CANCELLED, NO_SHOW

**Response (201):**
```json
{
  "id": "appointment_123",
  "patientId": "patient_123",
  "doctorId": "user_123",
  "clinicId": "clinic_123",
  "date": "2024-01-20T10:00:00Z",
  "duration": 30,
  "type": "CONSULTATION",
  "notes": "Follow-up appointment for hypertension",
  "status": "SCHEDULED",
  "patient": {
    "id": "patient_123",
    "name": "John Smith",
    "phone": "9876543210"
  },
  "doctor": {
    "id": "user_123",
    "name": "Dr. Jane Doe",
    "specialization": "Cardiology"
  },
  "clinic": {
    "id": "clinic_123",
    "name": "Cardiology Clinic"
  },
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

#### 2. Get All Appointments
**GET** `/api/appointments`

Retrieves all appointments in the user's organization.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `date` (optional): Filter by date (YYYY-MM-DD)
- `status` (optional): Filter by status (SCHEDULED, COMPLETED, CANCELLED, NO_SHOW)
- `type` (optional): Filter by type (CONSULTATION, PROCEDURE, EMERGENCY, FOLLOW_UP)
- `doctorId` (optional): Filter by doctor
- `patientId` (optional): Filter by patient
- `clinicId` (optional): Filter by clinic

**Response (200):**
```json
{
  "appointments": [
    {
      "id": "appointment_123",
      "patientName": "John Smith",
      "doctorName": "Dr. Jane Doe",
      "clinicName": "Cardiology Clinic",
      "date": "2024-01-20T10:00:00Z",
      "duration": 30,
      "type": "CONSULTATION",
      "status": "SCHEDULED",
      "notes": "Follow-up appointment for hypertension"
    }
  ],
  "pagination": {
    "total": 850,
    "page": 1,
    "limit": 10,
    "totalPages": 85
  }
}
```

#### 3. Get Appointment Details
**GET** `/api/appointments/:id`

Retrieves detailed information about a specific appointment.

**Response (200):**
```json
{
  "id": "appointment_123",
  "patientId": "patient_123",
  "doctorId": "user_123",
  "clinicId": "clinic_123",
  "date": "2024-01-20T10:00:00Z",
  "duration": 30,
  "type": "CONSULTATION",
  "notes": "Follow-up appointment for hypertension",
  "status": "SCHEDULED",
  "patient": {
    "id": "patient_123",
    "name": "John Smith",
    "age": 45,
    "gender": "MALE",
    "phone": "9876543210",
    "email": "john.smith@email.com"
  },
  "doctor": {
    "id": "user_123",
    "name": "Dr. Jane Doe",
    "specialization": "Cardiology",
    "phone": "9876543211"
  },
  "clinic": {
    "id": "clinic_123",
    "name": "Cardiology Clinic",
    "address": "Building A, Floor 2, Room 201"
  },
  "ehrRecord": {
    "id": "ehr_123",
    "diagnosis": "Hypertension",
    "prescription": "Amlodipine 5mg"
  },
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

#### 4. Update Appointment
**PUT** `/api/appointments/:id`

Updates appointment information.

**Request Body:**
```json
{
  "date": "2024-01-21T10:00:00Z",
  "duration": 45,
  "notes": "Rescheduled follow-up appointment",
  "status": "SCHEDULED"
}
```

**Response (200):**
```json
{
  "id": "appointment_123",
  "patientId": "patient_123",
  "doctorId": "user_123",
  "clinicId": "clinic_123",
  "date": "2024-01-21T10:00:00Z",
  "duration": 45,
  "type": "CONSULTATION",
  "notes": "Rescheduled follow-up appointment",
  "status": "SCHEDULED",
  "updatedAt": "2024-01-15T11:30:00Z"
}
```

#### 5. Cancel Appointment
**PUT** `/api/appointments/:id/cancel`

Cancels an appointment.

**Request Body:**
```json
{
  "reason": "Patient requested cancellation",
  "cancelledBy": "user_123"
}
```

**Response (200):**
```json
{
  "id": "appointment_123",
  "status": "CANCELLED",
  "cancellationReason": "Patient requested cancellation",
  "cancelledBy": "user_123",
  "cancelledAt": "2024-01-15T11:30:00Z"
}
```

#### 6. Complete Appointment
**PUT** `/api/appointments/:id/complete`

Marks an appointment as completed.

**Request Body:**
```json
{
  "diagnosis": "Hypertension under control",
  "prescription": "Continue Amlodipine 5mg",
  "followUpDate": "2024-02-20T10:00:00Z",
  "notes": "Patient responding well to treatment"
}
```

**Response (200):**
```json
{
  "id": "appointment_123",
  "status": "COMPLETED",
  "diagnosis": "Hypertension under control",
  "prescription": "Continue Amlodipine 5mg",
  "followUpDate": "2024-02-20T10:00:00Z",
  "notes": "Patient responding well to treatment",
  "completedAt": "2024-01-15T11:30:00Z"
}
```

#### 7. Get Doctor Schedule
**GET** `/api/appointments/doctor/:doctorId/schedule`

Retrieves a doctor's schedule for a specific date range.

**Query Parameters:**
- `startDate` (required): Start date (YYYY-MM-DD)
- `endDate` (required): End date (YYYY-MM-DD)
- `status` (optional): Filter by status

**Response (200):**
```json
{
  "doctor": {
    "id": "user_123",
    "name": "Dr. Jane Doe",
    "specialization": "Cardiology"
  },
  "schedule": [
    {
      "date": "2024-01-20",
      "appointments": [
        {
          "id": "appointment_123",
          "time": "10:00",
          "patientName": "John Smith",
          "type": "CONSULTATION",
          "status": "SCHEDULED",
          "duration": 30
        }
      ],
      "totalAppointments": 8,
      "availableSlots": 4
    }
  ]
}
```

#### 8. Get Available Slots
**GET** `/api/appointments/available-slots`

Retrieves available appointment slots for a doctor.

**Query Parameters:**
- `doctorId` (required): Doctor ID
- `date` (required): Date (YYYY-MM-DD)
- `clinicId` (optional): Clinic ID

**Response (200):**
```json
{
  "doctor": {
    "id": "user_123",
    "name": "Dr. Jane Doe"
  },
  "date": "2024-01-20",
  "availableSlots": [
    {
      "time": "09:00",
      "duration": 30,
      "available": true
    },
    {
      "time": "09:30",
      "duration": 30,
      "available": false,
      "bookedBy": "John Smith"
    }
  ],
  "workingHours": {
    "start": "09:00",
    "end": "17:00",
    "breakStart": "12:00",
    "breakEnd": "13:00"
  }
}
```

#### 9. Bulk Schedule Appointments
**POST** `/api/appointments/bulk-schedule`

Creates multiple appointments at once.

**Request Body:**
```json
{
  "appointments": [
    {
      "patientId": "patient_123",
      "doctorId": "user_123",
      "clinicId": "clinic_123",
      "date": "2024-01-20T10:00:00Z",
      "duration": 30,
      "type": "CONSULTATION"
    }
  ]
}
```

**Response (200):**
```json
{
  "message": "Appointments scheduled successfully",
  "scheduled": 5,
  "failed": 1,
  "errors": [
    {
      "index": 2,
      "error": "Time slot not available"
    }
  ]
}
```

#### 10. Get Appointment Statistics
**GET** `/api/appointments/stats`

Retrieves appointment statistics and analytics.

**Query Parameters:**
- `startDate` (optional): Start date (YYYY-MM-DD)
- `endDate` (optional): End date (YYYY-MM-DD)
- `clinicId` (optional): Filter by clinic
- `doctorId` (optional): Filter by doctor

**Response (200):**
```json
{
  "totalAppointments": 850,
  "scheduled": 45,
  "completed": 750,
  "cancelled": 35,
  "noShow": 20,
  "averageDuration": 28,
  "busiestDay": "Monday",
  "busiestTime": "10:00",
  "topDoctors": [
    {
      "id": "user_123",
      "name": "Dr. Jane Doe",
      "appointmentCount": 120
    }
  ],
  "appointmentsByType": {
    "CONSULTATION": 600,
    "FOLLOW_UP": 200,
    "PROCEDURE": 50
  }
}
```

---

## EHR (Electronic Health Records) API

### Base Path: `/api/ehr`

**Authentication Required:** All endpoints require authentication
**Add-on Required:** AI Scribe add-on for AI features
**Access Control:** Users can only access EHR records in their organization

#### 1. Create EHR Record
**POST** `/api/ehr`

Creates a new Electronic Health Record.

**Request Body:**
```json
{
  "patientId": "patient_123",
  "appointmentId": "appointment_123",
  "diagnosis": "Hypertension",
  "symptoms": "High blood pressure, headache",
  "prescription": "Amlodipine 5mg daily",
  "notes": "Patient reports improvement with current medication",
  "vitalSigns": {
    "bloodPressure": "140/90",
    "heartRate": 72,
    "temperature": 98.6,
    "weight": 75
  },
  "labResults": "Cholesterol levels normal",
  "followUpDate": "2024-02-20T10:00:00Z"
}
```

**Response (201):**
```json
{
  "id": "ehr_123",
  "patientId": "patient_123",
  "appointmentId": "appointment_123",
  "diagnosis": "Hypertension",
  "symptoms": "High blood pressure, headache",
  "prescription": "Amlodipine 5mg daily",
  "notes": "Patient reports improvement with current medication",
  "vitalSigns": {
    "bloodPressure": "140/90",
    "heartRate": 72,
    "temperature": 98.6,
    "weight": 75
  },
  "labResults": "Cholesterol levels normal",
  "followUpDate": "2024-02-20T10:00:00Z",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

#### 2. Get Patient EHR Records
**GET** `/api/ehr/patient/:patientId`

Retrieves all EHR records for a specific patient.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `startDate` (optional): Filter from date
- `endDate` (optional): Filter to date

**Response (200):**
```json
{
  "records": [
    {
      "id": "ehr_123",
      "date": "2024-01-15T10:30:00Z",
      "diagnosis": "Hypertension",
      "prescription": "Amlodipine 5mg daily",
      "doctorName": "Dr. Jane Doe",
      "clinicName": "Cardiology Clinic"
    }
  ],
  "pagination": {
    "total": 25,
    "page": 1,
    "limit": 10,
    "totalPages": 3
  }
}
```

#### 3. Get EHR Record Details
**GET** `/api/ehr/:id`

Retrieves detailed information about a specific EHR record.

**Response (200):**
```json
{
  "id": "ehr_123",
  "patientId": "patient_123",
  "appointmentId": "appointment_123",
  "diagnosis": "Hypertension",
  "symptoms": "High blood pressure, headache",
  "prescription": "Amlodipine 5mg daily",
  "notes": "Patient reports improvement with current medication",
  "vitalSigns": {
    "bloodPressure": "140/90",
    "heartRate": 72,
    "temperature": 98.6,
    "weight": 75
  },
  "labResults": "Cholesterol levels normal",
  "followUpDate": "2024-02-20T10:00:00Z",
  "patient": {
    "id": "patient_123",
    "name": "John Smith",
    "age": 45,
    "gender": "MALE"
  },
  "doctor": {
    "id": "user_123",
    "name": "Dr. Jane Doe",
    "specialization": "Cardiology"
  },
  "createdAt": "2024-01-15T10:30:00Z"
}
```

#### 4. Update EHR Record
**PUT** `/api/ehr/:id`

Updates an EHR record.

**Request Body:**
```json
{
  "diagnosis": "Hypertension - Improved",
  "prescription": "Amlodipine 5mg daily, continue monitoring",
  "notes": "Patient showing significant improvement"
}
```

**Response (200):**
```json
{
  "id": "ehr_123",
  "diagnosis": "Hypertension - Improved",
  "prescription": "Amlodipine 5mg daily, continue monitoring",
  "notes": "Patient showing significant improvement",
  "updatedAt": "2024-01-15T11:30:00Z"
}
```

#### 5. Voice to Text Conversion
**POST** `/api/ehr/voice-to-text`

Converts voice recording to text (requires AI Scribe add-on).

**Request Body:**
```json
{
  "audioFile": "base64_encoded_audio_data",
  "language": "en-US"
}
```

**Response (200):**
```json
{
  "text": "Patient reports experiencing high blood pressure and occasional headaches...",
  "confidence": 0.95,
  "processingTime": 2.3
}
```

#### 6. OCR Text Extraction
**POST** `/api/ehr/ocr-text`

Extracts text from medical documents (requires AI Scribe add-on).

**Request Body:**
```json
{
  "imageFile": "base64_encoded_image_data",
  "documentType": "prescription"
}
```

**Response (200):**
```json
{
  "extractedText": "Amlodipine 5mg, Take 1 tablet daily...",
  "confidence": 0.92,
  "processingTime": 1.8
}
```

#### 7. AI Summary Generation
**POST** `/api/ehr/ai-summary`

Generates AI-powered summary of patient consultation (requires AI Scribe add-on).

**Request Body:**
```json
{
  "consultationNotes": "Patient reports improvement with current medication...",
  "patientHistory": "Previous records show consistent hypertension...",
  "currentSymptoms": "Mild headache, blood pressure 140/90"
}
```

**Response (200):**
```json
{
  "summary": "45-year-old male patient with controlled hypertension...",
  "keyPoints": [
    "Blood pressure improved from 160/100 to 140/90",
    "Medication compliance is good",
    "Follow-up in 4 weeks recommended"
  ],
  "recommendations": [
    "Continue current medication",
    "Monitor blood pressure weekly",
    "Lifestyle modifications advised"
  ]
}
```

#### 8. Get EHR Statistics
**GET** `/api/ehr/stats`

Retrieves EHR statistics and analytics.

**Query Parameters:**
- `startDate` (optional): Start date (YYYY-MM-DD)
- `endDate` (optional): End date (YYYY-MM-DD)
- `clinicId` (optional): Filter by clinic

**Response (200):**
```json
{
  "totalRecords": 1500,
  "recordsThisMonth": 120,
  "averageRecordsPerDay": 4,
  "topDiagnoses": [
    {
      "diagnosis": "Hypertension",
      "count": 250
    }
  ],
  "aiFeaturesUsage": {
    "voiceToText": 45,
    "ocrText": 30,
    "aiSummary": 25
  }
}
```

---

## Add-ons API

### Base Path: `/api/addons`

**Authentication Required:** All endpoints require authentication
**Admin Access Required:** Most endpoints require ADMIN role

#### 1. Get Available Add-ons
**GET** `/api/addons`

Retrieves all available add-ons for subscription.

**Response (200):**
```json
{
  "addons": [
    {
      "id": "addon_123",
      "name": "AI Scribe",
      "description": "AI-powered voice-to-text and medical transcription",
      "price": 999,
      "isUsageBased": true,
      "usageUnit": "per 100 transcriptions",
      "features": [
        "Voice to text conversion",
        "OCR text extraction",
        "AI summary generation"
      ]
    },
    {
      "id": "addon_124",
      "name": "Advanced Analytics",
      "description": "Comprehensive analytics and reporting",
      "price": 1499,
      "isUsageBased": false,
      "features": [
        "Custom dashboards",
        "Advanced reporting",
        "Data export"
      ]
    }
  ]
}
```

#### 2. Get Organization Add-ons
**GET** `/api/addons/organization`

Retrieves add-ons subscribed by the organization.

**Response (200):**
```json
{
  "addons": [
    {
      "id": "org_addon_123",
      "addOn": {
        "id": "addon_123",
        "name": "AI Scribe",
        "description": "AI-powered voice-to-text and medical transcription"
      },
      "isActive": true,
      "usageCount": 150,
      "subscription": {
        "id": "sub_123",
        "status": "ACTIVE",
        "currentPeriodEnd": "2024-02-15T00:00:00Z"
      },
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

#### 3. Subscribe to Add-on
**POST** `/api/addons/subscribe`

Subscribes to an add-on with payment processing.

**Request Body:**
```json
{
  "addonId": "addon_123",
  "paymentMethod": "razorpay",
  "billingCycle": "monthly"
}
```

**Response (200):**
```json
{
  "subscriptionId": "sub_123",
  "paymentUrl": "https://pay.razorpay.com/subscription/sub_123",
  "amount": 999,
  "status": "PENDING",
  "expiresAt": "2024-02-15T00:00:00Z"
}
```

#### 4. Cancel Add-on Subscription
**PUT** `/api/addons/:addonId/cancel`

Cancels an add-on subscription.

**Request Body:**
```json
{
  "reason": "No longer needed",
  "effectiveDate": "immediate"
}
```

**Response (200):**
```json
{
  "message": "Subscription cancelled successfully",
  "effectiveDate": "2024-01-15T10:30:00Z",
  "refundAmount": 499
}
```

#### 5. Get Add-on Usage
**GET** `/api/addons/:addonId/usage`

Retrieves usage statistics for an add-on.

**Query Parameters:**
- `startDate` (optional): Start date (YYYY-MM-DD)
- `endDate` (optional): End date (YYYY-MM-DD)

**Response (200):**
```json
{
  "addon": {
    "id": "addon_123",
    "name": "AI Scribe"
  },
  "usage": {
    "currentPeriod": {
      "used": 150,
      "limit": 200,
      "remaining": 50
    },
    "history": [
      {
        "date": "2024-01-15",
        "used": 5,
        "cost": 50
      }
    ],
    "totalCost": 1500
  }
}
```

#### 6. Payment Webhook
**POST** `/api/addons/webhook`

Handles payment gateway webhooks.

**Request Body:**
```json
{
  "event": "subscription.activated",
  "subscription_id": "sub_123",
  "amount": 999,
  "currency": "INR"
}
```

**Response (200):**
```json
{
  "status": "processed"
}
```

#### 7. Get Billing History
**GET** `/api/addons/billing`

Retrieves billing history for the organization.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Response (200):**
```json
{
  "bills": [
    {
      "id": "bill_123",
      "addonName": "AI Scribe",
      "amount": 999,
      "status": "PAID",
      "billingDate": "2024-01-15T00:00:00Z",
      "dueDate": "2024-01-15T00:00:00Z"
    }
  ],
  "pagination": {
    "total": 25,
    "page": 1,
    "limit": 10,
    "totalPages": 3
  }
}
```

---

## Analytics API

### Base Path: `/api/analytics`

**Authentication Required:** All endpoints require authentication
**Access Control:** Users can only access analytics for their organization

#### 1. Dashboard Overview
**GET** `/api/analytics/dashboard`

Retrieves comprehensive dashboard overview.

**Query Parameters:**
- `period` (optional): Time period (today, week, month, year)

**Response (200):**
```json
{
  "overview": {
    "totalPatients": 1500,
    "totalAppointments": 8500,
    "totalRevenue": 250000,
    "activeDoctors": 25,
    "clinics": 5
  },
  "recentActivity": {
    "newPatients": 45,
    "appointmentsToday": 25,
    "pendingAppointments": 12,
    "completedToday": 18
  },
  "charts": {
    "appointmentsByDay": [
      {
        "date": "2024-01-15",
        "scheduled": 25,
        "completed": 20,
        "cancelled": 3
      }
    ],
    "revenueByMonth": [
      {
        "month": "January 2024",
        "revenue": 75000
      }
    ]
  }
}
```

#### 2. Appointment Analytics
**GET** `/api/analytics/appointments`

Retrieves detailed appointment analytics.

**Query Parameters:**
- `startDate` (optional): Start date (YYYY-MM-DD)
- `endDate` (optional): End date (YYYY-MM-DD)
- `clinicId` (optional): Filter by clinic
- `doctorId` (optional): Filter by doctor

**Response (200):**
```json
{
  "summary": {
    "total": 850,
    "scheduled": 45,
    "completed": 750,
    "cancelled": 35,
    "noShow": 20
  },
  "trends": {
    "dailyAverage": 28,
    "weeklyGrowth": 15.5,
    "monthlyGrowth": 8.2
  },
  "byType": {
    "CONSULTATION": 600,
    "FOLLOW_UP": 200,
    "PROCEDURE": 50
  },
  "byStatus": {
    "SCHEDULED": 45,
    "COMPLETED": 750,
    "CANCELLED": 35,
    "NO_SHOW": 20
  },
  "topDoctors": [
    {
      "id": "user_123",
      "name": "Dr. Jane Doe",
      "appointments": 120,
      "completionRate": 95.8
    }
  ]
}
```

#### 3. Patient Analytics
**GET** `/api/analytics/patients`

Retrieves patient analytics and demographics.

**Query Parameters:**
- `startDate` (optional): Start date (YYYY-MM-DD)
- `endDate` (optional): End date (YYYY-MM-DD)

**Response (200):**
```json
{
  "demographics": {
    "totalPatients": 1500,
    "byGender": {
      "MALE": 750,
      "FEMALE": 700,
      "OTHER": 50
    },
    "byAgeGroup": {
      "0-18": 150,
      "19-30": 300,
      "31-50": 600,
      "51-70": 350,
      "70+": 100
    }
  },
  "growth": {
    "newPatientsThisMonth": 45,
    "growthRate": 12.5,
    "retentionRate": 85.2
  },
  "topDiagnoses": [
    {
      "diagnosis": "Hypertension",
      "count": 250,
      "percentage": 16.7
    }
  ],
  "patientSatisfaction": {
    "averageRating": 4.5,
    "totalReviews": 850,
    "positiveReviews": 765
  }
}
```

#### 4. Revenue Analytics
**GET** `/api/analytics/revenue`

Retrieves revenue and financial analytics.

**Query Parameters:**
- `startDate` (optional): Start date (YYYY-MM-DD)
- `endDate` (optional): End date (YYYY-MM-DD)
- `clinicId` (optional): Filter by clinic

**Response (200):**
```json
{
  "summary": {
    "totalRevenue": 250000,
    "thisMonth": 75000,
    "lastMonth": 68000,
    "growth": 10.3
  },
  "bySource": {
    "appointments": 200000,
    "addons": 45000,
    "other": 5000
  },
  "byClinic": [
    {
      "clinicId": "clinic_123",
      "clinicName": "Cardiology Clinic",
      "revenue": 85000,
      "percentage": 34
    }
  ],
  "trends": {
    "dailyAverage": 8333,
    "weeklyGrowth": 5.2,
    "monthlyGrowth": 10.3
  },
  "projections": {
    "nextMonth": 82000,
    "nextQuarter": 250000
  }
}
```

#### 5. Doctor Performance
**GET** `/api/analytics/doctors`

Retrieves doctor performance analytics.

**Query Parameters:**
- `startDate` (optional): Start date (YYYY-MM-DD)
- `endDate` (optional): End date (YYYY-MM-DD)
- `clinicId` (optional): Filter by clinic

**Response (200):**
```json
{
  "doctors": [
    {
      "id": "user_123",
      "name": "Dr. Jane Doe",
      "specialization": "Cardiology",
      "appointments": 120,
      "completionRate": 95.8,
      "averageRating": 4.7,
      "revenue": 45000,
      "patientsSeen": 85
    }
  ],
  "performanceMetrics": {
    "averageAppointmentsPerDoctor": 34,
    "averageCompletionRate": 92.5,
    "averageRating": 4.3
  }
}
```

#### 6. Clinic Performance
**GET** `/api/analytics/clinics`

Retrieves clinic performance analytics.

**Query Parameters:**
- `startDate` (optional): Start date (YYYY-MM-DD)
- `endDate` (optional): End date (YYYY-MM-DD)

**Response (200):**
```json
{
  "clinics": [
    {
      "id": "clinic_123",
      "name": "Cardiology Clinic",
      "appointments": 450,
      "patients": 300,
      "revenue": 85000,
      "utilization": 85.5,
      "satisfaction": 4.6
    }
  ],
  "comparison": {
    "mostEfficient": "clinic_123",
    "highestRevenue": "clinic_123",
    "highestSatisfaction": "clinic_124"
  }
}
```

#### 7. Custom Report
**POST** `/api/analytics/reports`

Generates custom analytics reports.

**Request Body:**
```json
{
  "reportType": "appointment_analysis",
  "filters": {
    "startDate": "2024-01-01",
    "endDate": "2024-01-31",
    "clinicId": "clinic_123",
    "doctorId": "user_123"
  },
  "metrics": ["appointments", "revenue", "satisfaction"],
  "groupBy": "day"
}
```

**Response (200):**
```json
{
  "reportId": "report_123",
  "status": "completed",
  "data": {
    "summary": {
      "totalAppointments": 450,
      "totalRevenue": 85000
    },
    "details": [
      {
        "date": "2024-01-15",
        "appointments": 25,
        "revenue": 5000,
        "satisfaction": 4.5
      }
    ]
  },
  "generatedAt": "2024-01-15T10:30:00Z"
}
```

#### 8. Export Analytics
**GET** `/api/analytics/export`

Exports analytics data in various formats.

**Query Parameters:**
- `type` (required): Export type (appointments, patients, revenue)
- `format` (optional): Export format (csv, excel, pdf)
- `startDate` (optional): Start date (YYYY-MM-DD)
- `endDate` (optional): End date (YYYY-MM-DD)

**Response (200):**
```json
{
  "downloadUrl": "https://api.example.com/exports/report_123.csv",
  "expiresAt": "2024-01-16T10:30:00Z",
  "fileSize": "2.5MB"
}
```

---

## Backup API

### Base Path: `/api/backup`

**Authentication Required:** All endpoints require authentication
**Admin Access Required:** All endpoints require ADMIN role

#### 1. Get Latest Cloud Backup
**GET** `/api/backup/cloud/latest`

Retrieves the latest cloud backup information.

**Response (200):**
```json
{
  "downloadUrl": "https://cloud-storage.com/backup-2024-01-15.json",
  "expiresAt": "2024-01-16T10:30:00Z",
  "backupDate": "2024-01-15T10:30:00Z",
  "fileSize": "25.5MB",
  "status": "COMPLETED"
}
```

#### 2. Trigger Cloud Backup
**POST** `/api/backup/cloud/trigger`

Initiates a new cloud backup.

**Response (200):**
```json
{
  "message": "Cloud backup initiated successfully",
  "backupId": "backup_123",
  "estimatedTime": "5 minutes",
  "status": "IN_PROGRESS"
}
```

#### 3. Download Local Backup
**GET** `/api/backup/local`

Downloads a local backup file.

**Response (200):**
```json
{
  "backupData": {
    "organization": { /* organization data */ },
    "clinics": [ /* clinics data */ ],
    "patients": [ /* patients data */ ],
    "appointments": [ /* appointments data */ ],
    "ehrRecords": [ /* EHR data */ ]
  },
  "metadata": {
    "createdAt": "2024-01-15T10:30:00Z",
    "version": "1.0",
    "totalRecords": 2500
  }
}
```

#### 4. Restore from Backup
**POST** `/api/backup/restore`

Restores data from a backup file.

**Request Body:**
```json
{
  "backupData": {
    "organization": { /* organization data */ },
    "clinics": [ /* clinics data */ ],
    "patients": [ /* patients data */ ]
  },
  "options": {
    "overwriteExisting": false,
    "validateData": true
  }
}
```

**Response (200):**
```json
{
  "message": "Data restored successfully",
  "restoredRecords": {
    "patients": 1500,
    "appointments": 850,
    "ehrRecords": 1200
  },
  "restoreDate": "2024-01-15T10:30:00Z",
  "restorePointId": "restore_123"
}
```

#### 5. Get Backup History
**GET** `/api/backup/history`

Retrieves backup history.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `type` (optional): Filter by type (LOCAL, CLOUD)

**Response (200):**
```json
{
  "backups": [
    {
      "id": "backup_123",
      "type": "CLOUD",
      "createdAt": "2024-01-15T10:30:00Z",
      "fileUrl": "https://cloud-storage.com/backup-2024-01-15.json",
      "fileSize": "25.5MB",
      "status": "COMPLETED",
      "createdBy": "user_123"
    }
  ],
  "pagination": {
    "total": 25,
    "page": 1,
    "limit": 10,
    "totalPages": 3
  }
}
```

---

## Frontend Integration Guide

### React/Vite/Tailwind CSS Implementation

#### 1. API Client Setup
```javascript
// api/client.js
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for authentication
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

#### 2. Authentication Hook
```javascript
// hooks/useAuth.js
import { useState, useEffect } from 'react';
import apiClient from '../api/client';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      // Verify token and get user info
      apiClient.get('/auth/me')
        .then(response => setUser(response.data))
        .catch(() => localStorage.removeItem('authToken'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (credentials) => {
    const response = await apiClient.post('/auth/login', credentials);
    const { token, user } = response.data;
    localStorage.setItem('authToken', token);
    setUser(user);
    return user;
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    setUser(null);
  };

  return { user, loading, login, logout };
};
```

#### 3. API Service Functions
```javascript
// services/patients.js
import apiClient from '../api/client';

export const patientsService = {
  // Get all patients
  getPatients: (params) => apiClient.get('/patients', { params }),
  
  // Get patient by ID
  getPatient: (id) => apiClient.get(`/patients/${id}`),
  
  // Create patient
  createPatient: (data) => apiClient.post('/patients', data),
  
  // Update patient
  updatePatient: (id, data) => apiClient.put(`/patients/${id}`, data),
  
  // Delete patient
  deletePatient: (id) => apiClient.delete(`/patients/${id}`),
  
  // Search patients
  searchPatients: (query) => apiClient.get('/patients/search', { params: query }),
};
```

#### 4. React Component Example
```jsx
// components/PatientList.jsx
import { useState, useEffect } from 'react';
import { patientsService } from '../services/patients';

export const PatientList = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    try {
      setLoading(true);
      const response = await patientsService.getPatients();
      setPatients(response.data.patients);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center p-8">Loading...</div>;
  if (error) return <div className="text-red-500 p-4">{error}</div>;

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Patients</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {patients.map(patient => (
          <div key={patient.id} className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold">{patient.name}</h3>
            <p className="text-gray-600">{patient.age} years • {patient.gender}</p>
            <p className="text-gray-600">{patient.phone}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
```

### Environment Variables
```env
# .env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_APP_NAME=CogniCare
```

### Error Handling
```javascript
// utils/errorHandler.js
export const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error
    const { status, data } = error.response;
    
    switch (status) {
      case 400:
        return `Validation Error: ${data.error}`;
      case 401:
        return 'Authentication required. Please login.';
      case 403:
        return 'Access denied. Insufficient permissions.';
      case 404:
        return 'Resource not found.';
      case 429:
        return 'Too many requests. Please try again later.';
      default:
        return data.error || 'An unexpected error occurred.';
    }
  } else if (error.request) {
    // Network error
    return 'Network error. Please check your connection.';
  } else {
    // Other error
    return 'An unexpected error occurred.';
  }
};
```

---

## Conclusion

This comprehensive API documentation provides everything needed to integrate the CogniCare backend with your React/Vite/Tailwind CSS frontend application. The API follows RESTful principles with proper authentication, error handling, and comprehensive data management capabilities.

### Key Features Covered:
- ✅ **Complete Authentication System** with JWT tokens
- ✅ **Organization & Clinic Management** with role-based access
- ✅ **Patient Management** with advanced search and bulk operations
- ✅ **Appointment Scheduling** with availability checking and statistics
- ✅ **Electronic Health Records** with AI-powered features
- ✅ **Add-on Subscriptions** with payment integration
- ✅ **Comprehensive Analytics** and reporting
- ✅ **Data Backup & Restore** functionality

### Next Steps for Frontend Development:
1. Set up the API client with authentication
2. Implement the authentication flow
3. Create reusable components for common operations
4. Build responsive UI with Tailwind CSS
5. Implement error handling and loading states
6. Add real-time updates where needed
7. Test all endpoints thoroughly

The API is production-ready and includes all necessary security measures, validation, and comprehensive error handling for a robust healthcare management system.
