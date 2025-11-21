// API service for backend communication
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

export interface LoginRequest {
  phone: string;
  password: string;
}

export interface RegisterRequest {
  phone: string;
  firstName: string;
  lastName: string;
  password: string;
  email?: string;
  userType: 'customer' | 'provider';
}

export interface User {
  id: string;
  phone: string;
  firstName: string;
  lastName: string;
  email?: string;
  userType: 'customer' | 'provider';
}

export interface ProviderProfileRequest {
  providerType: string;
  specialization?: string;
  bookingLimitDays?: number;
}

export interface Provider {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  phone: string;
  providerType: string;
  businessName: string;
  specialization?: string;
  licenseNumber?: string;
  bio?: string;
  slotDurationMinutes: number;
  bookingLimitDays: number;
  isActive: boolean;
}

export interface ScheduleConfigRequest {
  dayOfWeek: number; // 0=Sunday, 1=Monday, etc.
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  slotMetric: number; // Minutes per slot (if isCount=false) or max bookings (if isCount=true)
  isCount: boolean; // false=time-divided, true=count-based
}

export interface ScheduleConfig {
  id: string;
  providerId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotMetric: number;
  isCount: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AvailableDatesRequest {
  providerId: string;
  days: number;
}

export interface AvailableDate {
  date: string;
  dayOfWeek: number;
  dayName: string;
  isAvailable: boolean;
  reason?: string;
}

export interface AvailableSlotsRequest {
  providerId: string;
  date: string; // YYYY-MM-DD format
}

export interface TimeSlot {
  startTime: string; // ISO timestamp string
  endTime: string; // ISO timestamp string
  isAvailable: boolean;
  capacity?: number; // Total capacity for this slot
  bookedCount?: number; // Number of bookings already made
  remainingSlots?: number; // Available spots remaining
}

export interface BookAppointmentRequest {
  providerId: string;
  appointmentDate: string; // YYYY-MM-DD format
  startTime: string; // HH:mm format
  serviceDescription?: string;
}

export interface Appointment {
  id: string;
  customerId: string;
  providerId: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  serviceDescription?: string;
  notes?: string;
  status: string;
  cancellationReason?: string;
  cancelledBy?: string;
  cancelledAt?: string;
  createdAt: string;
  updatedAt: string;
  provider?: {
    id: string;
    userId: string;
    providerType: string;
    businessName: string;
    specialization?: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      phone: string;
      email?: string;
    };
  };
  customer?: {
    id: string;
    userId: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      phone: string;
      email?: string;
    };
  };
}

class ApiService {
  private getToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  setToken(token: string) {
    localStorage.setItem('accessToken', token);
  }

  clearToken() {
    localStorage.removeItem('accessToken');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'An error occurred' }));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }

    const json = await response.json();
    
    // Handle wrapped response format: { success, data, message }
    if (json.success !== undefined && json.data !== undefined) {
      return json.data as T;
    }
    
    return json as T;
  }

  // Auth endpoints
  async login(data: LoginRequest): Promise<{ user: User; accessToken: string }> {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async register(data: RegisterRequest): Promise<{ user: User; accessToken: string }> {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Provider profile
  async createProviderProfile(data: ProviderProfileRequest): Promise<Provider> {
    return this.request('/providers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Get current provider profile
  async getProviderProfile(): Promise<Provider | null> {
    try {
      return await this.request('/providers/me');
    } catch (error) {
      return null;
    }
  }

  // Get providers by type
  async getProvidersByType(providerType: string): Promise<Provider[]> {
    return this.request(`/providers?type=${providerType}&isActive=true`);
  }

  // Schedule configuration
  async createScheduleConfig(data: ScheduleConfigRequest): Promise<ScheduleConfig> {
    return this.request('/providers/schedule', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Get provider schedules
  async getProviderSchedules(): Promise<ScheduleConfig[]> {
    return this.request('/providers/schedule');
  }

  // Delete schedule config
  async deleteScheduleConfig(scheduleId: string): Promise<void> {
    return this.request(`/providers/schedule/${scheduleId}`, {
      method: 'DELETE',
    });
  }

  // Available dates
  async getAvailableDates(data: AvailableDatesRequest): Promise<AvailableDate[]> {
    const response = await this.request<{ dates: AvailableDate[] }>('/providers/slots/available-dates', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    // Extract dates array from response
    return response.dates || [];
  }

  // Available time slots
  async getAvailableSlots(data: AvailableSlotsRequest): Promise<TimeSlot[]> {
    const response = await this.request<{ slots: TimeSlot[] }>('/providers/slots/available', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    // Extract slots array from response
    return response.slots || [];
  }

  // Book appointment
  async bookAppointment(data: BookAppointmentRequest): Promise<Appointment> {
    return this.request('/appointments/book', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Get provider appointments
  async getProviderAppointments(): Promise<Appointment[]> {
    const response = await this.request<Appointment[] | { success: boolean; data: Appointment[] }>('/appointments/list', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    
    // Handle both wrapped and unwrapped responses
    if (Array.isArray(response)) {
      return response;
    }
    
    // If wrapped in { success, data }
    if (response && typeof response === 'object' && 'data' in response && Array.isArray(response.data)) {
      return response.data;
    }
    
    // Fallback to empty array
    console.error('Unexpected appointments response format:', response);
    return [];
  }
}

export const apiService = new ApiService();

