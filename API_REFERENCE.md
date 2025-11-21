# API Reference

This document describes all the API endpoints used by the frontend application.

## Base URL

Set in `.env` file:
```
VITE_API_BASE_URL=http://localhost:3000/api
```

## Authentication

Most endpoints require authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer {accessToken}
```

The token is received after successful login/registration and stored in `localStorage` as `accessToken`.

---

## Endpoints

### 1. User Login

**Endpoint:** `POST /api/auth/login`

**Authentication:** Not required

**Request Body:**
```json
{
  "phone": "+1234567890",
  "password": "password123"
}
```

**Response:**
```json
{
  "user": {
    "id": "user-id",
    "phone": "+1234567890",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "userType": "customer"
  },
  "accessToken": "jwt-token-here"
}
```

---

### 2. User Registration

**Endpoint:** `POST /api/auth/register`

**Authentication:** Not required

**Request Body:**
```json
{
  "phone": "+1234567890",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "userType": "provider"
}
```

**Field Details:**
- `phone` (required): User's phone number with country code
- `password` (required): User's password
- `firstName` (required): User's first name
- `lastName` (required): User's last name
- `email` (optional): User's email address
- `userType` (required): Either "customer" or "provider"

**Response:**
```json
{
  "user": {
    "id": "user-id",
    "phone": "+1234567890",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "userType": "provider"
  },
  "accessToken": "jwt-token-here"
}
```

---

### 3. Create Provider Profile

**Endpoint:** `POST /api/providers`

**Authentication:** Required (Bearer token)

**Request Body:**
```json
{
  "providerType": "doctor",
  "businessName": "Health & Wellness Clinic",
  "specialization": "Cardiology",
  "licenseNumber": "MD12345",
  "bio": "Board-certified cardiologist with 10 years of experience",
  "slotDurationMinutes": 30,
  "bookingLimitDays": 60
}
```

**Field Details:**
- `providerType` (required): Type of service (doctor, dentist, salon, spa, therapist, consultant, trainer, other)
- `businessName` (required): Name of the business or practice
- `specialization` (optional): Area of expertise
- `licenseNumber` (optional): Professional license number
- `bio` (optional): Description of services and experience
- `slotDurationMinutes` (optional): Duration of each appointment slot (default: 30)
- `bookingLimitDays` (optional): How far ahead customers can book (default: 60)

**Response:**
```json
{
  "id": "provider-id",
  "userId": "user-id",
  "providerType": "doctor",
  "businessName": "Health & Wellness Clinic",
  "specialization": "Cardiology",
  "licenseNumber": "MD12345",
  "bio": "Board-certified cardiologist with 10 years of experience",
  "slotDurationMinutes": 30,
  "bookingLimitDays": 60,
  "isActive": true
}
```

---

### 4. Get Providers by Type

**Endpoint:** `GET /api/providers?type={providerType}&isActive=true`

**Authentication:** Not required

**Query Parameters:**
- `type`: Provider type (doctor, dentist, salon, etc.)
- `isActive`: Filter for active providers (usually "true")

**Example:** `GET /api/providers?type=doctor&isActive=true`

**Response:**
```json
[
  {
    "id": "provider-id-1",
    "userId": "user-id-1",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+1234567890",
    "providerType": "doctor",
    "businessName": "Health & Wellness Clinic",
    "specialization": "Cardiology",
    "licenseNumber": "MD12345",
    "bio": "Board-certified cardiologist",
    "slotDurationMinutes": 30,
    "bookingLimitDays": 60,
    "isActive": true
  },
  {
    "id": "provider-id-2",
    "userId": "user-id-2",
    "firstName": "Jane",
    "lastName": "Smith",
    "phone": "+1234567891",
    "providerType": "doctor",
    "businessName": "City Medical Center",
    "specialization": "General Practice",
    "slotDurationMinutes": 30,
    "bookingLimitDays": 60,
    "isActive": true
  }
]
```

---

### 5. Create Schedule Configuration

**Endpoint:** `POST /api/providers/schedule`

**Authentication:** Required (Bearer token)

**Request Body:**
```json
{
  "providerId": "provider-id",
  "dayOfWeek": 1,
  "startTime": "09:00",
  "endTime": "17:00"
}
```

**Field Details:**
- `providerId` (required): ID of the provider
- `dayOfWeek` (required): Day of week (0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday)
- `startTime` (required): Start time in HH:mm format (24-hour)
- `endTime` (required): End time in HH:mm format (24-hour)

**Note:** This endpoint should be called multiple times to set up the provider's weekly schedule.

**Response:**
```json
{
  "success": true
}
```

---

### 6. Get Available Dates

**Endpoint:** `POST /api/providers/slots/available-dates`

**Authentication:** Not required

**Request Body:**
```json
{
  "providerId": "provider-id",
  "days": 30
}
```

**Field Details:**
- `providerId` (required): ID of the provider
- `days` (required): Number of days to look ahead

**Response:**
```json
[
  {
    "date": "2025-11-24",
    "availableSlots": 12
  },
  {
    "date": "2025-11-25",
    "availableSlots": 8
  },
  {
    "date": "2025-11-26",
    "availableSlots": 15
  }
]
```

---

### 7. Get Available Time Slots

**Endpoint:** `POST /api/providers/slots/available`

**Authentication:** Not required

**Request Body:**
```json
{
  "providerId": "provider-id",
  "date": "2025-11-24"
}
```

**Field Details:**
- `providerId` (required): ID of the provider
- `date` (required): Date in YYYY-MM-DD format

**Response:**
```json
[
  {
    "startTime": "09:00",
    "endTime": "09:30",
    "isAvailable": true
  },
  {
    "startTime": "09:30",
    "endTime": "10:00",
    "isAvailable": true
  },
  {
    "startTime": "10:00",
    "endTime": "10:30",
    "isAvailable": false
  },
  {
    "startTime": "10:30",
    "endTime": "11:00",
    "isAvailable": true
  }
]
```

---

### 8. Book Appointment

**Endpoint:** `POST /api/appointments/book`

**Authentication:** Required (Bearer token)

**Request Body:**
```json
{
  "providerId": "provider-id",
  "appointmentDate": "2025-11-24",
  "startTime": "10:30",
  "serviceDescription": "Annual checkup"
}
```

**Field Details:**
- `providerId` (required): ID of the provider
- `appointmentDate` (required): Date in YYYY-MM-DD format
- `startTime` (required): Start time in HH:mm format
- `serviceDescription` (optional): Description of the service/reason for appointment

**Response:**
```json
{
  "id": "appointment-id",
  "customerId": "customer-id",
  "providerId": "provider-id",
  "appointmentDate": "2025-11-24",
  "startTime": "10:30",
  "endTime": "11:00",
  "serviceDescription": "Annual checkup",
  "status": "confirmed",
  "createdAt": "2025-11-20T10:00:00Z"
}
```

---

## Error Handling

All endpoints return appropriate HTTP status codes:

- `200 OK` - Successful request
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Missing or invalid authentication token
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource conflict (e.g., time slot already booked)
- `500 Internal Server Error` - Server error

**Error Response Format:**
```json
{
  "message": "Error description",
  "error": "Error details (in development mode)"
}
```

---

## Frontend Implementation

### API Service Location
`src/services/api.ts`

### Token Management
- Token stored in: `localStorage.getItem('accessToken')`
- Token set after login/registration
- Token sent with all authenticated requests
- Token cleared on logout

### Usage Example

```typescript
import { apiService } from '../services/api';

// Login
const response = await apiService.login({
  phone: '+1234567890',
  password: 'password123'
});

// Store token
apiService.setToken(response.accessToken);

// Book appointment (authenticated)
await apiService.bookAppointment({
  providerId: 'provider-id',
  appointmentDate: '2025-11-24',
  startTime: '10:30',
  serviceDescription: 'Annual checkup'
});
```

---

## Testing with cURL

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+1234567890",
    "password": "password123"
  }'
```

### Book Appointment
```bash
curl -X POST http://localhost:3000/api/appointments/book \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "providerId": "provider-id",
    "appointmentDate": "2025-11-24",
    "startTime": "10:30",
    "serviceDescription": "Annual checkup"
  }'
```

---

## Notes

1. **Date Format:** Always use YYYY-MM-DD format
2. **Time Format:** Always use HH:mm format (24-hour)
3. **Phone Numbers:** Include country code (e.g., +1234567890)
4. **Provider Types:** Must match one of the predefined types in the frontend
5. **Token Expiration:** Implement token refresh if needed
6. **CORS:** Ensure backend allows requests from frontend domain

