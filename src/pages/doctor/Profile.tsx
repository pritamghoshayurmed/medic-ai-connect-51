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
  Edit,
  X
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
    available_hours: Record<string, string[]>;
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
  
  const [personalInfoDialog, setPersonalInfoDialog] = useState(false);
  const [professionalInfoDialog, setProfessionalInfoDialog] = useState(false);
  const [availabilityDialog, setAvailabilityDialog] = useState(false);
  const [editAvailabilityDay, setEditAvailabilityDay] = useState<string | null>(null);
  
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
  
  const [daySlots, setDaySlots] = useState<string[]>([]);
  const [newSlot, setNewSlot] = useState('');
  
  useEffect(() => {
    if (!user) return;
    
    const fetchDoctorProfile = async () => {
      setLoading(true);
      try {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select(`
            id,
            full_name,
            email,
            phone,
            role
          `)
          .eq('id', user.id)
          .single();
        
        if (profileError) {
          console.error("Profile fetch error:", profileError);
          throw profileError;
        }
        
        const { data: doctorData, error: doctorError } = await supabase
          .from('doctor_profiles')
          .select(`
            specialty_id,
            experience_years,
            qualification,
            about,
            consultation_fee,
            available_days,
            available_hours
          `)
          .eq('id', user.id)
          .single();
        
        if (doctorError && doctorError.code !== 'PGRST116') {
          console.error("Doctor profile fetch error:", doctorError);
          throw doctorError;
        }
        
        let specialtyInfo = null;
        if (doctorData?.specialty_id) {
          const { data: specialtyData, error: specialtyError } = await supabase
            .from('specialties')
            .select('id, name')
            .eq('id', doctorData.specialty_id)
            .single();
            
          if (!specialtyError) {
            specialtyInfo = specialtyData;
          }
        }
        
        const doctorProfileData: DoctorProfile = {
          id: profileData.id,
          full_name: profileData.full_name,
          email: profileData.email,
          phone: profileData.phone || '',
          role: profileData.role
        };
        
        if (doctorData) {
          doctorProfileData.doctor_profile = {
            specialty_id: doctorData.specialty_id || '',
            experience_years: doctorData.experience_years || 0,
            qualification: doctorData.qualification || '',
            about: doctorData.about || '',
            consultation_fee: doctorData.consultation_fee || 0,
            available_days: doctorData.available_days || [],
            available_hours: doctorData.available_hours as Record<string, string[]> || {}
          };
        }
        
        if (specialtyInfo) {
          doctorProfileData.specialty = {
            id: specialtyInfo.id,
            name: specialtyInfo.name
          };
        }
        
        setDoctorProfile(doctorProfileData);
        
        setPersonalInfo({
          full_name: profileData.full_name,
          email: profileData.email,
          phone: profileData.phone || ''
        });
        
        if (doctorData) {
          setProfessionalInfo({
            specialty_id: doctorData.specialty_id || '',
            experience_years: doctorData.experience_years || 0,
            qualification: doctorData.qualification || '',
            about: doctorData.about || '',
            consultation_fee: doctorData.consultation_fee || 0
          });
        }
        
        if (doctorData?.available_hours) {
          const hours = doctorData.available_hours as Record<string, string[]>;
          
          const updatedSlots = availabilitySlots.map(slot => {
            return {
              day: slot.day,
              slots: hours[slot.day] || []
            };
          });
          
          setAvailabilitySlots(updatedSlots);
        }
        
        const { data: specialtiesData, error: specialtiesError } = await supabase
          .from('specialties')
          .select('id, name');
        
        if (specialtiesError) {
          console.error("Specialties fetch error:", specialtiesError);
          throw specialtiesError;
        }
        
        setSpecialties(specialtiesData || []);
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
      const { count } = await supabase
        .from('doctor_profiles')
        .select('id', { count: 'exact', head: true })
        .eq('id', user.id);
      
      let updateError = null;
      
      if (count && count > 0) {
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
        
        updateError = error;
      } else {
        const { error } = await supabase
          .from('doctor_profiles')
          .insert({
            id: user.id,
            specialty_id: professionalInfo.specialty_id,
            experience_years: professionalInfo.experience_years,
            qualification: professionalInfo.qualification,
            about: professionalInfo.about,
            consultation_fee: professionalInfo.consultation_fee,
            available_days: [],
            available_hours: {}
          });
        
        updateError = error;
      }
      
      if (updateError) throw updateError;
      
      const selectedSpecialty = specialties.find(s => s.id === professionalInfo.specialty_id);
      
      if (doctorProfile) {
        const updatedProfile = {
          ...doctorProfile,
          doctor_profile: {
            ...doctorProfile.doctor_profile,
            specialty_id: professionalInfo.specialty_id,
            experience_years: professionalInfo.experience_years,
            qualification: professionalInfo.qualification,
            about: professionalInfo.about,
            consultation_fee: professionalInfo.consultation_fee,
            available_days: doctorProfile.doctor_profile?.available_days || [],
            available_hours: doctorProfile.doctor_profile?.available_hours || {}
          }
        } as DoctorProfile;
        
        if (selectedSpecialty) {
          updatedProfile.specialty = {
            id: selectedSpecialty.id,
            name: selectedSpecialty.name
          };
        }
        
        setDoctorProfile(updatedProfile);
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
      const updatedSlots = availabilitySlots.map(slot => 
        slot.day === editAvailabilityDay 
          ? { ...slot, slots: daySlots } 
          : slot
      );
      
      setAvailabilitySlots(updatedSlots);
      
      const availableHours: Record<string, string[]> = {};
      updatedSlots.forEach(slot => {
        availableHours[slot.day] = slot.slots;
      });
      
      const availableDays = updatedSlots
        .filter(slot => slot.slots.length > 0)
        .map(slot => slot.day);
      
      const { count } = await supabase
        .from('doctor_profiles')
        .select('id', { count: 'exact', head: true })
        .eq('id', user.id);
      
      let updateError = null;
      
      if (count && count > 0) {
        const { error } = await supabase
          .from('doctor_profiles')
          .update({
            available_hours: availableHours,
            available_days: availableDays
          })
          .eq('id', user.id);
        
        updateError = error;
      } else {
        const { error } = await supabase
          .from('doctor_profiles')
          .insert({
            id: user.id,
            available_hours: availableHours,
            available_days: availableDays,
            specialty_id: null,
            experience_years: 0,
            qualification: '',
            consultation_fee: 0
          });
        
        updateError = error;
      }
      
      if (updateError) throw updateError;
      
      if (doctorProfile && doctorProfile.doctor_profile) {
        setDoctorProfile({
          ...doctorProfile,
          doctor_profile: {
            ...doctorProfile.doctor_profile,
            available_hours: availableHours,
            available_days: availableDays
          }
        });
      }
      
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
    <div className="pb-24 min-h-screen" style={{background: 'linear-gradient(135deg, #005A7A, #002838)'}}>
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white p-4">
        <div className="flex justify-between items-center mb-2">
          <div>
            <h1 className="text-2xl font-bold">Profile</h1>
            <p className="text-white text-opacity-90">Manage your account</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-lg">
            <span className="text-teal-600 text-xl font-bold">{doctorProfile?.full_name?.charAt(0)}</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Personal Information */}
            <Card className="bg-white bg-opacity-10 backdrop-blur-sm border-white border-opacity-20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-white">Personal Information</h2>
                    <p className="text-sm text-white text-opacity-80">Update your personal details</p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="bg-white bg-opacity-10 text-white hover:bg-white hover:bg-opacity-20"
                    onClick={() => setPersonalInfoDialog(true)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </div>
                <div className="space-y-2 text-white">
                  <div>
                    <p className="text-sm text-white text-opacity-70">Full Name</p>
                    <p className="font-medium">{doctorProfile?.full_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-white text-opacity-70">Email</p>
                    <p className="font-medium">{doctorProfile?.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-white text-opacity-70">Phone</p>
                    <p className="font-medium">{doctorProfile?.phone || 'Not provided'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Professional Information */}
            <Card className="bg-white bg-opacity-10 backdrop-blur-sm border-white border-opacity-20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-white">Professional Information</h2>
                    <p className="text-sm text-white text-opacity-80">Your medical expertise and experience</p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="bg-white bg-opacity-10 text-white hover:bg-white hover:bg-opacity-20"
                    onClick={() => setProfessionalInfoDialog(true)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </div>
                <div className="space-y-2 text-white">
                  <div>
                    <p className="text-sm text-white text-opacity-70">Specialty</p>
                    <p className="font-medium">{doctorProfile?.specialty?.name || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-white text-opacity-70">Experience</p>
                    <p className="font-medium">{doctorProfile?.doctor_profile?.experience_years || 0} years</p>
                  </div>
                  <div>
                    <p className="text-sm text-white text-opacity-70">Qualification</p>
                    <p className="font-medium">{doctorProfile?.doctor_profile?.qualification || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-white text-opacity-70">Consultation Fee</p>
                    <p className="font-medium">₹{doctorProfile?.doctor_profile?.consultation_fee || 0}</p>
                  </div>
                  {doctorProfile?.doctor_profile?.about && (
                    <div>
                      <p className="text-sm text-white text-opacity-70">About</p>
                      <p className="font-medium">{doctorProfile.doctor_profile.about}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Availability */}
            <Card className="bg-white bg-opacity-10 backdrop-blur-sm border-white border-opacity-20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-white">Availability</h2>
                    <p className="text-sm text-white text-opacity-80">Set your consultation hours</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {availabilitySlots.map((daySlot) => (
                    <div key={daySlot.day} className="p-3 bg-white bg-opacity-5 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-white">{daySlot.day}</h3>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="bg-white bg-opacity-10 text-white hover:bg-white hover:bg-opacity-20"
                          onClick={() => handleEditDay(daySlot.day)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                      </div>
                      {daySlot.slots.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {daySlot.slots.map((slot) => (
                            <span 
                              key={slot} 
                              className="px-3 py-1 bg-teal-500 text-white text-sm rounded-full"
                            >
                              {slot}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-white text-opacity-60">No slots added</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Settings */}
            <Card className="bg-white bg-opacity-10 backdrop-blur-sm border-white border-opacity-20">
              <CardContent className="p-4">
                <h2 className="text-lg font-semibold text-white mb-4">Settings</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-white">Notifications</p>
                      <p className="text-sm text-white text-opacity-70">Receive appointment alerts</p>
                    </div>
                    <Switch 
                      checked={notificationsEnabled}
                      onCheckedChange={setNotificationsEnabled}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-white">Available for Booking</p>
                      <p className="text-sm text-white text-opacity-70">Allow patients to book appointments</p>
                    </div>
                    <Switch 
                      checked={availableForBooking}
                      onCheckedChange={setAvailableForBooking}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Logout */}
            <Button 
              variant="destructive" 
              className="w-full bg-red-500 hover:bg-red-600"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        )}
      </div>

      {/* Dialogs */}
      <Dialog open={personalInfoDialog} onOpenChange={setPersonalInfoDialog}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Edit Personal Information</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input
                value={personalInfo.full_name}
                onChange={(e) => setPersonalInfo({ ...personalInfo, full_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={personalInfo.email}
                onChange={(e) => setPersonalInfo({ ...personalInfo, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                value={personalInfo.phone}
                onChange={(e) => setPersonalInfo({ ...personalInfo, phone: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPersonalInfoDialog(false)}>Cancel</Button>
            <Button onClick={updatePersonalInfo}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={professionalInfoDialog} onOpenChange={setProfessionalInfoDialog}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Edit Professional Information</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Specialty</Label>
              <Select
                value={professionalInfo.specialty_id}
                onValueChange={(value) => setProfessionalInfo({ ...professionalInfo, specialty_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select specialty" />
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
              <Label>Years of Experience</Label>
              <Input
                type="number"
                value={professionalInfo.experience_years}
                onChange={(e) => setProfessionalInfo({ ...professionalInfo, experience_years: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label>Qualification</Label>
              <Input
                value={professionalInfo.qualification}
                onChange={(e) => setProfessionalInfo({ ...professionalInfo, qualification: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Consultation Fee (₹)</Label>
              <Input
                type="number"
                value={professionalInfo.consultation_fee}
                onChange={(e) => setProfessionalInfo({ ...professionalInfo, consultation_fee: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label>About</Label>
              <Textarea
                value={professionalInfo.about}
                onChange={(e) => setProfessionalInfo({ ...professionalInfo, about: e.target.value })}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProfessionalInfoDialog(false)}>Cancel</Button>
            <Button onClick={updateProfessionalInfo}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={availabilityDialog} onOpenChange={setAvailabilityDialog}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Edit Availability - {editAvailabilityDay}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Add Time Slot</Label>
              <div className="flex gap-2">
                <Input
                  type="time"
                  value={newSlot}
                  onChange={(e) => setNewSlot(e.target.value)}
                />
                <Button onClick={addTimeSlot}>Add</Button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {daySlots.map((slot) => (
                <div
                  key={slot}
                  className="flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full"
                >
                  <span>{slot}</span>
                  <button
                    onClick={() => removeTimeSlot(slot)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAvailabilityDialog(false)}>Cancel</Button>
            <Button onClick={saveAvailabilityDay}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BottomNavigation />
    </div>
  );
}
