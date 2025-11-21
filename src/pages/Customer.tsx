import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiService, Provider, AvailableDate, TimeSlot } from '../services/api';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { toast } from 'sonner';
import { Loader2, Calendar, Clock, LogOut, CheckCircle2 } from 'lucide-react';

const PROVIDER_TYPES = [
  { value: 'doctor', label: 'Doctor' },
  { value: 'dentist', label: 'Dentist' },
  { value: 'salon', label: 'Salon' },
  { value: 'spa', label: 'Spa' },
  { value: 'therapist', label: 'Therapist' },
  { value: 'consultant', label: 'Consultant' },
  { value: 'trainer', label: 'Trainer' },
  { value: 'other', label: 'Other' },
];

export default function Customer() {
  const { user, logout, isLoading } = useAuth();
  const navigate = useNavigate();
  
  const [providers, setProviders] = useState<Provider[]>([]);
  const [availableDates, setAvailableDates] = useState<AvailableDate[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  
  const [selectedProviderType, setSelectedProviderType] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [serviceDescription, setServiceDescription] = useState('');
  
  const [isLoadingProviders, setIsLoadingProviders] = useState(false);
  const [isLoadingDates, setIsLoadingDates] = useState(false);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isBooking, setIsBooking] = useState(false);

  useEffect(() => {
    // Wait for auth to finish loading before checking user
    if (!isLoading && !user) {
      navigate('/login');
      return;
    }
  }, [user, isLoading, navigate]);

  const loadProviders = async (providerType: string) => {
    setIsLoadingProviders(true);
    setProviders([]);
    setSelectedProvider('');
    setAvailableDates([]);
    setSelectedDate('');
    setTimeSlots([]);
    setSelectedTimeSlot('');
    
    try {
      const providerList = await apiService.getProvidersByType(providerType);
      setProviders(providerList);
    } catch (error) {
      toast.error('Failed to load providers');
    } finally {
      setIsLoadingProviders(false);
    }
  };

  const loadAvailableDates = async (providerId: string) => {
    setIsLoadingDates(true);
    setAvailableDates([]);
    setSelectedDate('');
    setTimeSlots([]);
    setSelectedTimeSlot('');
    
    try {
      const dates = await apiService.getAvailableDates({ 
        providerId, 
        days: 30 
      });
      // Filter only available dates
      const availableDates = dates.filter(d => d.isAvailable);
      setAvailableDates(availableDates);
      
      if (availableDates.length === 0) {
        toast.info('No available dates found for this provider');
      }
    } catch (error) {
      toast.error('Failed to load available dates');
      console.error('Error loading dates:', error);
    } finally {
      setIsLoadingDates(false);
    }
  };

  const loadTimeSlots = async (providerId: string, date: string) => {
    setIsLoadingSlots(true);
    setTimeSlots([]);
    setSelectedTimeSlot('');
    
    try {
      const slots = await apiService.getAvailableSlots({ 
        providerId, 
        date 
      });
      setTimeSlots(slots);
      
      if (slots.filter(s => s.isAvailable).length === 0) {
        toast.info('No available time slots for this date');
      }
    } catch (error) {
      toast.error('Failed to load time slots');
      console.error('Error loading slots:', error);
    } finally {
      setIsLoadingSlots(false);
    }
  };

  const handleProviderTypeChange = (value: string) => {
    setSelectedProviderType(value);
    loadProviders(value);
  };

  const handleProviderChange = (value: string) => {
    setSelectedProvider(value);
    loadAvailableDates(value);
  };

  const handleDateChange = (value: string) => {
    setSelectedDate(value);
    loadTimeSlots(selectedProvider, value);
  };

  const handleTimeSlotChange = (value: string) => {
    setSelectedTimeSlot(value);
  };

  const handleBookAppointment = async () => {
    if (!selectedProvider || !selectedDate || !selectedTimeSlot) {
      toast.error('Please complete all selections');
      return;
    }

    setIsBooking(true);
    try {
      // Convert ISO timestamp to HH:mm format
      const startTime = formatTimeTo24Hour(selectedTimeSlot);
      
      await apiService.bookAppointment({
        providerId: selectedProvider,
        appointmentDate: selectedDate,
        startTime: startTime,
        serviceDescription: serviceDescription || undefined,
      });
      
      // Show detailed success message
      const selectedSlot = timeSlots.find(s => s.startTime === selectedTimeSlot);
      const timeDisplay = selectedSlot 
        ? `${formatTime(selectedSlot.startTime)} - ${formatTime(selectedSlot.endTime)}`
        : formatTime(selectedTimeSlot);
      
      toast.success(
        `Appointment booked successfully! ${formatDate(selectedDate)} at ${timeDisplay}`,
        { duration: 5000 }
      );
      
      // Reset form
      setSelectedProviderType('');
      setSelectedProvider('');
      setSelectedDate('');
      setSelectedTimeSlot('');
      setServiceDescription('');
      setProviders([]);
      setAvailableDates([]);
      setTimeSlots([]);
    } catch (error) {
      // Handle specific error for slot already booked
      const errorMessage = error instanceof Error ? error.message : 'Failed to book appointment';
      
      if (errorMessage.includes('Unique constraint') || errorMessage.includes('already booked')) {
        toast.error('This time slot is no longer available. Please select another slot.');
        // Reload time slots to show updated availability
        if (selectedProvider && selectedDate) {
          loadTimeSlots(selectedProvider, selectedDate);
        }
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsBooking(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatTimeTo24Hour = (isoString: string) => {
    const date = new Date(isoString);
    return date.toTimeString().slice(0, 5); // HH:mm format
  };

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto p-4 max-w-4xl">
        <div className="flex justify-between items-center mb-6 pt-6">
          <div>
            <h1 className="text-3xl font-bold">Welcome, {user?.firstName}!</h1>
            <p className="text-muted-foreground">Book your appointment easily</p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Book an Appointment
            </CardTitle>
            <CardDescription>
              Select a provider type, choose your preferred provider, date, and time
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1: Select Provider Type */}
            <div className="space-y-2">
              <Label htmlFor="providerType" className="text-base font-semibold">
                1. Select Provider Type
              </Label>
              <Select
                value={selectedProviderType}
                onValueChange={handleProviderTypeChange}
              >
                <SelectTrigger id="providerType" className="w-full">
                  <SelectValue placeholder="Choose a provider type" />
                </SelectTrigger>
                <SelectContent>
                  {PROVIDER_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Step 2: Select Provider */}
            {selectedProviderType && (
              <div className="space-y-2">
                <Label htmlFor="provider" className="text-base font-semibold">
                  2. Select Provider
                </Label>
                <Select
                  value={selectedProvider}
                  onValueChange={handleProviderChange}
                  disabled={isLoadingProviders || providers.length === 0}
                >
                  <SelectTrigger id="provider" className="w-full">
                    <SelectValue placeholder={
                      isLoadingProviders 
                        ? "Loading providers..." 
                        : providers.length === 0 
                        ? "No providers available" 
                        : "Choose a provider"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {providers.map((provider) => (
                      <SelectItem key={provider.id} value={provider.id}>
                        {provider.businessName} - {provider.firstName} {provider.lastName}
                        {provider.specialization && ` (${provider.specialization})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Step 3: Select Date */}
            {selectedProvider && (
              <div className="space-y-2">
                <Label htmlFor="date" className="text-base font-semibold">
                  3. Select Date
                </Label>
                <Select
                  value={selectedDate}
                  onValueChange={handleDateChange}
                  disabled={isLoadingDates || availableDates.length === 0}
                >
                  <SelectTrigger id="date" className="w-full">
                    <SelectValue placeholder={
                      isLoadingDates 
                        ? "Loading dates..." 
                        : availableDates.length === 0 
                        ? "No dates available" 
                        : "Choose a date"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {availableDates.map((date) => (
                      <SelectItem key={date.date} value={date.date}>
                        {formatDate(date.date)} - {date.dayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Step 4: Select Time Slot */}
            {selectedDate && (
              <div className="space-y-2">
                <Label htmlFor="timeSlot" className="text-base font-semibold flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  4. Select Time Slot
                </Label>
                <Select
                  value={selectedTimeSlot}
                  onValueChange={handleTimeSlotChange}
                  disabled={isLoadingSlots || timeSlots.length === 0}
                >
                  <SelectTrigger id="timeSlot" className="w-full">
                    <SelectValue placeholder={
                      isLoadingSlots 
                        ? "Loading time slots..." 
                        : timeSlots.length === 0 
                        ? "No time slots available" 
                        : "Choose a time slot"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.filter(slot => slot.isAvailable).map((slot, index) => {
                      const remainingText = slot.remainingSlots !== undefined 
                        ? ` (${slot.remainingSlots} slot${slot.remainingSlots !== 1 ? 's' : ''} remaining)`
                        : slot.capacity && slot.bookedCount !== undefined
                        ? ` (${slot.capacity - slot.bookedCount} slot${(slot.capacity - slot.bookedCount) !== 1 ? 's' : ''} remaining)`
                        : '';
                      
                      return (
                        <SelectItem key={index} value={slot.startTime}>
                          {formatTime(slot.startTime)} - {formatTime(slot.endTime)}{remainingText}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Service Description */}
            {selectedTimeSlot && (
              <div className="space-y-2">
                <Label htmlFor="serviceDescription" className="text-base font-semibold">
                  5. Service Description (Optional)
                </Label>
                <Textarea
                  id="serviceDescription"
                  placeholder="Describe the reason for your appointment..."
                  value={serviceDescription}
                  onChange={(e) => setServiceDescription(e.target.value)}
                  rows={3}
                />
              </div>
            )}

            {/* Book Button */}
            {selectedTimeSlot && (
              <div className="pt-4">
                <Button
                  onClick={handleBookAppointment}
                  disabled={isBooking}
                  className="w-full"
                  size="lg"
                >
                  {isBooking ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Booking...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-5 w-5" />
                      Book Now
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

