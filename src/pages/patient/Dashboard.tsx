import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Search, Phone, Calendar, PlusCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import BottomNavigation from "@/components/BottomNavigation";
import DoctorCard from "@/components/DoctorCard";
import AppointmentCard from "@/components/AppointmentCard";
import { Appointment, Doctor } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function PatientDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [upcomingAppointments, setUpcomingAppointments] = useState<(Appointment & { doctor: Doctor })[]>([]);
  const [recommendedDoctors, setRecommendedDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // Fetch upcoming appointments
        const { data: appointmentsData, error: appointmentsError } = await supabase
          .from('appointments')
          .select(`
            id,
            appointment_date,
            appointment_time,
            status,
            symptoms,
            doctor_id
          `)
          .eq('patient_id', user.id)
          .eq('status', 'pending')
          .order('appointment_date', { ascending: true })
          .limit(3);

        if (appointmentsError) throw appointmentsError;

        // Fetch doctor details for each appointment
        const appointmentsWithDoctors = await Promise.all(
          appointmentsData.map(async (apt) => {
            const { data: doctorData, error: doctorError } = await supabase
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
              .eq('id', apt.doctor_id)
              .single();

            if (doctorError) {
              console.error("Error fetching doctor details:", doctorError);
              return null;
            }

            let specialtyName = 'General Practitioner';
            if (doctorData.doctor_profiles?.specialty_id) {
              const { data: specialtyData } = await supabase
                .from('specialties')
                .select('name')
                .eq('id', doctorData.doctor_profiles.specialty_id)
                .single();
                
              if (specialtyData) {
                specialtyName = specialtyData.name;
              }
            }

            const doctor: Doctor = {
              id: doctorData.id,
              name: doctorData.full_name,
              email: doctorData.email,
              phone: doctorData.phone || '',
              role: 'doctor',
              specialty: specialtyName,
              experience: doctorData.doctor_profiles?.experience_years || 0,
              hospital: '',
              rating: doctorData.doctor_profiles?.rating || 4.5,
              education: doctorData.doctor_profiles?.qualification || '',
              profilePic: '/lovable-uploads/769f4117-004e-45a0-adf4-56b690fc298b.png'
            };

            return {
              id: apt.id,
              patientId: user.id,
              doctorId: apt.doctor_id,
              date: apt.appointment_date,
              time: apt.appointment_time,
              status: apt.status as 'pending' | 'confirmed' | 'cancelled' | 'completed',
              reason: apt.symptoms || 'General checkup',
              doctor
            };
          })
        );

        // Filter out null values
        const validAppointments = appointmentsWithDoctors.filter(apt => apt !== null) as (Appointment & { doctor: Doctor })[];
        setUpcomingAppointments(validAppointments);

        // Fetch recommended doctors (top rated or most popular)
        const { data: doctorsData, error: doctorsError } = await supabase
          .from('profiles')
          .select(`
            id,
            full_name,
            email,
            phone,
            role,
            doctor_profiles!inner(
              id,
              specialty_id,
              experience_years,
              qualification,
              rating
            )
          `)
          .eq('role', 'doctor')
          .order('doctor_profiles.rating', { ascending: false })
          .limit(3);

        if (doctorsError) throw doctorsError;

        // Format doctor data
        const formattedDoctors = await Promise.all(
          doctorsData.map(async (doc) => {
            let specialtyName = 'General Practitioner';
            if (doc.doctor_profiles?.specialty_id) {
              const { data: specialtyData } = await supabase
                .from('specialties')
                .select('name')
                .eq('id', doc.doctor_profiles.specialty_id)
                .single();
                
              if (specialtyData) {
                specialtyName = specialtyData.name;
              }
            }

            return {
              id: doc.id,
              name: doc.full_name,
              email: doc.email,
              phone: doc.phone || '',
              role: 'doctor',
              specialty: specialtyName,
              experience: doc.doctor_profiles?.experience_years || 0,
              hospital: '',
              rating: doc.doctor_profiles?.rating || 4.5,
              education: doc.doctor_profiles?.qualification || '',
              profilePic: '/lovable-uploads/769f4117-004e-45a0-adf4-56b690fc298b.png'
            };
          })
        );

        setRecommendedDoctors(formattedDoctors);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        toast({
          title: "Error",
          description: "Failed to load dashboard data",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user, toast]);

  const handleCancelAppointment = async (appointmentId: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', appointmentId);

      if (error) throw error;

      // Update state
      const updated = upcomingAppointments.filter(apt => apt.id !== appointmentId);
      setUpcomingAppointments(updated);

      toast({
        title: "Appointment Cancelled",
        description: "Your appointment has been cancelled successfully"
      });
    } catch (error) {
      console.error("Error cancelling appointment:", error);
      toast({
        title: "Error",
        description: "Failed to cancel appointment",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="bg-primary text-white p-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Hi, {user?.name?.split(" ")[0]}</h1>
            <p className="text-white text-opacity-80">How are you feeling today?</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center">
            <span className="text-primary text-xl font-bold">{user?.name?.charAt(0)}</span>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 py-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <Input
            placeholder="Search for doctors, symptoms..."
            className="pl-10 bg-gray-50"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Quick actions */}
      <div className="px-4 py-3 grid grid-cols-2 gap-3">
        <Button
          className="flex flex-col items-center justify-center h-24 space-y-2"
          variant="outline"
          onClick={() => navigate("/patient/find-doctor")}
        >
          <PlusCircle size={24} />
          <span>Find Doctor</span>
        </Button>
        <Button
          className="flex flex-col items-center justify-center h-24 space-y-2"
          variant="outline"
          onClick={() => navigate("/patient/appointments")}
        >
          <Calendar size={24} />
          <span>Appointments</span>
        </Button>
        <Button
          className="flex flex-col items-center justify-center h-24 space-y-2"
          variant="outline"
          onClick={() => navigate("/patient/ai-assistant")}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 3C16.982 3 21 7.018 21 12C21 16.982 16.982 21 12 21C7.018 21 3 16.982 3 12C3 7.018 7.018 3 12 3ZM12 5C8.14 5 5 8.14 5 12C5 15.86 8.14 19 12 19C15.86 19 19 15.86 19 12C19 8.14 15.86 5 12 5ZM12 8.5C13.1046 8.5 14 9.39543 14 10.5C14 11.6046 13.1046 12.5 12 12.5C10.8954 12.5 10 11.6046 10 10.5C10 9.39543 10.8954 8.5 12 8.5ZM8.5 15C8.5 13.067 10.067 11.5 12 11.5C13.933 11.5 15.5 13.067 15.5 15H8.5Z" fill="currentColor"/>
          </svg>
          <span>AI Assistant</span>
        </Button>
        <Button
          className="flex flex-col items-center justify-center h-24 space-y-2"
          variant="outline"
          onClick={() => window.location.href = "tel:+123456789"}
        >
          <Phone size={24} />
          <span>Call Helpline</span>
        </Button>
      </div>

      {/* Upcoming appointments */}
      <div className="px-4 py-3">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-bold">Upcoming Appointments</h2>
          <Button variant="link" className="text-primary p-0" onClick={() => navigate("/patient/appointments")}>
            See All
          </Button>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : upcomingAppointments.length > 0 ? (
          upcomingAppointments.slice(0, 2).map((appointment) => (
            <AppointmentCard
              key={appointment.id}
              appointment={appointment}
              person={appointment.doctor}
              onCancel={() => handleCancelAppointment(appointment.id)}
            />
          ))
        ) : (
          <div className="text-center py-6 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No upcoming appointments</p>
            <Button variant="link" className="mt-2" onClick={() => navigate("/patient/find-doctor")}>
              Book an appointment
            </Button>
          </div>
        )}
      </div>

      {/* Recommended doctors */}
      <div className="px-4 py-3">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-bold">Recommended Doctors</h2>
          <Button variant="link" className="text-primary p-0" onClick={() => navigate("/patient/find-doctor")}>
            See All
          </Button>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : recommendedDoctors.length > 0 ? (
          recommendedDoctors.map((doctor) => (
            <DoctorCard
              key={doctor.id}
              doctor={doctor}
              onBookAppointment={() => navigate(`/patient/find-doctor?doctor=${doctor.id}`)}
            />
          ))
        ) : (
          <div className="text-center py-6 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No recommended doctors available</p>
            <Button variant="link" className="mt-2" onClick={() => navigate("/patient/find-doctor")}>
              Browse all doctors
            </Button>
          </div>
        )}
      </div>

      <BottomNavigation />
    </div>
  );
}
