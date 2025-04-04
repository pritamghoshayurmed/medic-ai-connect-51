
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronLeft, User, Calendar, Clock, Settings, Bell, LogOut, ChevronRight } from "lucide-react";
import BottomNavigation from "@/components/BottomNavigation";
import { useAuth } from "@/contexts/AuthContext";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";

export default function DoctorProfile() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [availableForBooking, setAvailableForBooking] = useState(true);
  
  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // Availability slots for the week
  const availabilitySlots = [
    { day: "Monday", slots: ["9:00 AM - 1:00 PM", "2:00 PM - 5:00 PM"] },
    { day: "Tuesday", slots: ["9:00 AM - 1:00 PM", "2:00 PM - 5:00 PM"] },
    { day: "Wednesday", slots: ["9:00 AM - 1:00 PM"] },
    { day: "Thursday", slots: ["9:00 AM - 1:00 PM", "2:00 PM - 5:00 PM"] },
    { day: "Friday", slots: ["9:00 AM - 1:00 PM", "2:00 PM - 5:00 PM"] },
    { day: "Saturday", slots: ["9:00 AM - 12:00 PM"] },
    { day: "Sunday", slots: [] },
  ];

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
          <p className="text-gray-600">Cardiologist</p>
          <p className="text-gray-600">10 years experience</p>
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
                      <Button variant="ghost" size="sm">Edit</Button>
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
              
              <Button className="w-full mt-4">Update Availability</Button>
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
                  <p>Cardiologist</p>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-gray-600">Experience</p>
                  <p>10 years</p>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-gray-600">Hospital</p>
                  <p>City Medical Center</p>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-gray-600">License No.</p>
                  <p>MED12345678</p>
                </div>
                <Button variant="outline" size="sm" className="w-full mt-2">
                  Edit Professional Info
                </Button>
              </div>
            </div>
            
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
                  Edit Personal Info
                </Button>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h3 className="font-semibold mb-3">Education & Certification</h3>
              <div className="space-y-3">
                <div>
                  <p className="font-medium">Medical School</p>
                  <p className="text-sm text-gray-600">Harvard Medical School, 2010</p>
                </div>
                <div>
                  <p className="font-medium">Residency</p>
                  <p className="text-sm text-gray-600">Mayo Clinic, Cardiology, 2014</p>
                </div>
                <div>
                  <p className="font-medium">Board Certification</p>
                  <p className="text-sm text-gray-600">American Board of Cardiology, 2015</p>
                </div>
                <Button variant="outline" size="sm" className="w-full mt-2">
                  Update Credentials
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
                    <p className="text-sm text-gray-500">Get notified about new messages</p>
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
              <h3 className="font-semibold mb-3">Security</h3>
              <div className="space-y-3">
                <Button variant="outline" size="sm" className="w-full flex justify-between items-center">
                  <span>Change Password</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" className="w-full flex justify-between items-center">
                  <span>Two-Factor Authentication</span>
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
