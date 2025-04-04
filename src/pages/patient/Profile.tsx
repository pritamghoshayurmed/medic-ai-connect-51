
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronLeft, User, Settings, Bell, LogOut, ChevronRight } from "lucide-react";
import BottomNavigation from "@/components/BottomNavigation";
import { useAuth } from "@/contexts/AuthContext";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function PatientProfile() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [reminderAlerts, setReminderAlerts] = useState(true);
  const [appointmentReminders, setAppointmentReminders] = useState(true);
  
  const handleLogout = () => {
    logout();
    navigate("/");
  };

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
          <h2 className="text-xl font-bold">{user?.name}</h2>
          <p className="text-gray-600">{user?.email}</p>
          <p className="text-gray-600">{user?.phone}</p>
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
              <h3 className="font-semibold mb-3">Personal Information</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <p className="text-gray-600">Full Name</p>
                  <p>{user?.name}</p>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-gray-600">Email</p>
                  <p>{user?.email}</p>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-gray-600">Phone</p>
                  <p>{user?.phone}</p>
                </div>
                <Button variant="outline" size="sm" className="w-full mt-2">
                  Edit Profile
                </Button>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h3 className="font-semibold mb-3">Medical Information</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <p className="text-gray-600">Blood Type</p>
                  <p>A+</p>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-gray-600">Allergies</p>
                  <p>None</p>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-gray-600">Chronic Conditions</p>
                  <p>None</p>
                </div>
                <Button variant="outline" size="sm" className="w-full mt-2">
                  Update Medical Info
                </Button>
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

      <BottomNavigation />
    </div>
  );
}
