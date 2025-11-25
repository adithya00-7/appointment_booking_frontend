import { useState, useEffect } from 'react';
import { apiService, ReminderSchedule, ReminderScheduleRequest } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner';
import { Bell, Plus, Loader2, Calendar, Percent } from 'lucide-react';
import { Badge } from './ui/badge';

export function ReminderScheduleManager() {
    const { user } = useAuth();
    const [reminders, setReminders] = useState<ReminderSchedule[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    const [formData, setFormData] = useState<ReminderScheduleRequest>({
        type: 'days_before',
        value: 2,
    });

    useEffect(() => {
        loadReminders();
    }, [user?.providerId]); // eslint-disable-line react-hooks/exhaustive-deps

    const loadReminders = async () => {
        setIsLoading(true);
        try {
            const providerId = user?.providerId;
            if (!providerId) {
                console.warn('No providerId available');
                setReminders([]);
                return;
            }
            const reminderList = await apiService.listReminderSchedules(providerId, true);
            setReminders(reminderList);
        } catch (error) {
            console.error('Failed to load reminders:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to load reminders');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!formData.type || !formData.value) {
            toast.error('Please fill in all fields');
            return;
        }

        if (formData.type === 'days_before' && (formData.value < 1 || formData.value > 365)) {
            toast.error('Days before must be between 1 and 365');
            return;
        }

        if (formData.type === 'percentage' && (formData.value < 1 || formData.value > 100)) {
            toast.error('Percentage must be between 1 and 100');
            return;
        }

        setIsSaving(true);
        try {
            await apiService.createReminderSchedule(formData);
            toast.success('Reminder schedule added successfully!');

            // Reset form
            setFormData({
                type: 'days_before',
                value: 2,
            });
            setShowAddForm(false);

            // Reload reminders
            loadReminders();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to add reminder');
        } finally {
            setIsSaving(false);
        }
    };

    const formatReminder = (reminder: ReminderSchedule) => {
        if (reminder.type === 'days_before') {
            return `${reminder.value} day${reminder.value !== 1 ? 's' : ''} before`;
        } else {
            return `${reminder.value}% of time before`;
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Bell className="h-5 w-5" />
                            Reminder Schedules
                        </CardTitle>
                        <CardDescription>
                            Configure when reminders should be sent to customers before their appointments
                        </CardDescription>
                    </div>
                    {!showAddForm && (
                        <Button onClick={() => setShowAddForm(true)} size="sm">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Reminder
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                {showAddForm && (
                    <form onSubmit={handleSubmit} className="space-y-4 mb-6 p-4 border rounded-lg bg-accent/50">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="reminderType">Reminder Type *</Label>
                                <Select
                                    value={formData.type}
                                    onValueChange={(value) => setFormData(prev => ({
                                        ...prev,
                                        type: value as 'days_before' | 'percentage',
                                        value: value === 'days_before' ? 2 : 80
                                    }))}
                                >
                                    <SelectTrigger id="reminderType">
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="days_before">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4" />
                                                Days Before
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="percentage">
                                            <div className="flex items-center gap-2">
                                                <Percent className="h-4 w-4" />
                                                Percentage
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="reminderValue">
                                    {formData.type === 'days_before' ? 'Days Before Appointment' : 'Percentage of Time'} *
                                </Label>
                                <Input
                                    id="reminderValue"
                                    type="number"
                                    min={1}
                                    max={formData.type === 'days_before' ? 365 : 100}
                                    value={formData.value}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        value: parseInt(e.target.value) || 0
                                    }))}
                                    placeholder={formData.type === 'days_before' ? 'e.g., 2' : 'e.g., 80'}
                                />
                                <p className="text-xs text-muted-foreground">
                                    {formData.type === 'days_before'
                                        ? 'Number of days before the appointment (1-365)'
                                        : 'Percentage of time elapsed before the appointment (1-100)'}
                                </p>
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
                                        Add Reminder
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

                {/* Existing Reminders */}
                {isLoading ? (
                    <div className="text-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                        <p className="mt-2 text-sm text-muted-foreground">Loading reminders...</p>
                    </div>
                ) : reminders.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium">No reminder schedules configured</p>
                        <p className="text-sm">Add your first reminder to notify customers before appointments</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {reminders.map((reminder) => (
                            <div
                                key={reminder.id}
                                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                            >
                                <div className="flex items-center gap-4 flex-1">
                                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                                        {reminder.type === 'days_before' ? (
                                            <Calendar className="h-6 w-6 text-primary" />
                                        ) : (
                                            <Percent className="h-6 w-6 text-primary" />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-semibold">{formatReminder(reminder)}</h4>
                                            <Badge variant={reminder.type === 'days_before' ? 'default' : 'secondary'}>
                                                {reminder.type === 'days_before' ? 'Days' : 'Percentage'}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            Created on {formatDate(reminder.createdAt)}
                                        </p>
                                    </div>
                                </div>
                                {/* Optional: Add delete button if backend supports it */}
                                {/* <button
                  onClick={() => handleDelete(reminder.id)}
                  className="ml-4 p-2 rounded-md hover:bg-destructive/10 hover:text-destructive transition-colors"
                  title="Delete reminder"
                  type="button"
                >
                  <Trash2 className="h-5 w-5" />
                </button> */}
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
