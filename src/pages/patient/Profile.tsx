
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronLeft, User, Calendar, Phone, Mail, LogOut, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import BottomNavigation from "@/components/BottomNavigation";

export default function PatientProfile() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, logout } = useAuth();
  
  const [profileData, setProfileData] = useState({
    fullName: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    dateOfBirth: '',
    gender: '',
    bloodGroup: '',
    allergies: [],
    medicalConditions: []
  });
  
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!user) return;
    
    const fetchProfile = async () => {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('patients')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (error && error.code !== 'PGRST116') {
          // PGRST116 means no rows returned, which is fine for new users
          console.error("Error fetching patient profile:", error);
        }
        
        if (data) {
          setProfileData({
            fullName: user.name || '',
            email: user.email || '',
            phone: user.phone || '',
            dateOfBirth: data.date_of_birth || '',
            gender: data.gender || '',
            bloodGroup: data.blood_group || '',
            allergies: data.allergies || [],
            medicalConditions: data.medical_conditions || []
          });
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfile();
  }, [user]);
  
  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "Logout failed",
        description: "There was a problem logging out. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="bg-white shadow p-4 flex items-center">
        <Button variant="ghost" size="icon" className="mr-2" onClick={() => navigate(-1)}>
          <ChevronLeft />
        </Button>
        <h1 className="text-xl font-bold">My Profile</h1>
      </div>
      
      {/* Profile Header */}
      <div className="bg-primary text-white p-6 flex items-center">
        <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center mr-4">
          <User className="w-10 h-10 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold">{profileData.fullName}</h2>
          <p className="opacity-90">Patient</p>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          className="ml-auto text-white hover:text-white hover:bg-primary/80"
          onClick={() => navigate("/patient/edit-profile")}
        >
          <Edit className="w-5 h-5" />
        </Button>
      </div>
      
      {/* Profile Details */}
      <div className="p-4 space-y-6">
        <div>
          <h3 className="font-semibold text-gray-700 mb-3">Personal Information</h3>
          <div className="bg-white rounded-lg p-4 shadow-sm space-y-4">
            <div className="flex">
              <Mail className="w-5 h-5 text-gray-500 mr-3" />
              <div>
                <p className="text-gray-500 text-sm">Email</p>
                <p>{profileData.email}</p>
              </div>
            </div>
            <div className="flex">
              <Phone className="w-5 h-5 text-gray-500 mr-3" />
              <div>
                <p className="text-gray-500 text-sm">Phone</p>
                <p>{profileData.phone || 'Not provided'}</p>
              </div>
            </div>
            <div className="flex">
              <Calendar className="w-5 h-5 text-gray-500 mr-3" />
              <div>
                <p className="text-gray-500 text-sm">Date of Birth</p>
                <p>{profileData.dateOfBirth || 'Not provided'}</p>
              </div>
            </div>
            <div className="flex">
              <User className="w-5 h-5 text-gray-500 mr-3" />
              <div>
                <p className="text-gray-500 text-sm">Gender</p>
                <p>{profileData.gender || 'Not provided'}</p>
              </div>
            </div>
          </div>
        </div>
        
        <div>
          <h3 className="font-semibold text-gray-700 mb-3">Medical Information</h3>
          <div className="bg-white rounded-lg p-4 shadow-sm space-y-4">
            <div>
              <p className="text-gray-500 text-sm">Blood Group</p>
              <p>{profileData.bloodGroup || 'Not provided'}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Allergies</p>
              {profileData.allergies && profileData.allergies.length > 0 ? (
                <ul className="list-disc pl-5">
                  {profileData.allergies.map((allergy, index) => (
                    <li key={index}>{allergy}</li>
                  ))}
                </ul>
              ) : (
                <p>None</p>
              )}
            </div>
            <div>
              <p className="text-gray-500 text-sm">Medical Conditions</p>
              {profileData.medicalConditions && profileData.medicalConditions.length > 0 ? (
                <ul className="list-disc pl-5">
                  {profileData.medicalConditions.map((condition, index) => (
                    <li key={index}>{condition}</li>
                  ))}
                </ul>
              ) : (
                <p>None</p>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Logout Button */}
      <div className="px-4 mt-6">
        <Button 
          variant="outline" 
          className="w-full border-red-500 text-red-500 hover:bg-red-50" 
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>
      
      <BottomNavigation />
    </div>
  );
}
