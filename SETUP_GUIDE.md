# Appointment Booking WebApp - Setup Guide

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Create or update the `.env` file in the project root:
```env
VITE_API_BASE_URL=http://localhost:3000/api
```

Replace `http://localhost:3000/api` with your actual backend API URL.

### 3. Start Development Server
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Project Overview

This is a complete appointment booking system with separate interfaces for customers and providers.

### Technologies Used
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Shadcn UI** for component library
- **Lucide React** for icons
- **React Router** for navigation
- **Sonner** for toast notifications

## Features

### Authentication System

#### Login Page (`/login`)
- Phone number and password authentication
- Redirects to appropriate dashboard based on user type
- Remembers logged-in users
- Clean, modern UI with form validation

#### Signup Page (`/signup`)
- Complete registration form with:
  - Phone number (required)
  - First name and last name (required)
  - Email (optional)
  - Password (required)
  - User type selection: Customer or Provider
- Automatic login after successful registration
- Providers are redirected to complete their profile

### Customer Features

#### Customer Dashboard (`/customer`)
A comprehensive appointment booking system with a cascading dropdown flow:

**Step 1: Select Provider Type**
- Choose from predefined provider types:
  - Doctor
  - Dentist
  - Salon
  - Spa
  - Therapist
  - Consultant
  - Trainer
  - Other

**Step 2: Select Provider**
- View all active providers of the selected type
- Display shows business name, provider name, and specialization
- Only shows providers who have completed their profile

**Step 3: Select Date**
- View available dates for the next 30 days
- Shows number of available slots for each date
- Only dates with available appointments are shown

**Step 4: Select Time Slot**
- View all available time slots for the selected date
- Time slots are based on provider's schedule configuration
- Shows start and end time for each slot

**Step 5: Service Description (Optional)**
- Add notes about the appointment
- Describe the reason for the visit

**Step 6: Book Appointment**
- One-click booking
- Success/error notifications
- Form resets after successful booking

### Provider Features

#### Provider Setup (`/provider/setup`)
After registration, providers must complete their profile:

- **Provider Type**: Select your service category
- **Business Name**: Your business or practice name (required)
- **Specialization**: Your area of expertise (optional)
- **License Number**: Professional license if applicable (optional)
- **Bio**: Description of your experience and services (optional)
- **Slot Duration**: Length of each appointment (default: 30 minutes)
- **Booking Limit**: How far in advance customers can book (default: 60 days)

#### Provider Dashboard (`/provider`)
- View upcoming appointments
- See statistics:
  - Total appointments
  - Today's appointments
  - Total customers
- Manage availability and schedule

## File Structure

```
src/
├── components/
│   └── ui/                    # Shadcn UI components (button, card, input, etc.)
├── contexts/
│   └── AuthContext.tsx        # Authentication state management
├── pages/
│   ├── Login.tsx             # Login page
│   ├── Signup.tsx            # Registration page
│   ├── Customer.tsx          # Customer booking dashboard
│   ├── Provider.tsx          # Provider dashboard
│   └── ProviderSetup.tsx     # Provider profile setup
├── services/
│   └── api.ts                # API service layer with all endpoints
├── lib/
│   └── utils.ts              # Utility functions (cn helper)
├── App.tsx                   # Main app with routing
├── main.tsx                  # Entry point
└── index.css                 # Global styles
```

## API Integration

### Authentication
All authenticated requests include the Bearer token in the Authorization header:
```
Authorization: Bearer {accessToken}
```

The token is stored in `localStorage` as `accessToken`.

### API Endpoints

The app communicates with the following endpoints:

1. **POST /api/auth/login** - User login
2. **POST /api/auth/register** - User registration
3. **POST /api/providers** - Create provider profile (authenticated)
4. **GET /api/providers?type={type}&isActive=true** - Get providers by type
5. **POST /api/providers/schedule** - Configure provider schedule (authenticated)
6. **POST /api/providers/slots/available-dates** - Get available dates
7. **POST /api/providers/slots/available** - Get available time slots
8. **POST /api/appointments/book** - Book appointment (authenticated)

See the main README.md for detailed request/response examples.

## User Flow

### For Customers

1. **Sign Up** → Enter phone, name, password, select "Customer"
2. **Login** → Redirected to customer dashboard
3. **Book Appointment**:
   - Select provider type (e.g., Doctor)
   - Choose specific provider
   - Pick available date
   - Select time slot
   - Add service description
   - Confirm booking
4. **Receive Confirmation** → Toast notification with success/error

### For Providers

1. **Sign Up** → Enter phone, name, password, select "Provider"
2. **Complete Profile** → Redirected to setup page
   - Fill in business details
   - Set slot duration and booking limits
3. **Setup Schedule** → Configure working hours (via API)
4. **Dashboard** → View appointments and statistics
5. **Manage Bookings** → Accept/cancel appointments

## Development Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint

# Type checking
npm run typecheck
```

## Styling

The app uses Tailwind CSS with custom CSS variables for theming. The design includes:

- **Light/Dark Mode Support** via Shadcn UI
- **Responsive Design** - works on all screen sizes
- **Gradient Backgrounds** - different colors for customer/provider pages
- **Modern Card Layouts** - clean, spacious design
- **Smooth Transitions** - for better UX
- **Loading States** - spinners for async operations
- **Form Validation** - client-side validation with error messages

## Security Features

- JWT token authentication
- Protected routes (redirect to login if not authenticated)
- User type verification (customers can't access provider pages)
- Secure token storage in localStorage
- Automatic logout functionality
- HTTPS recommended for production

## Customization

### Change Provider Types
Edit the `PROVIDER_TYPES` array in:
- `src/pages/Customer.tsx`
- `src/pages/ProviderSetup.tsx`

### Change API Base URL
Update the `.env` file:
```env
VITE_API_BASE_URL=https://your-api-domain.com/api
```

### Modify Slot Duration Options
Edit the `slotDurationMinutes` input in `src/pages/ProviderSetup.tsx`

### Customize Booking Limit
Edit the `bookingLimitDays` input in `src/pages/ProviderSetup.tsx`

## Troubleshooting

### CORS Issues
Ensure your backend API has CORS configured to accept requests from your frontend domain.

### Token Expiration
The app doesn't currently handle token refresh. Implement token refresh logic in `src/services/api.ts` if needed.

### Provider Not Showing
Providers must:
1. Complete their profile setup
2. Have `isActive: true` status
3. Have configured their schedule

### No Available Dates
Providers need to create schedule configurations via the `/api/providers/schedule` endpoint.

### Booking Fails
Ensure:
1. User is authenticated (token is valid)
2. Selected time slot is still available
3. Provider is active

## Production Deployment

1. **Build the app**:
   ```bash
   npm run build
   ```

2. **Set environment variables** on your hosting platform

3. **Deploy the `dist` folder** to your hosting service (Vercel, Netlify, etc.)

4. **Ensure backend API is accessible** from the deployed frontend

## Support

For issues or questions:
1. Check the console for error messages
2. Verify API endpoint responses
3. Review the browser's Network tab
4. Check localStorage for token presence

## License

MIT

