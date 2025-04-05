import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Doctor } from "@/types";
import { processDoctorProfile } from "@/utils/typeHelpers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, ChevronLeft } from "lucide-react";
import BottomNavigation from "@/components/BottomNavigation";

export default function FindDoctor() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDoctors();
  }, []);

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
            specialty_id,
            experience_years,
            qualification,
            rating
          )
        `)
        .eq('role', 'doctor');

      if (error) throw error;

      // Convert to Doctor type using helper function
      const doctorList = data.map(doc => processDoctorProfile(doc));
      setDoctors(doctorList);
      setFilteredDoctors(doctorList);
    } catch (error) {
      console.error('Error fetching doctors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    const filtered = doctors.filter((doctor) =>
      doctor.name.toLowerCase().includes(query.toLowerCase()) ||
      (doctor.specialty && doctor.specialty.toLowerCase().includes(query.toLowerCase()))
    );
    setFilteredDoctors(filtered);
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

      {/* Search */}
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <Input
            placeholder="Search doctors..."
            className="pl-10"
            value={searchQuery}
            onChange={handleSearch}
          />
        </div>
      </div>

      {/* Doctor List */}
      <div className="p-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredDoctors.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {filteredDoctors.map((doctor) => (
              <Card
                key={doctor.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(`/doctor/${doctor.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <Avatar className="mr-4">
                      <AvatarImage src={doctor.profilePic} alt={doctor.name} />
                      <AvatarFallback>{doctor.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-lg font-semibold">{doctor.name}</h3>
                      <p className="text-gray-600">{doctor.specialty || 'General Practitioner'}</p>
                      <div className="flex items-center mt-1">
                        {/* You can add rating stars here if you have the data */}
                        <span className="text-sm text-gray-500">{doctor.experience} years experience</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No doctors found</p>
          </div>
        )}
      </div>

      <BottomNavigation />
    </div>
  );
}
