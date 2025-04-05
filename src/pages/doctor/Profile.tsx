import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  ChevronLeft, 
  User, 
  Calendar, 
  Clock, 
  Settings, 
  Bell, 
  LogOut, 
  ChevronRight,
  Plus,
  Trash,
  Edit
} from "lucide-react";
import BottomNavigation from "@/components/BottomNavigation";
import { useAuth } from "@/contexts/AuthContext";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

interface AvailabilitySlot {
  day: string;
  slots: string[];
}

interface DoctorProfile {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  role: string;
  doctor_profile?: {
    specialty_id: string;
    experience_years: number;
    qualification: string;
    about: string;
    consultation_fee: number;
    available_days: string[];
    available_hours: {
      [key: string]: string[];
    };
  };
  specialty?: {
    id: string;
    name: string;
  };
}

export default function DoctorProfile() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [availableForBooking, setAvailableForBooking] = useState(true);
  const [doctorProfile, setDoctorProfile] = useState<DoctorProfile | null>(null);
  const [specialties, setSpecialties] = useState<{id: string, name: string}[]>([]);
  
  // Edit dialogs state
  const [personalInfoDialog, setPersonalInfoDialog] = useState(false);
  const [professionalInfoDialog, setProfessionalInfoDialog] = useState(false);
  const [availabilityDialog, setAvailabilityDialog] = useState(false);
  const [editAvailabilityDay, setEditAvailabilityDay] = useState<string | null>(null);
  
  // Form states
  const [personalInfo, setPersonalInfo] = useState({
    full_name: '',
    email: '',
    phone: ''
  });
  
  const [professionalInfo, setProfessionalInfo] = useState({
    specialty_id: '',
    experience_years: 0,
    qualification: '',
    about: '',
    consultation_fee: 0
  });
  
  const [availabilitySlots, setAvailabilitySlots] = useState<AvailabilitySlot[]>([
    { day: "Monday", slots: [] },
    { day: "Tuesday", slots: [] },
    { day: "Wednesday", slots: [] },
    { day: "Thursday", slots: [] },
    { day: "Friday", slots: [] },
    { day: "Saturday", slots: [] },
    { day: "Sunday", slots: [] },
  ]);
  
  // Dialog state for editing specific day
  const [daySlots, setDaySlots] = useState<string[]>([]);
  const [newSlot, setNewSlot] = useState('');
  
  useEffect(() => {
    if (!user) return;
    
    const fetchDoctorProfile = async () => {
      setLoading(true);
      try {
        // Fetch doctor profile with joined data
        const { data, error } = await supabase
          .from('profiles')
          .select(`
            id,
            full_name,
            email,
            phone,
            role,
            doctor_profiles (
              specialty_id,
              experience_years,
              qualification,
              about,
              consultation_fee,
              available_days,
              available_hours
            ),
            specialties:doctor_profiles.specialty_id (
              id,
              name
            )
          `)
          .eq('id', user.id)
          .single();
        
        if (error) throw error;
        
        setDoctorProfile(data);
        
        // Set form states
        setPersonalInfo({
          full_name: data.full_name || '',
          email: data.email || '',
          phone: data.phone || ''
        });
        
        if (data.doctor_profiles) {
          setProfessionalInfo({
            specialty_id: data.doctor_profiles.specialty_id || '',
            experience_years: data.doctor_profiles.experience_years || 0,
            qualification: data.doctor_profiles.qualification || '',
            about: data.doctor_profiles.about || '',
            consultation_fee: data.doctor_profiles.consultation_fee || 0
          });
          
          // Set availability slots
          if (data.doctor_profiles.available_hours) {
            const hours = data.doctor_profiles.available_hours as Record<string, string[]>;
            
            const updatedSlots = availabilitySlots.map(slot => {
              return {
                day: slot.day,
                slots: hours[slot.day] || []
              };
            });
            
            setAvailabilitySlots(updatedSlots);
          }
        }
        
        // Fetch specialties for dropdown
        const { data: specialtiesData, error: specialtiesError } = await supabase
          .from('specialties')
          .select('*');
        
        if (specialtiesError) throw specialtiesError;
        setSpecialties(specialtiesData);
        
      } catch (error) {
        console.error("Error fetching doctor profile:", error);
        toast({
          title: "Error",
          description: "Failed to load your profile information",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchDoctorProfile();
  }, [user, toast]);
  
  const handleLogout = () => {
    logout();
    navigate("/");
  };
  
  const updatePersonalInfo = async () => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: personalInfo.full_name,
          phone: personalInfo.phone
        })
        .eq('id', user.id);
      
      if (error) throw error;
      
      // Update local state
      if (doctorProfile) {
        setDoctorProfile({
          ...doctorProfile,
          full_name: personalInfo.full_name,
          phone: personalInfo.phone
        });
      }
      
      toast({
        title: "Profile Updated",
        description: "Your personal information has been updated successfully"
      });
      
      setPersonalInfoDialog(false);
    } catch (error) {
      console.error("Error updating personal info:", error);
      toast({
        title: "Update Failed",
        description: "There was an error updating your information",
        variant: "destructive"
      });
    }
  };
  
  const updateProfessionalInfo = async () => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('doctor_profiles')
        .update({
          specialty_id: professionalInfo.specialty_id,
          experience_years: professionalInfo.experience_years,
          qualification: professionalInfo.qualification,
          about: professionalInfo.about,
          consultation_fee: professionalInfo.consultation_fee
        })
        .eq('id', user.id);
      
      if (error) throw error;
      
      // Update local state
      if (doctorProfile && doctorProfile.doctor_profile) {
        setDoctorProfile({
          ...doctorProfile,
          doctor_profile: {
            ...doctorProfile.doctor_profile,
            specialty_id: professionalInfo.specialty_id,
            experience_years: professionalInfo.experience_years,
            qualification: professionalInfo.qualification,
            about: professionalInfo.about,
            consultation_fee: professionalInfo.consultation_fee
          },
          specialty: specialties.find(s => s.id === professionalInfo.specialty_id) || doctorProfile.specialty
        });
      }
      
      toast({
        title: "Profile Updated",
        description: "Your professional information has been updated successfully"
      });
      
      setProfessionalInfoDialog(false);
    } catch (error) {
      console.error("Error updating professional info:", error);
      toast({
        title: "Update Failed",
        description: "There was an error updating your information",
        variant: "destructive"
      });
    }
  };
  
  const saveAvailabilityDay = async () => {
    if (!user || !editAvailabilityDay) return;
    
    try {
      // Update the local state first
      const updatedSlots = availabilitySlots.map(slot => 
        slot.day === editAvailabilityDay 
          ? { ...slot, slots: daySlots } 
          : slot
      );
      
      setAvailabilitySlots(updatedSlots);
      
      // Convert to format for database
      const availableHours: Record<string, string[]> = {};
      updatedSlots.forEach(slot => {
        availableHours[slot.day] = slot.slots;
      });
      
      // Get available days (days with at least one slot)
      const availableDays = updatedSlots
        .filter(slot => slot.slots.length > 0)
        .map(slot => slot.day);
      
      // Update database
      const { error } = await supabase
        .from('doctor_profiles')
        .update({
          available_hours: availableHours,
          available_days: availableDays
        })
        .eq('id', user.id);
      
      if (error) throw error;
      
      toast({
        title: "Availability Updated",
        description: `Your availability for ${editAvailabilityDay} has been updated`
      });
      
      setEditAvailabilityDay(null);
    } catch (error) {
      console.error("Error updating availability:", error);
      toast({
        title: "Update Failed",
        description: "Failed to update your availability",
        variant: "destructive"
      });
    }
  };
  
  const addTimeSlot = () => {
    if (!newSlot) return;
    
    // Check if slot already exists
    if (daySlots.includes(newSlot)) {
      toast({
        title: "Duplicate Slot",
        description: "This time slot already exists",
        variant: "destructive"
      });
      return;
    }
    
    setDaySlots([...daySlots, newSlot]);
    setNewSlot('');
  };
  
  const removeTimeSlot = (slot: string) => {
    setDaySlots(daySlots.filter(s => s !== slot));
  };
  
  const handleEditDay = (day: string) => {
    // Find the slots for this day
    const dayData = availabilitySlots.find(slot => slot.day === day);
    if (dayData) {
      setDaySlots(dayData.slots);
    } else {
      setDaySlots([]);
    }
    setEditAvailabilityDay(day);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="bg-primary text-white p-4 flex items-center">
        <Button variant="ghost" size="icon" className="text-white mr-2" onClick={() => navigate(-1)}>
          <ChevronLeft />
        </Button>
        <h1 className="text-xl font-bold">Profile</h1>
      </div>

      {/* Profile Info */}
      <div className="flex items-center p-6">
        <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center mr-4">
          {user?.profilePic ? (
            <img
              src={user.profilePic}
              alt={user.name}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <User className="h-10 w-10 text-gray-500" />
          )}
        </div>
        <div>
          <h2 className="text-xl font-bold">{doctorProfile?.full_name}</h2>
          <p className="text-gray-600">{doctorProfile?.specialty?.name || 'Doctor'}</p>
          <p className="text-gray-600">{doctorProfile?.doctor_profile?.experience_years || 0} years experience</p>
        </div>
      </div>

      <Separator />

      {/* Tabs for settings */}
      <Tabs defaultValue="availability" className="w-full p-4">
        <TabsList className="grid grid-cols-3 w-full mb-4">
          <TabsTrigger value="availability">Availability</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        
        {/* Availability Tab */}
        <TabsContent value="availability">
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Available for Bookings</h3>
                <Switch
                  checked={availableForBooking}
                  onCheckedChange={setAvailableForBooking}
                />
              </div>
              
              <div className="space-y-4">
                {availabilitySlots.map((day) => (
                  <div key={day.day} className="border-b pb-3 last:border-0 last:pb-0">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">{day.day}</h4>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleEditDay(day.day)}
                      >
                        Edit
                      </Button>
                    </div>
                    {day.slots.length > 0 ? (
                      <div className="mt-2 space-y-1">
                        {day.slots.map((slot, idx) => (
                          <div key={idx} className="flex items-center">
                            <Clock className="h-4 w-4 text-gray-500 mr-2" />
                            <span className="text-sm">{slot}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 mt-2">Not available</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h3 className="font-semibold mb-3">Appointment Settings</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">Consultation Duration</p>
                    <p className="text-sm text-gray-500">Time per appointment</p>
                  </div>
                  <select className="border rounded p-1">
                    <option>30 minutes</option>
                    <option>45 minutes</option>
                    <option>60 minutes</option>
                  </select>
                </div>
                
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">Buffer Time</p>
                    <p className="text-sm text-gray-500">Time between appointments</p>
                  </div>
                  <select className="border rounded p-1">
                    <option>5 minutes</option>
                    <option>10 minutes</option>
                    <option>15 minutes</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
        
        {/* Profile Tab */}
        <TabsContent value="profile">
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h3 className="font-semibold mb-3">Professional Information</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <p className="text-gray-600">Specialty</p>
                  <p>{doctorProfile?.specialty?.name || 'Not set'}</p>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-gray-600">Experience</p>
                  <p>{doctorProfile?.doctor_profile?.experience_years || 0} years</p>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-gray-600">Consultation Fee</p>
                  <p>${doctorProfile?.doctor_profile?.consultation_fee || 0}</p>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-gray-600">Qualification</p>
                  <p>{doctorProfile?.doctor_profile?.qualification || 'Not set'}</p>
                </div>
                <div className="mt-2">
                  <p className="text-gray-600 mb-1">About</p>
                  <p className="text-sm">
                    {doctorProfile?.doctor_profile?.about || 'No information provided.'}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-2"
                  onClick={() => setProfessionalInfoDialog(true)}
                >
                  Edit Professional Info
                </Button>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h3 className="font-semibold mb-3">Personal Information</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <p className="text-gray-600">Full Name</p>
                  <p>{doctorProfile?.full_name}</p>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-gray-600">Email</p>
                  <p>{doctorProfile?.email}</p>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-gray-600">Phone</p>
                  <p>{doctorProfile?.phone || 'Not set'}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-2"
                  onClick={() => setPersonalInfoDialog(true)}
                >
                  Edit Personal Info
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>
        
        {/* Settings Tab */}
        <TabsContent value="settings">
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h3 className="font-semibold mb-3">Notifications</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="notifications">Enable Notifications</Label>
                    <p className="text-sm text-gray-500">Receive alerts and updates</p>
                  </div>
                  <Switch
                    id="notifications"
                    checked={notificationsEnabled}
                    onCheckedChange={setNotificationsEnabled}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="appointment-alerts">Appointment Alerts</Label>
                    <p className="text-sm text-gray-500">Get notified about appointments</p>
                  </div>
                  <Switch
                    id="appointment-alerts"
                    checked={true}
                    disabled={!notificationsEnabled}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="patient-messages">Patient Messages</Label>
                    <p className="text-sm text-gray-500">Notifications for patient messages</p>
                  </div>
                  <Switch
                    id="patient-messages"
                    checked={true}
                    disabled={!notificationsEnabled}
                  />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h3 className="font-semibold mb-3">Account</h3>
              <Button
                variant="destructive"
                size="sm"
                className="w-full flex justify-between items-center"
              >
                <span>Delete Account</span>
                <Trash className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Logout button */}
      <div className="p-4">
        <Button 
          variant="destructive" 
          className="w-full"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" /> Logout
        </Button>
      </div>

      {/* Edit Personal Info Dialog */}
      <Dialog open={personalInfoDialog} onOpenChange={setPersonalInfoDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Personal Information</DialogTitle>
            <DialogDescription>
              Update your personal details below
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="full-name">Full Name</Label>
              <Input
                id="full-name"
                value={personalInfo.full_name}
                onChange={(e) => setPersonalInfo({...personalInfo, full_name: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={personalInfo.email}
                disabled
              />
              <p className="text-xs text-gray-500">Email cannot be changed</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={personalInfo.phone}
                onChange={(e) => setPersonalInfo({...personalInfo, phone: e.target.value})}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="secondary" onClick={() => setPersonalInfoDialog(false)}>
              Cancel
            </Button>
            <Button onClick={updatePersonalInfo}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Professional Info Dialog */}
      <Dialog open={professionalInfoDialog} onOpenChange={setProfessionalInfoDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Professional Information</DialogTitle>
            <DialogDescription>
              Update your professional details
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="specialty">Specialty</Label>
              <Select 
                value={professionalInfo.specialty_id}
                onValueChange={(value) => setProfessionalInfo({...professionalInfo, specialty_id: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a specialty" />
                </SelectTrigger>
                <SelectContent>
                  {specialties.map((specialty) => (
                    <SelectItem key={specialty.id} value={specialty.id}>
                      {specialty.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="experience">Years of Experience</Label>
              <Input
                id="experience"
                type="number"
                min="0"
                value={professionalInfo.experience_years}
                onChange={(e) => setProfessionalInfo({
                  ...professionalInfo, 
                  experience_years: parseInt(e.target.value) || 0
                })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="qualification">Qualification</Label>
              <Input
                id="qualification"
                value={professionalInfo.qualification}
                onChange={(e) => setProfessionalInfo({
                  ...professionalInfo, 
                  qualification: e.target.value
                })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="fee">Consultation Fee ($)</Label>
              <Input
                id="fee"
                type="number"
                min="0"
                step="5"
                value={professionalInfo.consultation_fee}
                onChange={(e) => setProfessionalInfo({
                  ...professionalInfo, 
                  consultation_fee: parseInt(e.target.value) || 0
                })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="about">About</Label>
              <Textarea
                id="about"
                rows={4}
                value={professionalInfo.about}
                onChange={(e) => setProfessionalInfo({
                  ...professionalInfo, 
                  about: e.target.value
                })}
                placeholder="Write a brief professional summary"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="secondary" onClick={() => setProfessionalInfoDialog(false)}>
              Cancel
            </Button>
            <Button onClick={updateProfessionalInfo}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Availability Dialog */}
      <Dialog open={editAvailabilityDay !== null} onOpenChange={(open) => !open && setEditAvailabilityDay(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit {editAvailabilityDay} Availability</DialogTitle>
            <DialogDescription>
              Add or remove time slots for {editAvailabilityDay}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex space-x-2">
              <Input
                placeholder="e.g. 9:00 AM - 1:00 PM"
                value={newSlot}
                onChange={(e) => setNewSlot(e.target.value)}
              />
              <Button onClick={addTimeSlot}>Add</Button>
            </div>
            
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {daySlots.length > 0 ? (
                daySlots.map((slot, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-gray-600" />
                      <span>{slot}</span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => removeTimeSlot(slot)}>
                      <Trash className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-2">No time slots added yet</p>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="secondary" onClick={() => setEditAvailabilityDay(null)}>
              Cancel
            </Button>
            <Button onClick={saveAvailabilityDay}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BottomNavigation />
    </div>
  );
}
