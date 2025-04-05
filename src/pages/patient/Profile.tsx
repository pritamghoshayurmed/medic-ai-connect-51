
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronLeft, User, Settings, Bell, LogOut, ChevronRight, Edit } from "lucide-react";
import BottomNavigation from "@/components/BottomNavigation";
import { useAuth } from "@/contexts/AuthContext";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PatientProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  medical_info?: {
    blood_type: string;
    allergies: string[];
    chronic_conditions: string[];
  };
}

export default function PatientProfile() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [patientProfile, setPatientProfile] = useState<PatientProfile>({
    id: '',
    name: '',
    email: '',
    phone: '',
    role: 'patient'
  });
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [reminderAlerts, setReminderAlerts] = useState(true);
  const [appointmentReminders, setAppointmentReminders] = useState(true);
  
  // Edit modals
  const [personalInfoDialog, setPersonalInfoDialog] = useState(false);
  const [medicalInfoDialog, setMedicalInfoDialog] = useState(false);
  
  // Form states
  const [personalInfo, setPersonalInfo] = useState({
    full_name: '',
    phone: ''
  });
  
  const [medicalInfo, setMedicalInfo] = useState({
    blood_type: '',
    allergies: '',
    chronic_conditions: ''
  });
  
  // Blood type options
  const bloodTypes = [
    "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"
  ];
  
  useEffect(() => {
    if (!user) return;
    
    const fetchPatientProfile = async () => {
      setLoading(true);
      try {
        // Fetch patient profile
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
        
        if (profileError) throw profileError;
        
        // Set patient profile
        const patientData: PatientProfile = {
          id: profileData.id,
          name: profileData.full_name,
          email: profileData.email,
          phone: profileData.phone || '',
          role: profileData.role
        };
        
        // Separately fetch patient_profiles data
        const { data: medicalData, error: medicalError } = await supabase
          .from('patient_profiles')
          .select(`
            blood_type,
            allergies,
            chronic_conditions
          `)
          .eq('id', user.id)
          .single();
        
        if (!medicalError && medicalData) {
          patientData.medical_info = {
            blood_type: medicalData.blood_type || '',
            allergies: medicalData.allergies || [],
            chronic_conditions: medicalData.chronic_conditions || []
          };
        }
        
        setPatientProfile(patientData);
        
        // Set form states
        setPersonalInfo({
          full_name: profileData.full_name,
          phone: profileData.phone || ''
        });
        
        if (!medicalError && medicalData) {
          setMedicalInfo({
            blood_type: medicalData.blood_type || '',
            allergies: (medicalData.allergies || []).join(', '),
            chronic_conditions: (medicalData.chronic_conditions || []).join(', ')
          });
        }
        
      } catch (error) {
        console.error("Error fetching patient profile:", error);
        toast({
          title: "Error",
          description: "Failed to load your profile information",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchPatientProfile();
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
      setPatientProfile({
        ...patientProfile,
        name: personalInfo.full_name,
        phone: personalInfo.phone
      });
      
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
  
  const updateMedicalInfo = async () => {
    if (!user) return;
    
    try {
      // Process string inputs to arrays
      const allergiesArray = medicalInfo.allergies
        .split(',')
        .map(item => item.trim())
        .filter(item => item !== '');
      
      const conditionsArray = medicalInfo.chronic_conditions
        .split(',')
        .map(item => item.trim())
        .filter(item => item !== '');
      
      // Check if patient_profiles entry exists
      const { data, error: checkError } = await supabase
        .from('patient_profiles')
        .select('id')
        .eq('id', user.id);
      
      if (checkError) throw checkError;
      
      let updateError;
      
      if (data && data.length > 0) {
        // Update existing profile using direct table access
        const { error } = await supabase
          .from('patient_profiles')
          .update({
            blood_type: medicalInfo.blood_type,
            allergies: allergiesArray,
            chronic_conditions: conditionsArray
          })
          .eq('id', user.id);
        
        updateError = error;
      } else {
        // Create new profile using direct table access
        const { error } = await supabase
          .from('patient_profiles')
          .insert({
            id: user.id,
            blood_type: medicalInfo.blood_type,
            allergies: allergiesArray,
            chronic_conditions: conditionsArray
          });
        
        updateError = error;
      }
      
      if (updateError) throw updateError;
      
      // Update local state
      setPatientProfile({
        ...patientProfile,
        medical_info: {
          blood_type: medicalInfo.blood_type,
          allergies: allergiesArray,
          chronic_conditions: conditionsArray
        }
      });
      
      toast({
        title: "Medical Info Updated",
        description: "Your medical information has been updated successfully"
      });
      
      setMedicalInfoDialog(false);
    } catch (error) {
      console.error("Error updating medical info:", error);
      toast({
        title: "Update Failed",
        description: "There was an error updating your medical information",
        variant: "destructive"
      });
    }
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
          <h2 className="text-xl font-bold">{patientProfile?.full_name}</h2>
          <p className="text-gray-600">{patientProfile?.email}</p>
          <p className="text-gray-600">{patientProfile?.phone || 'No phone number'}</p>
        </div>
      </div>

      <Separator />

      {/* Tabs for settings */}
      <Tabs defaultValue="account" className="w-full p-4">
        <TabsList className="grid grid-cols-2 w-full mb-4">
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        
        {/* Account Tab */}
        <TabsContent value="account">
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold">Personal Information</h3>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setPersonalInfoDialog(true)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <p className="text-gray-600">Full Name</p>
                  <p>{patientProfile?.full_name}</p>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-gray-600">Email</p>
                  <p>{patientProfile?.email}</p>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-gray-600">Phone</p>
                  <p>{patientProfile?.phone || 'Not provided'}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold">Medical Information</h3>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setMedicalInfoDialog(true)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <p className="text-gray-600">Blood Type</p>
                  <p>{patientProfile?.medical_info?.blood_type || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-gray-600 mb-1">Allergies</p>
                  {patientProfile?.medical_info?.allergies && patientProfile.medical_info.allergies.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {patientProfile.medical_info.allergies.map((allergy, idx) => (
                        <span key={idx} className="text-sm bg-gray-100 px-2 py-0.5 rounded">
                          {allergy}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm">None</p>
                  )}
                </div>
                <div>
                  <p className="text-gray-600 mb-1">Chronic Conditions</p>
                  {patientProfile?.medical_info?.chronic_conditions && patientProfile.medical_info.chronic_conditions.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {patientProfile.medical_info.chronic_conditions.map((condition, idx) => (
                        <span key={idx} className="text-sm bg-gray-100 px-2 py-0.5 rounded">
                          {condition}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm">None</p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h3 className="font-semibold mb-3">Emergency Contacts</h3>
              <Button variant="outline" size="sm" className="w-full">
                Add Emergency Contact
              </Button>
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
                    <Label htmlFor="reminders">Medication Reminders</Label>
                    <p className="text-sm text-gray-500">Alerts for your medications</p>
                  </div>
                  <Switch
                    id="reminders"
                    checked={reminderAlerts}
                    onCheckedChange={setReminderAlerts}
                    disabled={!notificationsEnabled}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="appointments">Appointment Reminders</Label>
                    <p className="text-sm text-gray-500">Alerts for upcoming appointments</p>
                  </div>
                  <Switch
                    id="appointments"
                    checked={appointmentReminders}
                    onCheckedChange={setAppointmentReminders}
                    disabled={!notificationsEnabled}
                  />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h3 className="font-semibold mb-3">Security</h3>
              <div className="space-y-3">
                <Button variant="outline" size="sm" className="w-full flex justify-between items-center">
                  <span>Change Password</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" className="w-full flex justify-between items-center">
                  <span>Privacy Settings</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h3 className="font-semibold mb-3">App Settings</h3>
              <div className="space-y-3">
                <Button variant="outline" size="sm" className="w-full flex justify-between items-center">
                  <span>Language</span>
                  <span className="text-gray-500">English</span>
                </Button>
                <Button variant="outline" size="sm" className="w-full flex justify-between items-center">
                  <span>Dark Mode</span>
                  <Switch id="dark-mode" />
                </Button>
              </div>
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
                value={patientProfile?.email || ''}
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
                placeholder="Enter your phone number"
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
      
      {/* Edit Medical Info Dialog */}
      <Dialog open={medicalInfoDialog} onOpenChange={setMedicalInfoDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Medical Information</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="blood-type">Blood Type</Label>
              <Select 
                value={medicalInfo.blood_type}
                onValueChange={(value) => setMedicalInfo({...medicalInfo, blood_type: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select blood type" />
                </SelectTrigger>
                <SelectContent>
                  {bloodTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="allergies">Allergies</Label>
              <Input
                id="allergies"
                value={medicalInfo.allergies}
                onChange={(e) => setMedicalInfo({...medicalInfo, allergies: e.target.value})}
                placeholder="Enter allergies separated by commas"
              />
              <p className="text-xs text-gray-500">Separate multiple allergies with commas</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="conditions">Chronic Conditions</Label>
              <Input
                id="conditions"
                value={medicalInfo.chronic_conditions}
                onChange={(e) => setMedicalInfo({...medicalInfo, chronic_conditions: e.target.value})}
                placeholder="Enter conditions separated by commas"
              />
              <p className="text-xs text-gray-500">Separate multiple conditions with commas</p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="secondary" onClick={() => setMedicalInfoDialog(false)}>
              Cancel
            </Button>
            <Button onClick={updateMedicalInfo}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BottomNavigation />
    </div>
  );
}
