import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import { Loader2, Briefcase } from 'lucide-react';

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

export default function ProviderSetup() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    providerType: '',
    businessName: '',
    specialization: '',
    licenseNumber: '',
    bio: '',
    slotDurationMinutes: 30,
    bookingLimitDays: 60,
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.providerType || !formData.businessName) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      await apiService.createProviderProfile({
        providerType: formData.providerType,
        businessName: formData.businessName,
        specialization: formData.specialization || undefined,
        licenseNumber: formData.licenseNumber || undefined,
        bio: formData.bio || undefined,
        slotDurationMinutes: formData.slotDurationMinutes,
        bookingLimitDays: formData.bookingLimitDays,
      });

      toast.success('Provider profile created successfully!');
      navigate('/provider');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (!user || user.userType !== 'provider') {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center flex items-center justify-center gap-2">
            <Briefcase className="h-6 w-6" />
            Complete Your Provider Profile
          </CardTitle>
          <CardDescription className="text-center">
            Set up your business profile to start accepting appointments
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="providerType">Provider Type *</Label>
              <Select
                value={formData.providerType}
                onValueChange={(value) => handleChange('providerType', value)}
                disabled={isLoading}
              >
                <SelectTrigger id="providerType">
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
              <Label htmlFor="businessName">Business Name *</Label>
              <Input
                id="businessName"
                type="text"
                placeholder="e.g., Health & Wellness Clinic"
                value={formData.businessName}
                onChange={(e) => handleChange('businessName', e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="specialization">Specialization (Optional)</Label>
              <Input
                id="specialization"
                type="text"
                placeholder="e.g., Cardiology, Hair Styling"
                value={formData.specialization}
                onChange={(e) => handleChange('specialization', e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="licenseNumber">License Number (Optional)</Label>
              <Input
                id="licenseNumber"
                type="text"
                placeholder="e.g., MD12345"
                value={formData.licenseNumber}
                onChange={(e) => handleChange('licenseNumber', e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio (Optional)</Label>
              <Textarea
                id="bio"
                placeholder="Tell customers about your experience and expertise..."
                value={formData.bio}
                onChange={(e) => handleChange('bio', e.target.value)}
                disabled={isLoading}
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="slotDuration">Slot Duration (minutes)</Label>
                <Input
                  id="slotDuration"
                  type="number"
                  min="15"
                  max="240"
                  step="15"
                  value={formData.slotDurationMinutes}
                  onChange={(e) => handleChange('slotDurationMinutes', parseInt(e.target.value))}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bookingLimit">Booking Limit (days)</Label>
                <Input
                  id="bookingLimit"
                  type="number"
                  min="1"
                  max="365"
                  value={formData.bookingLimitDays}
                  onChange={(e) => handleChange('bookingLimitDays', parseInt(e.target.value))}
                  disabled={isLoading}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating profile...
                </>
              ) : (
                'Complete Setup'
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

