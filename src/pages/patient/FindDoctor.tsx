
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ChevronLeft, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import DoctorCard from "@/components/DoctorCard";
import BottomNavigation from "@/components/BottomNavigation";
import { Doctor } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { asUserRole } from "@/utils/typeHelpers";

export default function FindDoctor() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [specialties, setSpecialties] = useState<{ id: string, name: string }[]>([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(null);

  useEffect(() => {
    fetchDoctors();
    fetchSpecialties();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === "" && !selectedSpecialty) {
      setFilteredDoctors(doctors);
    } else {
      const filtered = doctors.filter(doctor => {
        const matchesSearch = searchTerm.trim() === "" || 
          doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
          (doctor.specialty && doctor.specialty.toLowerCase().includes(searchTerm.toLowerCase()));
        
        const matchesSpecialty = !selectedSpecialty || doctor.specialty === selectedSpecialty;
        
        return matchesSearch && matchesSpecialty;
      });
      setFilteredDoctors(filtered);
    }
  }, [searchTerm, doctors, selectedSpecialty]);

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          email,
          phone,
          role,
          doctor_profiles (
            about,
            specialty_id,
            experience_years,
            qualification,
            consultation_fee,
            rating,
            total_reviews
          )
        `)
        .eq('role', 'doctor');

      if (error) throw error;

      if (data && data.length > 0) {
        const formattedDoctors: Doctor[] = data.map(doctor => ({
          id: doctor.id,
          name: doctor.full_name,
          email: doctor.email,
          phone: doctor.phone || '',
          role: 'doctor',
          specialty: 'General Practitioner', // Default value
          experience: doctor.doctor_profiles?.experience_years || 0,
          education: doctor.doctor_profiles?.qualification || '',
          hospital: '',
          rating: doctor.doctor_profiles?.rating || 4.5,
          profilePic: '/lovable-uploads/769f4117-004e-45a0-adf4-56b690fc298b.png'
        }));

        setDoctors(formattedDoctors);
        setFilteredDoctors(formattedDoctors);
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
      toast({
        title: "Error",
        description: "Failed to load doctors list",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSpecialties = async () => {
    try {
      const { data, error } = await supabase
        .from('specialties')
        .select('id, name');

      if (error) throw error;

      if (data) {
        setSpecialties(data);
      }
    } catch (error) {
      console.error('Error fetching specialties:', error);
    }
  };

  const handleBookAppointment = (doctorId: string) => {
    navigate(`/patient/book-appointment/${doctorId}`);
  };

  const handleViewProfile = (doctorId: string) => {
    navigate(`/patient/doctor-profile/${doctorId}`);
  };

  const handleSpecialtyFilter = (specialtyId: string) => {
    if (selectedSpecialty === specialtyId) {
      setSelectedSpecialty(null);
    } else {
      setSelectedSpecialty(specialtyId);
    }
  };

  return (
    <div className="pb-16">
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between bg-white">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ChevronLeft />
          </Button>
          <h1 className="text-xl font-semibold">Find a Doctor</h1>
        </div>
        <Button variant="outline" size="icon">
          <Filter className="h-5 w-5" />
        </Button>
      </div>

      {/* Search bar */}
      <div className="px-4 py-2">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search by name or specialty"
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Specialties filter */}
      <div className="overflow-x-auto px-4 py-2">
        <div className="flex space-x-2">
          {specialties.map((specialty) => (
            <Button
              key={specialty.id}
              variant={selectedSpecialty === specialty.id ? "default" : "outline"}
              size="sm"
              onClick={() => handleSpecialtyFilter(specialty.id)}
            >
              {specialty.name}
            </Button>
          ))}
        </div>
      </div>

      <Separator className="my-2" />

      {/* Doctor list */}
      <div className="px-4">
        <h2 className="text-lg font-semibold py-2">Available Doctors</h2>
        
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredDoctors.length > 0 ? (
          filteredDoctors.map((doctor) => (
            <DoctorCard 
              key={doctor.id} 
              doctor={doctor}
              onBookAppointment={() => handleBookAppointment(doctor.id)}
              onViewProfile={() => handleViewProfile(doctor.id)}
            />
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No doctors found matching your criteria.</p>
            <Button 
              variant="link" 
              onClick={() => {
                setSearchTerm("");
                setSelectedSpecialty(null);
              }}
            >
              Clear filters
            </Button>
          </div>
        )}
      </div>

      <BottomNavigation />
    </div>
  );
}
