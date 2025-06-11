import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  ChevronLeft, 
  User, 
  Mail, 
  Phone, 
  Award,
  Clock,
  Calendar,
  FileText, 
  Settings, 
  LogOut, 
  Edit,
  Plus,
  Trash,
  ArrowLeft
} from "lucide-react";
import BottomNavigation from "@/components/BottomNavigation";
import { useAuth } from "@/contexts/AuthContext";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
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
import { format } from "date-fns";

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
        
        // Parse availability slots from doctor profile
        if (doctorData?.available_hours) {
          const availableHours = doctorData.available_hours as Record<string, string[]>;
          const updatedSlots = availabilitySlots.map(daySlot => {
            return {
              ...daySlot,
              slots: availableHours[daySlot.day] || []
            };
          });
          setAvailabilitySlots(updatedSlots);
        }
        
        // Fetch specialties
        const { data: specialtiesData, error: specialtiesError } = await supabase
          .from('specialties')
          .select('id, name')
          .order('name', { ascending: true });
          
        if (!specialtiesError) {
          setSpecialties(specialtiesData || []);
        }
        
      } catch (error) {
        console.error("Error fetching doctor profile:", error);
        toast({
          title: "Error",
          description: "Failed to load profile data",
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
    navigate("/login");
  };
  
  const updatePersonalInfo = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: personalInfo.full_name,
          phone: personalInfo.phone
        })
        .eq('id', user!.id);
        
      if (error) throw error;
      
      // Update the doctor profile state with new info
      setDoctorProfile(prev => {
        if (!prev) return null;
        return {
          ...prev,
          full_name: personalInfo.full_name,
          phone: personalInfo.phone
        };
      });
      
      setPersonalInfoDialog(false);
      
      toast({
        title: "Success",
        description: "Personal information updated"
      });
    } catch (error) {
      console.error("Error updating personal info:", error);
      toast({
        title: "Error",
        description: "Failed to update personal information",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  const updateProfessionalInfo = async () => {
    setLoading(true);
    try {
      // Check if doctor profile exists
      const { data: existingProfile } = await supabase
        .from('doctor_profiles')
        .select('id')
        .eq('id', user!.id)
        .maybeSingle();
        
      let error;
      
      if (existingProfile) {
        // Update existing profile
        const { error: updateError } = await supabase
          .from('doctor_profiles')
          .update({
            specialty_id: professionalInfo.specialty_id,
            experience_years: professionalInfo.experience_years,
            qualification: professionalInfo.qualification,
            about: professionalInfo.about,
            consultation_fee: professionalInfo.consultation_fee
          })
          .eq('id', user!.id);
          
        error = updateError;
      } else {
        // Create new profile
        const { error: insertError } = await supabase
          .from('doctor_profiles')
          .insert({
            id: user!.id,
            specialty_id: professionalInfo.specialty_id,
            experience_years: professionalInfo.experience_years,
            qualification: professionalInfo.qualification,
            about: professionalInfo.about,
            consultation_fee: professionalInfo.consultation_fee,
            available_days: [],
            available_hours: {}
          });
          
        error = insertError;
      }
      
      if (error) throw error;
      
      // Find the selected specialty name
      const selectedSpecialty = specialties.find(s => s.id === professionalInfo.specialty_id);
      
      // Update the doctor profile state with new info
      if (doctorProfile) {
        setDoctorProfile({
          ...doctorProfile,
          doctor_profile: {
            ...(doctorProfile.doctor_profile || {}),
            specialty_id: professionalInfo.specialty_id,
            experience_years: professionalInfo.experience_years,
            qualification: professionalInfo.qualification,
            about: professionalInfo.about,
            consultation_fee: professionalInfo.consultation_fee,
            available_days: doctorProfile.doctor_profile?.available_days || [],
            available_hours: doctorProfile.doctor_profile?.available_hours || {}
          },
          specialty: selectedSpecialty ? {
            id: selectedSpecialty.id,
            name: selectedSpecialty.name
          } : undefined
        });
      }
      
      setProfessionalInfoDialog(false);
      
      toast({
        title: "Success",
        description: "Professional information updated"
      });
    } catch (error) {
      console.error("Error updating professional info:", error);
      toast({
        title: "Error",
        description: "Failed to update professional information",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  const saveAvailabilityDay = async () => {
    if (!editAvailabilityDay) return;
    
    setLoading(true);
    try {
      // Get the existing available_hours object
      const { data, error: fetchError } = await supabase
        .from('doctor_profiles')
        .select('available_hours, available_days')
        .eq('id', user!.id)
        .single();
        
      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;
      
      // Prepare the updated availability data
      const availableHours = data?.available_hours as Record<string, string[]> || {};
      const availableDays = data?.available_days as string[] || [];
      
      // Update the slots for the current day
      availableHours[editAvailabilityDay] = daySlots;
      
      // Update the available days list
      let updatedAvailableDays = [...availableDays];
      if (daySlots.length > 0 && !availableDays.includes(editAvailabilityDay)) {
        updatedAvailableDays.push(editAvailabilityDay);
      } else if (daySlots.length === 0 && availableDays.includes(editAvailabilityDay)) {
        updatedAvailableDays = updatedAvailableDays.filter(day => day !== editAvailabilityDay);
      }
      
      // Check if doctor profile exists
      let updateError;
      if (data) {
        // Update existing profile
        const { error } = await supabase
          .from('doctor_profiles')
          .update({
            available_hours: availableHours,
            available_days: updatedAvailableDays
          })
          .eq('id', user!.id);
          
        updateError = error;
      } else {
        // Create new profile with basic defaults
        const { error } = await supabase
          .from('doctor_profiles')
          .insert({
            id: user!.id,
            specialty_id: null,
            experience_years: 0,
            qualification: '',
            about: '',
            consultation_fee: 0,
            available_days: updatedAvailableDays,
            available_hours: availableHours
          });
          
        updateError = error;
      }
      
      if (updateError) throw updateError;
      
      // Update the local state
      const updatedSlots = availabilitySlots.map(daySlot => {
        if (daySlot.day === editAvailabilityDay) {
          return {
            ...daySlot,
            slots: [...daySlots]
          };
        }
        return daySlot;
      });
      
      setAvailabilitySlots(updatedSlots);
      
      if (doctorProfile) {
        setDoctorProfile({
          ...doctorProfile,
          doctor_profile: {
            ...(doctorProfile.doctor_profile || {}),
            available_days: updatedAvailableDays,
            available_hours: availableHours,
            specialty_id: doctorProfile.doctor_profile?.specialty_id || '',
            experience_years: doctorProfile.doctor_profile?.experience_years || 0,
            qualification: doctorProfile.doctor_profile?.qualification || '',
            about: doctorProfile.doctor_profile?.about || '',
            consultation_fee: doctorProfile.doctor_profile?.consultation_fee || 0
          }
        });
      }
      
      setAvailabilityDialog(false);
      setEditAvailabilityDay(null);
      
      toast({
        title: "Success",
        description: `Availability for ${editAvailabilityDay} updated`
      });
    } catch (error) {
      console.error("Error updating availability:", error);
      toast({
        title: "Error",
        description: "Failed to update availability",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  const addTimeSlot = () => {
    if (!newSlot || daySlots.includes(newSlot)) return;
    
    // Sort the slots by time
    const updatedSlots = [...daySlots, newSlot].sort((a, b) => {
      return new Date(`01/01/2023 ${a}`).getTime() - new Date(`01/01/2023 ${b}`).getTime();
    });
    
    setDaySlots(updatedSlots);
    setNewSlot('');
  };
  
  const removeTimeSlot = (slot: string) => {
    setDaySlots(daySlots.filter(s => s !== slot));
  };
  
  const handleEditDay = (day: string) => {
    const dayData = availabilitySlots.find(d => d.day === day);
    setDaySlots(dayData?.slots || []);
    setEditAvailabilityDay(day);
    setAvailabilityDialog(true);
  };

  const formattedDate = format(new Date(), "EEEE, MMMM d");
  
  if (loading && !doctorProfile) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-[#004953] via-[#006064] to-[#00363a]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00C389]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#004953] via-[#006064] to-[#00363a] pb-24">
      <div className="w-full max-w-[375px] mx-auto px-5">
        {/* Header */}
        <div className="flex justify-between items-center w-full py-2.5 mt-5">
          <button 
            onClick={() => navigate(-1)} 
            className="bg-transparent border-0 text-white text-2xl cursor-pointer"
          >
            <ArrowLeft size={24} />
          </button>
          <h2 className="text-xl font-bold text-white">Profile</h2>
          <div className="w-6"></div> {/* Spacer for alignment */}
        </div>
        
        {/* Profile Info */}
        <div className="w-full flex flex-col items-center mt-6 mb-8">
          <div className="w-[100px] h-[100px] rounded-full bg-white flex items-center justify-center mb-4 relative shadow-lg">
            {/* Profile image or placeholder */}
            <User size={50} className="text-[#00C389]" />
            <div className="absolute bottom-0 right-0 bg-[#00C389] text-white w-[30px] h-[30px] rounded-full flex items-center justify-center cursor-pointer shadow">
              <Edit size={16} />
            </div>
          </div>
          
          <h2 className="text-2xl font-medium mb-1 text-white">Dr. {doctorProfile?.full_name}</h2>
          <span className="text-base text-white/80 mb-5 px-4 py-1 bg-[rgba(0,195,137,0.2)] rounded-[20px]">
            {doctorProfile?.specialty?.name || 'Doctor'}
          </span>
        </div>
        
        {/* Personal Information */}
        <div className="bg-white rounded-[15px] p-5 mb-5 text-gray-800 shadow-lg w-full">
          <h3 className="text-lg font-medium mb-4 text-[#004953]">Personal Information</h3>
          
          <div className="flex items-center mb-4">
            <div className="w-[40px] h-[40px] rounded-[10px] bg-[rgba(0,195,137,0.1)] flex items-center justify-center mr-4">
              <User className="text-[#00C389]" size={20} />
            </div>
            <div className="flex-grow">
              <p className="text-sm text-gray-500 mb-0.5">Full Name</p>
              <p className="text-base font-medium">{doctorProfile?.full_name}</p>
            </div>
          </div>
          
          <div className="flex items-center mb-4">
            <div className="w-[40px] h-[40px] rounded-[10px] bg-[rgba(0,195,137,0.1)] flex items-center justify-center mr-4">
              <Mail className="text-[#00C389]" size={20} />
            </div>
            <div className="flex-grow">
              <p className="text-sm text-gray-500 mb-0.5">Email</p>
              <p className="text-base font-medium">{doctorProfile?.email}</p>
            </div>
          </div>
          
          <div className="flex items-center mb-0">
            <div className="w-[40px] h-[40px] rounded-[10px] bg-[rgba(0,195,137,0.1)] flex items-center justify-center mr-4">
              <Phone className="text-[#00C389]" size={20} />
            </div>
            <div className="flex-grow">
              <p className="text-sm text-gray-500 mb-0.5">Phone</p>
              <p className="text-base font-medium">{doctorProfile?.phone || 'Not provided'}</p>
            </div>
            <button 
              onClick={() => setPersonalInfoDialog(true)}
              className="text-[#00C389] cursor-pointer"
            >
              <Edit size={16} />
            </button>
          </div>
        </div>
        
        {/* Professional Information */}
        <div className="bg-white rounded-[15px] p-5 mb-5 text-gray-800 shadow-lg w-full">
          <h3 className="text-lg font-medium mb-4 text-[#004953]">Professional Information</h3>
          
          <div className="flex items-center mb-4">
            <div className="w-[40px] h-[40px] rounded-[10px] bg-[rgba(0,195,137,0.1)] flex items-center justify-center mr-4">
              <Award className="text-[#00C389]" size={20} />
            </div>
            <div className="flex-grow">
              <p className="text-sm text-gray-500 mb-0.5">Specialty</p>
              <p className="text-base font-medium">{doctorProfile?.specialty?.name || 'Not specified'}</p>
            </div>
          </div>
          
          <div className="flex items-center mb-4">
            <div className="w-[40px] h-[40px] rounded-[10px] bg-[rgba(0,195,137,0.1)] flex items-center justify-center mr-4">
              <FileText className="text-[#00C389]" size={20} />
            </div>
            <div className="flex-grow">
              <p className="text-sm text-gray-500 mb-0.5">Qualification</p>
              <p className="text-base font-medium">{doctorProfile?.doctor_profile?.qualification || 'Not specified'}</p>
            </div>
          </div>
          
          <div className="flex items-center mb-4">
            <div className="w-[40px] h-[40px] rounded-[10px] bg-[rgba(0,195,137,0.1)] flex items-center justify-center mr-4">
              <Calendar className="text-[#00C389]" size={20} />
            </div>
            <div className="flex-grow">
              <p className="text-sm text-gray-500 mb-0.5">Experience</p>
              <p className="text-base font-medium">{doctorProfile?.doctor_profile?.experience_years || 0} years</p>
            </div>
          </div>
          
          <div className="flex items-center mb-0">
            <div className="w-[40px] h-[40px] rounded-[10px] bg-[rgba(0,195,137,0.1)] flex items-center justify-center mr-4">
              <User className="text-[#00C389]" size={20} />
            </div>
            <div className="flex-grow">
              <p className="text-sm text-gray-500 mb-0.5">Consultation Fee</p>
              <p className="text-base font-medium">₹{doctorProfile?.doctor_profile?.consultation_fee || 0}</p>
            </div>
            <button 
              onClick={() => setProfessionalInfoDialog(true)}
              className="text-[#00C389] cursor-pointer"
            >
              <Edit size={16} />
            </button>
          </div>
        </div>
        
        {/* Availability */}
        <div className="bg-white rounded-[15px] p-5 mb-5 text-gray-800 shadow-lg w-full">
          <h3 className="text-lg font-medium mb-4 text-[#004953]">Availability</h3>
          
          {availabilitySlots.map((daySlot) => (
            <div key={daySlot.day} className="flex items-center justify-between mb-3 py-2 border-b border-gray-100 last:border-0 last:mb-0">
              <p className="text-base font-medium">{daySlot.day}</p>
              <div className="flex items-center">
                {daySlot.slots.length > 0 ? (
                  <span className="text-sm text-gray-600 mr-3">{daySlot.slots.length} slots</span>
                ) : (
                  <span className="text-sm text-gray-400 mr-3">Not available</span>
                )}
                <button 
                  onClick={() => handleEditDay(daySlot.day)}
                  className="text-[#00C389] cursor-pointer"
                >
                  <Edit size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
        
        {/* Settings */}
        <div className="bg-white rounded-[15px] p-5 mb-5 text-gray-800 shadow-lg w-full">
          <h3 className="text-lg font-medium mb-4 text-[#004953]">Settings</h3>
          
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="w-[40px] h-[40px] rounded-[10px] bg-[rgba(0,195,137,0.1)] flex items-center justify-center mr-4">
                <Settings className="text-[#00C389]" size={20} />
              </div>
              <p className="text-base font-medium">Available for Booking</p>
            </div>
            <Switch 
              checked={availableForBooking}
              onCheckedChange={setAvailableForBooking}
              className="data-[state=checked]:bg-[#00C389]"
            />
          </div>
          
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="w-[40px] h-[40px] rounded-[10px] bg-[rgba(0,195,137,0.1)] flex items-center justify-center mr-4">
                <Settings className="text-[#00C389]" size={20} />
              </div>
              <p className="text-base font-medium">Notifications</p>
            </div>
            <Switch 
              checked={notificationsEnabled}
              onCheckedChange={setNotificationsEnabled}
              className="data-[state=checked]:bg-[#00C389]"
            />
          </div>
          
          <button 
            onClick={handleLogout}
            className="flex items-center text-red-600 mt-4 cursor-pointer"
          >
            <LogOut size={20} className="mr-2" />
            <span>Logout</span>
          </button>
        </div>
      </div>
      
      {/* Edit Personal Info Dialog */}
      <Dialog open={personalInfoDialog} onOpenChange={setPersonalInfoDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Personal Information</DialogTitle>
            <DialogDescription>
              Update your personal information here.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="full_name" className="text-sm font-medium">Full Name</label>
              <Input
                id="full_name"
                value={personalInfo.full_name}
                onChange={(e) => setPersonalInfo({...personalInfo, full_name: e.target.value})}
                placeholder="Enter your full name"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="phone" className="text-sm font-medium">Phone</label>
              <Input
                id="phone"
                value={personalInfo.phone}
                onChange={(e) => setPersonalInfo({...personalInfo, phone: e.target.value})}
                placeholder="Enter your phone number"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setPersonalInfoDialog(false)}
              className="mr-2"
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              onClick={updatePersonalInfo}
              disabled={loading}
              className="bg-[#00C389] hover:bg-[#00A070] text-white border-none"
            >
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Professional Info Dialog */}
      <Dialog open={professionalInfoDialog} onOpenChange={setProfessionalInfoDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Professional Information</DialogTitle>
            <DialogDescription>
              Update your professional details here.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="specialty" className="text-sm font-medium">Specialty</label>
              <Select
                value={professionalInfo.specialty_id}
                onValueChange={(value) => setProfessionalInfo({...professionalInfo, specialty_id: value})}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select your specialty" />
                </SelectTrigger>
                <SelectContent>
                  {specialties.map((specialty) => (
                    <SelectItem key={specialty.id} value={specialty.id}>{specialty.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label htmlFor="qualification" className="text-sm font-medium">Qualification</label>
              <Input
                id="qualification"
                value={professionalInfo.qualification}
                onChange={(e) => setProfessionalInfo({...professionalInfo, qualification: e.target.value})}
                placeholder="E.g., MBBS, MD"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="experience" className="text-sm font-medium">Experience (years)</label>
              <Input
                id="experience"
                type="number"
                value={professionalInfo.experience_years}
                onChange={(e) => setProfessionalInfo({...professionalInfo, experience_years: parseInt(e.target.value) || 0})}
                placeholder="Years of experience"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="about" className="text-sm font-medium">About</label>
              <Textarea
                id="about"
                value={professionalInfo.about}
                onChange={(e) => setProfessionalInfo({...professionalInfo, about: e.target.value})}
                placeholder="Brief description about yourself"
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="fee" className="text-sm font-medium">Consultation Fee (₹)</label>
              <Input
                id="fee"
                type="number"
                value={professionalInfo.consultation_fee}
                onChange={(e) => setProfessionalInfo({...professionalInfo, consultation_fee: parseInt(e.target.value) || 0})}
                placeholder="Enter consultation fee"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setProfessionalInfoDialog(false)}
              className="mr-2"
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              onClick={updateProfessionalInfo}
              disabled={loading}
              className="bg-[#00C389] hover:bg-[#00A070] text-white border-none"
            >
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Availability Dialog */}
      <Dialog open={availabilityDialog} onOpenChange={setAvailabilityDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit {editAvailabilityDay} Availability</DialogTitle>
            <DialogDescription>
              Add and manage your available time slots.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex space-x-2">
              <Input
                type="time"
                value={newSlot}
                onChange={(e) => setNewSlot(e.target.value)}
                placeholder="Add time slot"
              />
              <Button 
                type="button" 
                onClick={addTimeSlot}
                className="bg-[#00C389] hover:bg-[#00A070] text-white border-none"
              >
                <Plus size={16} />
              </Button>
            </div>
            
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {daySlots.length === 0 ? (
                <p className="text-gray-400 text-sm">No time slots added yet</p>
              ) : (
                daySlots.map((slot) => (
                  <div key={slot} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                    <span>{slot}</span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => removeTimeSlot(slot)}
                      className="h-8 w-8 p-0 text-red-500"
                    >
                      <Trash size={16} />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setAvailabilityDialog(false)}
              className="mr-2"
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              onClick={saveAvailabilityDay}
              disabled={loading}
              className="bg-[#00C389] hover:bg-[#00A070] text-white border-none"
            >
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BottomNavigation />
    </div>
  );
}
