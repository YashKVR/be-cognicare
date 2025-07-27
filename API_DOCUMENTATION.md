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
