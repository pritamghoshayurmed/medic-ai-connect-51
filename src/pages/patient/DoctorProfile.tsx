import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Calendar, Clock, Star, MapPin, Medal, User, Phone, Mail, CalendarClock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import BottomNavigation from "@/components/BottomNavigation";

interface DoctorProfile {
  id: string;
  name: string;
  specialty: string;
  experience: number;
  qualification: string;
  about: string;
  profilePic: string;
  rating: number;
  consultationFee: number;
  email: string;
  phone: string;
  availableDays: string[];
  availableHours: Record<string, string[]>;
}

export default function DoctorProfile() {
  const navigate = useNavigate();
  const params = useParams<{ id: string }>();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [doctor, setDoctor] = useState<DoctorProfile | null>(null);
  
  useEffect(() => {
    const fetchDoctorProfile = async () => {
      if (!params.id) return;
      
      try {
        setLoading(true);
        
        // Get the doctor's profile information
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select(`
            id,
            full_name,
            email,
            phone,
            doctor_profiles(
              specialty_id,
              experience_years,
              qualification,
              about,
              consultation_fee,
              available_days,
              available_hours
            )
          `)
          .eq('id', params.id)
          .eq('role', 'doctor')
          .single();
          
        if (profileError) {
          console.error("Error fetching doctor profile:", profileError);
          throw profileError;
        }
        
        if (!profileData) {
          throw new Error("Doctor not found");
        }
        
        // Get specialty information if available
        let specialty = "General Practitioner";
        if (profileData.doctor_profiles?.[0]?.specialty_id) {
          const { data: specialtyData } = await supabase
            .from('specialties')
            .select('name')
            .eq('id', profileData.doctor_profiles[0].specialty_id)
            .single();
            
          if (specialtyData) {
            specialty = specialtyData.name;
          }
        }
        
        // Format doctor profile data
        setDoctor({
          id: profileData.id,
          name: profileData.full_name,
          email: profileData.email || '',
          phone: profileData.phone || '',
          specialty: specialty,
          experience: profileData.doctor_profiles?.[0]?.experience_years || 0,
          qualification: profileData.doctor_profiles?.[0]?.qualification || '',
          about: profileData.doctor_profiles?.[0]?.about || 'No information provided',
          consultationFee: profileData.doctor_profiles?.[0]?.consultation_fee || 0,
          availableDays: profileData.doctor_profiles?.[0]?.available_days || [],
          availableHours: profileData.doctor_profiles?.[0]?.available_hours || {},
          profilePic: '/lovable-uploads/769f4117-004e-45a0-adf4-56b690fc298b.png',
          rating: 4.7
        });
      } catch (error) {
        console.error("Error fetching doctor profile:", error);
        toast({
          title: "Error",
          description: "Failed to load doctor profile",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchDoctorProfile();
  }, [params.id, toast]);
  
  const handleBookAppointment = () => {
    if (doctor) {
      navigate(`/patient/find-doctor?selected=${doctor.id}`);
    }
  };
  
  const formatAvailableDays = () => {
    if (!doctor?.availableDays || doctor.availableDays.length === 0) {
      return "No availability information";
    }
    
    return doctor.availableDays.join(", ");
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!doctor) {
    return (
      <div className="p-4 text-center">
        <h2 className="text-xl font-bold">Doctor not found</h2>
        <p className="mt-2">The requested doctor profile could not be found.</p>
        <Button className="mt-4" onClick={() => navigate(-1)}>Go Back</Button>
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
        <h1 className="text-xl font-bold">Doctor Profile</h1>
      </div>
      
      {/* Doctor Info */}
      <div className="p-4">
        <div className="flex items-start mb-6">
          <Avatar className="w-20 h-20 mr-4">
            <AvatarImage src={doctor.profilePic} alt={doctor.name} />
            <AvatarFallback>
              <User className="h-10 w-10" />
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-xl font-bold">{doctor.name}</h2>
            <p className="text-gray-600">{doctor.specialty}</p>
            <div className="flex items-center mt-1">
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              <span className="text-sm ml-1">{doctor.rating}</span>
              <span className="text-sm text-gray-500 ml-2">{doctor.experience} years experience</span>
            </div>
            <div className="mt-4">
              <Button 
                className="w-full" 
                onClick={handleBookAppointment}
              >
                Book Appointment
              </Button>
            </div>
          </div>
        </div>
        
        <Tabs defaultValue="about">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="about">About</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
          </TabsList>
          
          <TabsContent value="about" className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-bold mb-2">About</h3>
                <p className="text-gray-600">{doctor.about}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-bold mb-2">Specialization</h3>
                <Badge variant="secondary" className="mr-2">{doctor.specialty}</Badge>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-bold mb-2">Qualification</h3>
                <p className="text-gray-600">{doctor.qualification || 'No qualification information provided'}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-bold mb-2">Contact Information</h3>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <Mail className="w-4 h-4 mr-2 text-gray-500" />
                    <span className="text-gray-600">{doctor.email}</span>
                  </div>
                  <div className="flex items-center">
                    <Phone className="w-4 h-4 mr-2 text-gray-500" />
                    <span className="text-gray-600">{doctor.phone || 'Not provided'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="schedule" className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-bold mb-2">Available Days</h3>
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                  <span className="text-gray-600">{formatAvailableDays()}</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-bold mb-2">Consultation Fee</h3>
                <div className="flex items-center">
                  <span className="text-gray-600">${doctor.consultationFee || 'Not specified'}</span>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  To book an appointment, click the "Book Appointment" button.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="reviews" className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold">Reviews</h3>
                  <div className="flex items-center">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 mr-1" />
                    <span className="font-bold">{doctor.rating}</span>
                  </div>
                </div>
                <div className="text-center py-8 text-gray-500">
                  <p>No reviews available yet</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      <BottomNavigation />
    </div>
  );
} 