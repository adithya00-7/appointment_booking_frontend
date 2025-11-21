import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';
import { Loader2, Phone, Lock, User, Mail, UserCircle, Briefcase } from 'lucide-react';

export default function Signup() {
  const [formData, setFormData] = useState({
    phone: '',
    firstName: '',
    lastName: '',
    password: '',
    email: '',
    userType: 'customer' as 'customer' | 'provider',
  });
  const [isLoading, setIsLoading] = useState(false);
  const { login, user, isLoading: isAuthLoading } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (!isAuthLoading && user) {
      navigate('/customer');
    }
  }, [user, isAuthLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.phone || !formData.firstName || !formData.lastName || !formData.password) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiService.register(formData);
      login(response.user, response.accessToken);
      apiService.setToken(response.accessToken);
      
      toast.success('Account created successfully!');
      
      // Redirect based on user type
      if (response.user.userType === 'provider') {
        navigate('/provider');
      } else {
        navigate('/customer');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Create Account</CardTitle>
          <CardDescription className="text-center">
            Enter your details to create your account
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1234567890"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="pl-10"
                  disabled={isLoading}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="First name"
                    value={formData.firstName}
                    onChange={(e) => handleChange('firstName', e.target.value)}
                    className="pl-10"
                    disabled={isLoading}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Last name"
                    value={formData.lastName}
                    onChange={(e) => handleChange('lastName', e.target.value)}
                    className="pl-10"
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email (Optional)</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="pl-10"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  className="pl-10"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-base font-semibold">User Type *</Label>
              <RadioGroup
                value={formData.userType}
                onValueChange={(value) => handleChange('userType', value)}
                disabled={isLoading}
              >
                <div 
                  className={`flex items-center space-x-3 border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    formData.userType === 'customer' 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20 shadow-md' 
                      : 'border-border hover:border-blue-300 hover:bg-accent'
                  }`}
                  onClick={() => !isLoading && handleChange('userType', 'customer')}
                >
                  <RadioGroupItem value="customer" id="customer" />
                  <div className={`p-2 rounded-full ${
                    formData.userType === 'customer' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    <UserCircle className="h-5 w-5" />
                  </div>
                  <Label htmlFor="customer" className="flex-1 cursor-pointer">
                    <div className="font-semibold text-base">Customer</div>
                    <p className="text-sm text-muted-foreground mt-1">Book appointments with providers</p>
                  </Label>
                </div>
                <div 
                  className={`flex items-center space-x-3 border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    formData.userType === 'provider' 
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/20 shadow-md' 
                      : 'border-border hover:border-purple-300 hover:bg-accent'
                  }`}
                  onClick={() => !isLoading && handleChange('userType', 'provider')}
                >
                  <RadioGroupItem value="provider" id="provider" />
                  <div className={`p-2 rounded-full ${
                    formData.userType === 'provider' 
                      ? 'bg-purple-500 text-white' 
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    <Briefcase className="h-5 w-5" />
                  </div>
                  <Label htmlFor="provider" className="flex-1 cursor-pointer">
                    <div className="font-semibold text-base">Provider</div>
                    <p className="text-sm text-muted-foreground mt-1">Offer services and manage appointments</p>
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Sign Up'
              )}
            </Button>
            <div className="text-center text-sm">
              Already have an account?{' '}
              <Link to="/login" className="text-primary hover:underline font-medium">
                Login
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

