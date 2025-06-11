import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { ChevronLeft, Camera, Settings, User, Bell, Lock, HelpCircle, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { BottomNavigation } from "@/components/BottomNavigation";
import { toast } from "sonner";

export default function Profile() {
  const { user, signOut, updateUserData } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    full_name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    date_of_birth: user?.dateOfBirth || '',
    gender: user?.gender || '',
    blood_group: user?.bloodGroup || '',
    address: user?.address || '',
    emergency_contact: user?.emergencyContact || ''
  });
  
  const [notifications, setNotifications] = useState({
    appointments: true,
    reminders: true,
    messages: true,
    promotions: false
  });

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (error) {
          console.error('Error fetching profile:', error);
          return;
        }
        
        if (data) {
          setProfile({
            full_name: data.full_name || '',
            email: data.email || '',
            phone: data.phone || '',
            date_of_birth: data.date_of_birth || '',
            gender: data.gender || '',
            blood_group: data.blood_group || '',
            address: data.address || '',
            emergency_contact: data.emergency_contact || ''
          });
        }
      } catch (error) {
        console.error('Error:', error);
      }
    };
    
    fetchProfile();
  }, [user?.id]);
  
  const handleUpdateProfile = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profile.full_name,
          phone: profile.phone,
          date_of_birth: profile.date_of_birth,
          gender: profile.gender,
          blood_group: profile.blood_group,
          address: profile.address,
          emergency_contact: profile.emergency_contact
        })
        .eq('id', user.id);
        
      if (error) {
        toast.error("Failed to update profile");
        console.error('Error updating profile:', error);
        return;
      }
      
      // Update local user context
      updateUserData({
        ...user,
        name: profile.full_name,
        phone: profile.phone,
        dateOfBirth: profile.date_of_birth,
        gender: profile.gender,
        bloodGroup: profile.blood_group,
        address: profile.address,
        emergencyContact: profile.emergency_contact
      });
      
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error('Error:', error);
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };
  
  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#004953] via-[#006064] to-[#00363a] pb-24">
      <div className="w-full max-w-[425px] mx-auto px-5">
        {/* Header */}
        <div className="flex items-center pt-5 pb-4">
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-white mr-2" 
            onClick={() => navigate(-1)}
          >
            <ChevronLeft size={24} />
          </Button>
          <h1 className="text-xl font-bold text-white">My Profile</h1>
        </div>
        
        {/* Profile Overview Card */}
        <Card className="mb-5 shadow-lg border-0">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Avatar className="h-20 w-20 border-2 border-[#00C389]">
                  <AvatarFallback className="bg-[#004953]/10 text-[#004953] text-xl">
                    {profile.full_name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                  {user?.profilePic && <AvatarImage src={user.profilePic} alt={profile.full_name} />}
                </Avatar>
                <Button size="icon" className="absolute bottom-0 right-0 h-7 w-7 bg-[#00C389] hover:bg-[#00A070]">
                  <Camera size={14} />
                </Button>
              </div>
              <div className="space-y-1">
                <h2 className="font-semibold text-lg text-[#004953]">{profile.full_name}</h2>
                <p className="text-sm text-gray-500">{profile.email}</p>
                <p className="text-xs text-gray-400">{profile.phone || "No phone number added"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Profile Tabs */}
        <Tabs defaultValue="personal" className="mb-5">
          <TabsList className="grid grid-cols-2 bg-[#00363a]/10 border border-white/10 rounded-lg">
            <TabsTrigger value="personal" className="rounded-md data-[state=active]:bg-white data-[state=active]:text-[#004953]">
              Personal Info
            </TabsTrigger>
            <TabsTrigger value="settings" className="rounded-md data-[state=active]:bg-white data-[state=active]:text-[#004953]">
              Settings
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="personal" className="mt-4">
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name" className="text-[#004953]">Full Name</Label>
                  <Input 
                    id="full_name" 
                    value={profile.full_name}
                    onChange={(e) => setProfile({...profile, full_name: e.target.value})}
                    className="border-gray-200 focus-visible:ring-[#00C389]"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-[#004953]">Email</Label>
                  <Input 
                    id="email" 
                    value={profile.email}
                    disabled
                    className="border-gray-200 bg-gray-50"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-[#004953]">Phone Number</Label>
                  <Input 
                    id="phone" 
                    value={profile.phone}
                    onChange={(e) => setProfile({...profile, phone: e.target.value})}
                    className="border-gray-200 focus-visible:ring-[#00C389]"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="date_of_birth" className="text-[#004953]">Date of Birth</Label>
                  <Input 
                    id="date_of_birth" 
                    type="date" 
                    value={profile.date_of_birth}
                    onChange={(e) => setProfile({...profile, date_of_birth: e.target.value})}
                    className="border-gray-200 focus-visible:ring-[#00C389]"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="gender" className="text-[#004953]">Gender</Label>
                  <select
                    id="gender"
                    value={profile.gender}
                    onChange={(e) => setProfile({...profile, gender: e.target.value})}
                    className="w-full rounded-md border border-gray-200 p-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#00C389]"
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="blood_group" className="text-[#004953]">Blood Group</Label>
                  <select
                    id="blood_group"
                    value={profile.blood_group}
                    onChange={(e) => setProfile({...profile, blood_group: e.target.value})}
                    className="w-full rounded-md border border-gray-200 p-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#00C389]"
                  >
                    <option value="">Select Blood Group</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="address" className="text-[#004953]">Address</Label>
                  <Input 
                    id="address" 
                    value={profile.address}
                    onChange={(e) => setProfile({...profile, address: e.target.value})}
                    className="border-gray-200 focus-visible:ring-[#00C389]"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="emergency_contact" className="text-[#004953]">Emergency Contact</Label>
                  <Input 
                    id="emergency_contact" 
                    value={profile.emergency_contact}
                    onChange={(e) => setProfile({...profile, emergency_contact: e.target.value})}
                    className="border-gray-200 focus-visible:ring-[#00C389]"
                  />
                </div>
                
                <Button 
                  className="w-full bg-[#00C389] hover:bg-[#00A070] mt-4"
                  onClick={handleUpdateProfile}
                  disabled={loading}
                >
                  {loading ? "Updating..." : "Update Profile"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="settings" className="mt-4">
            <Card className="border-0 shadow-lg mb-5">
              <CardHeader className="pb-2">
                <h3 className="font-medium text-[#004953]">Notification Settings</h3>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#004953]">Appointment Reminders</p>
                    <p className="text-xs text-gray-500">Receive reminders about upcoming appointments</p>
                  </div>
                  <Switch 
                    checked={notifications.appointments}
                    onCheckedChange={(checked) => setNotifications({...notifications, appointments: checked})}
                    className="data-[state=checked]:bg-[#00C389]"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#004953]">Medication Reminders</p>
                    <p className="text-xs text-gray-500">Get alerts when it's time to take your medication</p>
                  </div>
                  <Switch 
                    checked={notifications.reminders}
                    onCheckedChange={(checked) => setNotifications({...notifications, reminders: checked})}
                    className="data-[state=checked]:bg-[#00C389]"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#004953]">Messages</p>
                    <p className="text-xs text-gray-500">Get notified when you receive new messages</p>
                  </div>
                  <Switch 
                    checked={notifications.messages}
                    onCheckedChange={(checked) => setNotifications({...notifications, messages: checked})}
                    className="data-[state=checked]:bg-[#00C389]"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#004953]">Promotions</p>
                    <p className="text-xs text-gray-500">Receive updates about new features and offers</p>
                  </div>
                  <Switch 
                    checked={notifications.promotions}
                    onCheckedChange={(checked) => setNotifications({...notifications, promotions: checked})}
                    className="data-[state=checked]:bg-[#00C389]"
                  />
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6 space-y-3">
                <Button variant="ghost" className="w-full justify-start text-[#004953] hover:bg-gray-100">
                  <Lock className="h-4 w-4 mr-3 text-gray-500" />
                  Change Password
                </Button>
                
                <Button variant="ghost" className="w-full justify-start text-[#004953] hover:bg-gray-100">
                  <HelpCircle className="h-4 w-4 mr-3 text-gray-500" />
                  Help & Support
                </Button>
                
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4 mr-3" />
                  Log Out
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      <BottomNavigation />
    </div>
  );
}
