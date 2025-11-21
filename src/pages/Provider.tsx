import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiService, ScheduleConfig, Provider as ProviderType, Appointment } from '../services/api';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { toast } from 'sonner';
import { LogOut, Calendar, Clock, Plus, Trash2, Loader2, Users, Timer, Briefcase, Phone, Mail, UserCircle, AlertCircle, ChevronDown, ChevronUp, FileText, Hash } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

const PROVIDER_TYPES = [
  'doctor',
  'dentist',
  'salon',
  'spa',
  'therapist',
  'consultant',
  'trainer',
  'other'
];

export default function Provider() {
  const { user, logout, isLoading: isAuthLoading } = useAuth();
  const navigate = useNavigate();

  const [providerProfile, setProviderProfile] = useState<ProviderType | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [schedules, setSchedules] = useState<ScheduleConfig[]>([]);
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [expandedAppointments, setExpandedAppointments] = useState<Set<string>>(new Set());

  // Profile completion form
  const [profileForm, setProfileForm] = useState({
    providerType: '',
    specialization: '',
    bookingLimitDays: 30,
  });
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);

  const [formData, setFormData] = useState({
    dayOfWeek: '',
    startTime: '09:00',
    endTime: '17:00',
    slotMetric: 30,
    isCount: false,
  });

  useEffect(() => {
    if (!isAuthLoading && !user) {
      navigate('/login');
      return;
    }
    if (!isAuthLoading && user?.userType !== 'provider') {
      navigate('/customer');
      return;
    }
    if (user) {
      loadProviderProfile();
      loadAppointments(); // Load appointments regardless of profile status
    }
  }, [user, isAuthLoading, navigate]);

  const loadProviderProfile = async () => {
    setIsLoadingProfile(true);
    try {
      // Use providerId from user (from login response)
      const providerId = user?.providerId;
      
      if (!providerId) {
        // No providerId means profile doesn't exist yet
        setProviderProfile(null);
        return;
      }
      
      // Since we have providerId from login, we can load schedules directly
      // Profile will be set when user creates it via the form
      // For now, just check if providerId exists (which means profile exists)
      setProviderProfile(null); // Will be set when profile is created
      loadSchedules();
    } catch (error) {
      console.error('Failed to load provider profile:', error);
      setProviderProfile(null);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const loadAppointments = async () => {
    setIsLoadingAppointments(true);
    try {
      const appointmentList = await apiService.getProviderAppointments();
      console.log('Loaded appointments:', appointmentList);
      
      // Ensure we have an array
      if (!Array.isArray(appointmentList)) {
        console.error('Appointments response is not an array:', appointmentList);
        setAppointments([]);
        return;
      }
      
      // Sort by appointment date and time (upcoming first, then by status)
      const sorted = appointmentList.sort((a, b) => {
        const dateA = new Date(a.appointmentDate).getTime();
        const dateB = new Date(b.appointmentDate).getTime();
        
        // First sort by date (upcoming first)
        if (dateA !== dateB) {
          return dateA - dateB;
        }
        
        // If same date, sort by time
        const timeA = new Date(a.startTime).getTime();
        const timeB = new Date(b.startTime).getTime();
        if (timeA !== timeB) {
          return timeA - timeB;
        }
        
        // If same date and time, prioritize scheduled over cancelled
        if (a.status === 'scheduled' && b.status !== 'scheduled') return -1;
        if (a.status !== 'scheduled' && b.status === 'scheduled') return 1;
        
        return 0;
      });
      setAppointments(sorted);
    } catch (error) {
      console.error('Failed to load appointments:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to load appointments');
      setAppointments([]);
    } finally {
      setIsLoadingAppointments(false);
    }
  };

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!profileForm.providerType) {
      toast.error('Please select a provider type');
      return;
    }

    setIsCreatingProfile(true);
    try {
      const profile = await apiService.createProviderProfile({
        providerType: profileForm.providerType,
        specialization: profileForm.specialization || undefined,
        bookingLimitDays: profileForm.bookingLimitDays,
      });

      // Ensure profile is set
      if (profile) {
        setProviderProfile(profile);
        setShowProfileDialog(false);
        toast.success('Profile created successfully! Now configure your schedule.');
        // Load schedules after profile creation
        loadSchedules();
      } else {
        toast.error('Profile creation failed - no profile data returned');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create profile');
    } finally {
      setIsCreatingProfile(false);
    }
  };

  const loadSchedules = async () => {
    setIsLoadingSchedules(true);
    try {
      // Use providerId from user (from login response) or from profile
      const providerId = user?.providerId || providerProfile?.id;
      
      if (!providerId) {
        console.warn('No providerId available to load schedules');
        setSchedules([]);
        return;
      }
      
      const scheduleList = await apiService.getProviderSchedules(providerId);
      setSchedules(scheduleList.sort((a: ScheduleConfig, b: ScheduleConfig) => a.dayOfWeek - b.dayOfWeek));
    } catch (error) {
      console.error('Failed to load schedules:', error);
      // Don't show error toast for empty schedules
    } finally {
      setIsLoadingSchedules(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.dayOfWeek || !formData.startTime || !formData.endTime) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.slotMetric <= 0) {
      toast.error('Slot metric must be greater than 0');
      return;
    }

    setIsSaving(true);
    try {
      await apiService.createScheduleConfig({
        dayOfWeek: parseInt(formData.dayOfWeek),
        startTime: formData.startTime,
        endTime: formData.endTime,
        slotMetric: formData.slotMetric,
        isCount: formData.isCount,
      });

      toast.success('Schedule configuration added successfully!');
      
      // Reset form
      setFormData({
        dayOfWeek: '',
        startTime: '09:00',
        endTime: '17:00',
        slotMetric: 30,
        isCount: false,
      });
      setShowAddForm(false);
      
        // Reload schedules
        loadSchedules();
        // Reload appointments in case new slots are available
        if (providerProfile) {
          loadAppointments();
        }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add schedule');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (scheduleId: string) => {
    if (!confirm('Are you sure you want to delete this schedule configuration?')) {
      return;
    }

    try {
      await apiService.deleteScheduleConfig(scheduleId);
      toast.success('Schedule deleted successfully');
      loadSchedules();
      // Reload appointments
      if (providerProfile) {
        loadAppointments();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete schedule');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getDayName = (dayOfWeek: number) => {
    return DAYS_OF_WEEK.find(d => d.value === dayOfWeek)?.label || 'Unknown';
  };

  const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
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

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const toggleAppointmentExpanded = (appointmentId: string) => {
    setExpandedAppointments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(appointmentId)) {
        newSet.delete(appointmentId);
      } else {
        newSet.add(appointmentId);
      }
      return newSet;
    });
  };

  // Show loading state while checking authentication
  if (isAuthLoading || isLoadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto p-4 max-w-6xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 pt-6">
          <div>
            <h1 className="text-3xl font-bold">Provider Dashboard</h1>
            <p className="text-muted-foreground">Welcome, {user?.firstName} {user?.lastName}!</p>
          </div>
          <div className="flex gap-2">
            <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
              <DialogTrigger asChild>
                <Button variant={providerProfile ? "outline" : "default"} className={providerProfile ? "" : "bg-orange-500 hover:bg-orange-600"}>
                  {providerProfile ? (
                    <>
                      <UserCircle className="mr-2 h-4 w-4" />
                      Profile
                    </>
                  ) : (
                    <>
                      <AlertCircle className="mr-2 h-4 w-4" />
                      Complete Profile
                    </>
                  )}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5" />
                    {providerProfile ? 'Update Provider Profile' : 'Complete Your Provider Profile'}
                  </DialogTitle>
                  <DialogDescription>
                    {providerProfile 
                      ? 'Update your provider information'
                      : 'Fill in your details to start accepting appointments'}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateProfile}>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="dialog-providerType">Provider Type *</Label>
                      <Select
                        value={profileForm.providerType}
                        onValueChange={(value) => setProfileForm(prev => ({ ...prev, providerType: value }))}
                      >
                        <SelectTrigger id="dialog-providerType">
                          <SelectValue placeholder="Select your provider type" />
                        </SelectTrigger>
                        <SelectContent>
                          {PROVIDER_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type.charAt(0).toUpperCase() + type.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="dialog-specialization">Specialization (Optional)</Label>
                      <Input
                        id="dialog-specialization"
                        type="text"
                        placeholder="e.g., Cardiologist, Hair Styling"
                        value={profileForm.specialization}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, specialization: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="dialog-bookingLimitDays">Booking Limit (days in advance)</Label>
                      <Input
                        id="dialog-bookingLimitDays"
                        type="number"
                        min="1"
                        max="365"
                        value={profileForm.bookingLimitDays}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, bookingLimitDays: parseInt(e.target.value) }))}
                      />
                      <p className="text-xs text-muted-foreground">
                        How far in advance customers can book (1-365 days)
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setShowProfileDialog(false)}
                      disabled={isCreatingProfile}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isCreatingProfile}>
                      {isCreatingProfile ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {providerProfile ? 'Updating...' : 'Creating...'}
                        </>
                      ) : (
                        providerProfile ? 'Update Profile' : 'Complete Setup'
                      )}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>

        {/* Profile Incomplete Warning */}
        {!providerProfile && (
          <Card className="mb-6 border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-900">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-orange-900 dark:text-orange-100 mb-1">
                    Profile Incomplete
                  </h3>
                  <p className="text-sm text-orange-800 dark:text-orange-200 mb-3">
                    Complete your provider profile to start accepting appointments and configure your schedule.
                  </p>
                  <Button 
                    size="sm" 
                    onClick={() => setShowProfileDialog(true)}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    <Briefcase className="mr-2 h-4 w-4" />
                    Complete Profile Now
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Profile Info */}
        {providerProfile && (
          <Card className="mb-6 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                  <Briefcase className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">
                    {providerProfile.providerType.charAt(0).toUpperCase() + providerProfile.providerType.slice(1)}
                    {providerProfile.specialization && ` - ${providerProfile.specialization}`}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Booking window: {providerProfile.bookingLimitDays} days in advance
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Info Cards */}
        <div className="grid gap-6 md:grid-cols-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Appointments</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{appointments.length}</div>
              <p className="text-xs text-muted-foreground">
                {appointments.length === 0 ? 'No appointments yet' : 'All bookings'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Schedule Configs</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{schedules.length}</div>
              <p className="text-xs text-muted-foreground">
                {schedules.length === 0 ? 'No schedules' : 'Days configured'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Time-Based</CardTitle>
              <Timer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {schedules.filter(s => !s.isCount).length}
              </div>
              <p className="text-xs text-muted-foreground">Traditional slots</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Count-Based</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {schedules.filter(s => s.isCount).length}
              </div>
              <p className="text-xs text-muted-foreground">Walk-in slots</p>
            </CardContent>
          </Card>
        </div>

        {/* Schedule Configuration */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Schedule Configuration</CardTitle>
                <CardDescription>
                  Configure your availability for each day of the week
                </CardDescription>
              </div>
              {!showAddForm && (
                <Button onClick={() => setShowAddForm(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Schedule
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {showAddForm && (
              <form onSubmit={handleSubmit} className="space-y-4 mb-6 p-4 border rounded-lg bg-accent/50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dayOfWeek">Day of Week *</Label>
                    <Select
                      value={formData.dayOfWeek}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, dayOfWeek: value }))}
                    >
                      <SelectTrigger id="dayOfWeek">
                        <SelectValue placeholder="Select day" />
                      </SelectTrigger>
                      <SelectContent>
                        {DAYS_OF_WEEK.map((day) => (
                          <SelectItem key={day.value} value={day.value.toString()}>
                            {day.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Slot Type *</Label>
                    <RadioGroup
                      value={formData.isCount ? 'count' : 'time'}
                      onValueChange={(value) => setFormData(prev => ({ 
                        ...prev, 
                        isCount: value === 'count',
                        slotMetric: value === 'count' ? 50 : 30
                      }))}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="time" id="time" />
                        <Label htmlFor="time" className="cursor-pointer font-normal">
                          Time-Divided (e.g., 30-min slots)
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="count" id="count" />
                        <Label htmlFor="count" className="cursor-pointer font-normal">
                          Count-Based (e.g., 50 people max)
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startTime">Start Time *</Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={formData.startTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endTime">End Time *</Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={formData.endTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="slotMetric">
                      {formData.isCount ? 'Max Customers' : 'Minutes per Slot'} *
                    </Label>
                    <Input
                      id="slotMetric"
                      type="number"
                      min="1"
                      value={formData.slotMetric}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        slotMetric: parseInt(e.target.value) 
                      }))}
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Schedule
                      </>
                    )}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowAddForm(false)}
                    disabled={isSaving}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}

            {/* Existing Schedules */}
            {isLoadingSchedules ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">Loading schedules...</p>
              </div>
            ) : schedules.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No schedules configured</p>
                <p className="text-sm">Add your first schedule to start accepting bookings</p>
              </div>
            ) : (
              <div className="space-y-3">
                {schedules.map((schedule) => (
                  <div
                    key={schedule.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                        {schedule.isCount ? (
                          <Users className="h-6 w-6 text-primary" />
                        ) : (
                          <Clock className="h-6 w-6 text-primary" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold">{getDayName(schedule.dayOfWeek)}</h4>
                        <p className="text-sm text-muted-foreground">
                          {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-sm font-medium">
                          {schedule.isCount ? (
                            <>
                              <Users className="h-4 w-4" />
                              <span>{schedule.slotMetric} max customers</span>
                            </>
                          ) : (
                            <>
                              <Timer className="h-4 w-4" />
                              <span>{schedule.slotMetric} min slots</span>
                            </>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {schedule.isCount ? 'Count-based' : 'Time-divided'}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(schedule.id)}
                      className="ml-4"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Appointments */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>All Appointments</CardTitle>
                <CardDescription>
                  View all your scheduled appointments
                </CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={loadAppointments}
                disabled={isLoadingAppointments}
              >
                {isLoadingAppointments ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Calendar className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingAppointments ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">Loading appointments...</p>
              </div>
            ) : appointments.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No appointments yet</p>
                <p className="text-sm">Your booked appointments will appear here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {appointments.map((appointment) => {
                  const isExpanded = expandedAppointments.has(appointment.id);
                  return (
                    <div
                      key={appointment.id}
                      className="border rounded-lg hover:bg-accent/50 transition-colors overflow-hidden"
                    >
                      <div className="flex items-start gap-4 p-4">
                        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/20 flex-shrink-0">
                          <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h4 className="font-semibold text-lg mb-1">
                                {appointment.customer?.user?.firstName} {appointment.customer?.user?.lastName}
                              </h4>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                                <Hash className="h-3 w-3" />
                                <span className="font-mono">{appointment.id.slice(0, 8)}...</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs px-2 py-1 rounded-full font-medium flex-shrink-0 ${
                                appointment.status === 'scheduled' 
                                  ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                                  : appointment.status === 'cancelled'
                                  ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                                  : 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400'
                              }`}>
                                {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => toggleAppointmentExpanded(appointment.id)}
                              >
                                {isExpanded ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Calendar className="h-4 w-4 flex-shrink-0 text-primary" />
                                <span className="font-medium">Date:</span>
                                <span>{formatDate(appointment.appointmentDate)}</span>
                              </div>
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Clock className="h-4 w-4 flex-shrink-0 text-primary" />
                                <span className="font-medium">Time:</span>
                                <span>{formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}</span>
                              </div>
                            </div>
                            <div className="space-y-2">
                              {appointment.customer?.user?.phone && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Phone className="h-4 w-4 flex-shrink-0 text-primary" />
                                  <span className="font-medium">Phone:</span>
                                  <span>{appointment.customer.user.phone}</span>
                                </div>
                              )}
                              {appointment.customer?.user?.email && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Mail className="h-4 w-4 flex-shrink-0 text-primary" />
                                  <span className="font-medium">Email:</span>
                                  <span className="truncate">{appointment.customer.user.email}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {appointment.serviceDescription && (
                            <div className="mt-3 pt-3 border-t">
                              <div className="flex items-start gap-2">
                                <FileText className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                                <div>
                                  <p className="text-xs font-medium text-muted-foreground mb-1">Service Description</p>
                                  <p className="text-sm">{appointment.serviceDescription}</p>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Expanded Details */}
                          {isExpanded && (
                            <div className="mt-4 pt-4 border-t space-y-3">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div>
                                  <p className="text-xs font-medium text-muted-foreground mb-1">Appointment ID</p>
                                  <p className="font-mono text-xs break-all">{appointment.id}</p>
                                </div>
                                <div>
                                  <p className="text-xs font-medium text-muted-foreground mb-1">Customer ID</p>
                                  <p className="font-mono text-xs break-all">{appointment.customerId}</p>
                                </div>
                                <div>
                                  <p className="text-xs font-medium text-muted-foreground mb-1">Created At</p>
                                  <p className="text-xs">{formatDateTime(appointment.createdAt)}</p>
                                </div>
                                <div>
                                  <p className="text-xs font-medium text-muted-foreground mb-1">Last Updated</p>
                                  <p className="text-xs">{formatDateTime(appointment.updatedAt)}</p>
                                </div>
                              </div>

                              {appointment.notes && (
                                <div className="pt-2 border-t">
                                  <p className="text-xs font-medium text-muted-foreground mb-1">Notes</p>
                                  <p className="text-sm">{appointment.notes}</p>
                                </div>
                              )}

                              {appointment.cancellationReason && (
                                <div className="pt-2 border-t">
                                  <p className="text-xs font-medium text-red-600 dark:text-red-400 mb-1">Cancellation Details</p>
                                  <p className="text-sm text-red-600 dark:text-red-400">{appointment.cancellationReason}</p>
                                  {appointment.cancelledBy && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Cancelled by: {appointment.cancelledBy}
                                    </p>
                                  )}
                                  {appointment.cancelledAt && (
                                    <p className="text-xs text-muted-foreground">
                                      Cancelled at: {formatDateTime(appointment.cancelledAt)}
                                    </p>
                                  )}
                                </div>
                              )}

                              {appointment.provider && (
                                <div className="pt-2 border-t">
                                  <p className="text-xs font-medium text-muted-foreground mb-2">Provider Information</p>
                                  <div className="space-y-1 text-sm">
                                    <p><span className="font-medium">Business:</span> {appointment.provider.businessName}</p>
                                    {appointment.provider.specialization && (
                                      <p><span className="font-medium">Specialization:</span> {appointment.provider.specialization}</p>
                                    )}
                                    <p><span className="font-medium">Type:</span> {appointment.provider.providerType}</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Help Card */}
        <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
          <CardHeader>
            <CardTitle>How Schedule Configuration Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Time-Divided Slots (Traditional)
                </h4>
                <p className="text-muted-foreground">
                  Perfect for appointments with fixed duration. For example, set Monday 9:00-17:00 with 30-minute slots. 
                  This creates slots: 9:00-9:30, 9:30-10:00, etc. Each slot can be booked by one customer.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Count-Based Slots (Walk-in Style)
                </h4>
                <p className="text-muted-foreground">
                  Ideal for walk-in clinics or group sessions. For example, set Tuesday 9:00-17:00 with 50 max customers. 
                  This creates ONE large slot where up to 50 people can book for the same time period.
                </p>
              </div>
              <div className="p-3 bg-primary/10 rounded-lg">
                <p className="text-xs">
                  <strong>💡 Tip:</strong> You can mix both types! Use time-divided for certain days and count-based for others based on your needs.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
