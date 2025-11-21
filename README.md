# Appointment Booking WebApp

A modern appointment booking system built with React, TypeScript, Tailwind CSS, and Shadcn UI.

## Features

### Authentication
- **Login Page**: Phone number and password-based authentication
- **Signup Page**: Complete registration with user type selection (Customer/Provider)

### Customer Features
- **Cascading Appointment Booking System**:
  1. Select provider type (Doctor, Dentist, Salon, etc.)
  2. Choose specific provider from selected type
  3. View and select available dates
  4. Pick from available time slots
  5. Book appointment with one click

### Provider Features
- **Provider Dashboard**: View and manage appointments
- Statistics overview (Total appointments, Today's appointments, Total customers)
- Upcoming appointments list

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn UI
- **Icons**: Lucide React
- **Routing**: React Router v6
- **Form Handling**: React Hook Form
- **State Management**: Context API
- **Notifications**: Sonner (Toast notifications)

## Getting Started

### Prerequisites

- Node.js 16+ and npm
- Backend API server running (default: http://localhost:3000/api)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
Edit `.env` file and set your backend API URL:
```
VITE_API_BASE_URL=http://localhost:3000/api
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to:
```
http://localhost:5173
```

## Project Structure

```
src/
├── components/
│   └── ui/              # Shadcn UI components
├── contexts/
│   └── AuthContext.tsx  # Authentication context
├── pages/
│   ├── Login.tsx        # Login page
│   ├── Signup.tsx       # Signup page
│   ├── Customer.tsx     # Customer dashboard with booking system
│   └── Provider.tsx     # Provider dashboard
├── services/
│   └── api.ts           # API service layer
├── lib/
│   └── utils.ts         # Utility functions
├── App.tsx              # Main app component with routing
└── main.tsx             # Entry point
```

## API Endpoints Expected

The frontend expects the following API endpoints:

### Authentication
- `POST /api/auth/login` - User login
  ```json
  {
    "phone": "+1234567890",
    "password": "password123"
  }
  ```
- `POST /api/auth/register` - User registration
  ```json
  {
    "phone": "+1234567890",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "userType": "customer"
  }
  ```

### Provider Profile
- `POST /api/providers` - Create/update provider profile (Requires Bearer token)
  ```json
  {
    "providerType": "doctor",
    "businessName": "Health & Wellness Clinic",
    "specialization": "Cardiology",
    "licenseNumber": "MD12345",
    "bio": "Board-certified cardiologist",
    "slotDurationMinutes": 30,
    "bookingLimitDays": 60
  }
  ```

### Providers
- `GET /api/providers?type={type}&isActive=true` - Get providers by type

### Schedule Configuration
- `POST /api/providers/schedule` - Create schedule config (Requires Bearer token)
  ```json
  {
    "providerId": "{{providerId}}",
    "dayOfWeek": 1,
    "startTime": "09:00",
    "endTime": "17:00"
  }
  ```

### Availability
- `POST /api/providers/slots/available-dates` - Get available dates
  ```json
  {
    "providerId": "{{providerId}}",
    "days": 30
  }
  ```
- `POST /api/providers/slots/available` - Get available time slots
  ```json
  {
    "providerId": "{{providerId}}",
    "date": "2025-11-24"
  }
  ```

### Appointments
- `POST /api/appointments/book` - Book appointment (Requires Bearer token)
  ```json
  {
    "providerId": "{{providerId}}",
    "appointmentDate": "2025-11-24",
    "startTime": "10:30",
    "serviceDescription": "Annual checkup"
  }
  ```

## Usage

### For Customers

1. **Sign Up/Login**: Create an account or login with phone number and password
2. **Select Provider Type**: Choose the type of service you need
3. **Choose Provider**: Select from available providers
4. **Pick Date**: View and select from available dates
5. **Select Time**: Choose your preferred time slot
6. **Book**: Confirm your appointment

### For Providers

1. **Sign Up/Login**: Create a provider account
2. **View Dashboard**: See your appointment statistics
3. **Manage Appointments**: View and manage upcoming appointments

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API base URL | `http://localhost:3000/api` |

## Design Features

- **Responsive Design**: Works on all device sizes
- **Dark Mode Support**: Built-in dark mode compatibility
- **Modern UI**: Clean and intuitive interface with Shadcn UI
- **Loading States**: Proper loading indicators for better UX
- **Error Handling**: Comprehensive error handling with toast notifications
- **Form Validation**: Client-side validation for all forms

## Security

- JWT token-based authentication
- Token stored in localStorage
- Protected routes based on user type
- Automatic logout functionality

## Contributing

This project uses ESLint for code quality. Please ensure your code passes linting before submitting:

```bash
npm run lint
```

## License

MIT

## Support

For issues and questions, please contact the development team.

