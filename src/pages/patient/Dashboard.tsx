import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Doctor } from "@/types";
import { toDoctorType } from "@/utils/typeHelpers";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, Clock, MapPin, Phone } from "lucide-react";
import BottomNavigation from "@/components/BottomNavigation";

export default function PatientDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [doctors, setDoctors] = useState<Doctor[]>([]);

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
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
          ),
          specialties:doctor_profiles.specialty_id (
            name
          )
        `)
        .eq('role', 'doctor')
        .limit(4);

      if (error) throw error;

      // Convert to Doctor type using the helper function
      const doctorList = data.map(doc => toDoctorType({
        id: doc.id,
        name: doc.full_name,
        email: doc.email,
        phone: doc.phone || '',
        role: 'doctor',
        specialty: doc.specialties?.name || 'General',
        experience: doc.doctor_profiles?.experience_years || 0,
        education: doc.doctor_profiles?.qualification || '',
        rating: doc.doctor_profiles?.rating || 0
      }));

      setDoctors(doctorList);
    } catch (error) {
      console.error('Error fetching doctors:', error);
    }
  };

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="bg-primary text-white p-4 flex items-center">
        <h1 className="text-xl font-bold">Dashboard</h1>
      </div>

      {/* Welcome Message */}
      <div className="p-4">
        <h2 className="text-lg font-semibold">
          Welcome, {user ? user.name : "Guest"}!
        </h2>
        <p className="text-gray-600">Here's a quick overview of your health.</p>
      </div>

      {/* Quick Actions */}
      <div className="p-4 grid grid-cols-2 gap-4">
        <Button className="w-full" onClick={() => navigate("/patient/find-doctor")}>
          Find a Doctor
        </Button>
        <Button className="w-full" onClick={() => navigate("/patient/appointments")}>
          View Appointments
        </Button>
      </div>

      {/* Upcoming Appointments */}
      <div className="p-4">
        <h3 className="text-md font-semibold mb-2">Upcoming Appointments</h3>
        <Card>
          <CardContent className="p-4">
            <p className="text-gray-500">No upcoming appointments.</p>
          </CardContent>
        </Card>
      </div>

      {/* Featured Doctors */}
      <div className="p-4">
        <h3 className="text-md font-semibold mb-2">Featured Doctors</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {doctors.map((doctor) => (
            <Card key={doctor.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/doctor/${doctor.id}`)}>
              <CardContent className="p-4">
                <div className="flex items-center mb-3">
                  <Avatar className="mr-3">
                    <AvatarImage src={doctor.profilePic} alt={doctor.name} />
                    <AvatarFallback>{doctor.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-semibold">{doctor.name}</h4>
                    <p className="text-sm text-gray-500">{doctor.specialty || "General Practitioner"}</p>
                  </div>
                </div>
                <div className="text-sm text-gray-600 space-y-2">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>Available: Mon, Wed, Fri</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    <span>9:00 AM - 5:00 PM</span>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2" />
                    <span>{doctor.hospital || "Unknown Hospital"}</span>
                  </div>
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 mr-2" />
                    <span>{doctor.phone}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
}
