
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { 
  ChevronLeft, 
  Search, 
  Filter, 
  Star, 
  MapPin,
  Calendar 
} from "lucide-react";
import { Doctor } from "@/types";
import BottomNavigation from "@/components/BottomNavigation";
import DoctorCard from "@/components/DoctorCard";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { toDoctorType } from "@/utils/typeHelpers";

export default function FindDoctor() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>("");
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);
  const [specialties, setSpecialties] = useState<{id: string, name: string}[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch doctors with proper relation hints
        const { data: doctorsData, error: doctorsError } = await supabase
          .from('profiles')
          .select(`
            id,
            full_name,
            email,
            phone,
            role,
            doctor_profiles!doctor_profiles(
              specialty_id,
              experience_years,
              qualification,
              consultation_fee,
              rating
            )
          `)
          .eq('role', 'doctor');
          
        if (doctorsError) {
          console.error("Error fetching doctors:", doctorsError);
          throw doctorsError;
        }
        
        // Fetch specialties
        const { data: specialtiesData, error: specialtiesError } = await supabase
          .from('specialties')
          .select('id, name');
          
        if (specialtiesError) {
          console.error("Error fetching specialties:", specialtiesError);
          throw specialtiesError;
        }
        
        // Convert to our Doctor type
        const doctorsList = doctorsData?.map(doc => {
          // Get specialty name if available
          let specialtyName = "General Practitioner";
          
          if (doc.doctor_profiles?.specialty_id) {
            const specialty = specialtiesData?.find(s => s.id === doc.doctor_profiles?.specialty_id);
            if (specialty) {
              specialtyName = specialty.name;
            }
          }
          
          return {
            id: doc.id,
            name: doc.full_name,
            email: doc.email,
            phone: doc.phone || '',
            role: 'doctor' as const,
            specialty: specialtyName,
            experience: doc.doctor_profiles?.experience_years || 0,
            education: doc.doctor_profiles?.qualification || '',
            hospital: '',
            rating: doc.doctor_profiles?.rating || 0,
            profilePic: '/lovable-uploads/769f4117-004e-45a0-adf4-56b690fc298b.png'
          };
        }) || [];
        
        setDoctors(doctorsList);
        setFilteredDoctors(doctorsList);
        setSpecialties(specialtiesData || []);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: "Error",
          description: "Failed to load doctors data.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [toast]);
  
  useEffect(() => {
    // Filter doctors based on search term and specialty
    let filtered = [...doctors];
    
    if (searchTerm) {
      filtered = filtered.filter(doctor => 
        doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doctor.specialty.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (selectedSpecialty) {
      filtered = filtered.filter(doctor => 
        doctor.specialty.toLowerCase() === selectedSpecialty.toLowerCase()
      );
    }
    
    setFilteredDoctors(filtered);
  }, [searchTerm, selectedSpecialty, doctors]);
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };
  
  const handleSpecialtyClick = (specialty: string) => {
    setSelectedSpecialty(specialty === selectedSpecialty ? "" : specialty);
  };
  
  const bookAppointment = (doctorId: string) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to book an appointment.",
        variant: "destructive"
      });
      navigate("/login");
      return;
    }
    
    navigate(`/patient/book-appointment/${doctorId}`);
  };

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="bg-primary text-white p-4 flex items-center">
        <Button variant="ghost" size="icon" className="text-white mr-2" onClick={() => navigate(-1)}>
          <ChevronLeft />
        </Button>
        <h1 className="text-xl font-bold">Find a Doctor</h1>
      </div>

      {/* Search Bar */}
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <Input
            placeholder="Search by name or specialty..."
            className="pl-10"
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>
      </div>

      {/* Specialty Filter */}
      <div className="px-4">
        <h3 className="font-medium text-sm mb-2 flex items-center">
          <Filter size={16} className="mr-1" /> Filter by Specialty
        </h3>
        <div className="flex overflow-x-auto pb-2 gap-2 no-scrollbar">
          {specialties.map((specialty) => (
            <Button
              key={specialty.id}
              variant={selectedSpecialty === specialty.name ? "default" : "outline"}
              className="whitespace-nowrap"
              size="sm"
              onClick={() => handleSpecialtyClick(specialty.name)}
            >
              {specialty.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Doctors List */}
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-3">
          {selectedSpecialty ? `${selectedSpecialty} Doctors` : "Available Doctors"}
        </h2>
        
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : filteredDoctors.length > 0 ? (
          <div className="space-y-4">
            {filteredDoctors.map((doctor) => (
              <DoctorCard 
                key={doctor.id}
                doctor={doctor}
                onBookAppointment={() => bookAppointment(doctor.id)}
                onViewProfile={() => navigate(`/patient/doctor/${doctor.id}`)}
              />
            ))}
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg p-6 text-center">
            <h3 className="text-lg font-medium text-gray-800 mb-2">No doctors found</h3>
            <p className="text-gray-600">
              Try adjusting your search or filters to find available doctors.
            </p>
          </div>
        )}
      </div>

      <BottomNavigation />
    </div>
  );
}
