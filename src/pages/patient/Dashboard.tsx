import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CalendarDays, UserRound, Bell } from "lucide-react";
import AppointmentCard from "@/components/AppointmentCard";
import DoctorCard from "@/components/DoctorCard";
import BottomNavigation from "@/components/BottomNavigation";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Appointment, Doctor } from "@/types";
import { format } from "date-fns";

interface ExtendedAppointment extends Appointment {
  doctorName?: string;
}

export default function PatientDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [upcomingAppointments, setUpcomingAppointments] = useState<ExtendedAppointment[]>([]);
  const [recommendedDoctors, setRecommendDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        // Fetch appointments using a simplified query
        const { data: appointmentsData, error: appointmentsError } = await supabase
          .from('appointments')
          .select(`
            id, 
            patient_id,
            doctor_id,
            appointment_date,
            appointment_time,
            status,
            symptoms
          `)
          .eq('patient_id', user.id)
          .order('appointment_date', { ascending: true })
          .limit(3);

        if (appointmentsError) {
          console.error("Error fetching appointments:", appointmentsError);
        } else if (appointmentsData && appointmentsData.length > 0) {
          // Get unique doctor IDs
          const doctorIds = [...new Set(appointmentsData.map(appt => appt.doctor_id))];
          
          // Fetch doctor details separately if needed
          const { data: doctorsData, error: doctorsError } = await supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', doctorIds);
            
          if (doctorsError) {
            console.error("Error fetching doctor details:", doctorsError);
          }
          
          // Create a map of doctor names
          const doctorNameMap = new Map();
          if (doctorsData) {
            doctorsData.forEach(doc => {
              doctorNameMap.set(doc.id, doc.full_name);
            });
          }
          
          // Transform data to match our Appointment interface
          const today = new Date();
          const formattedAppointments = appointmentsData
            .filter(appt => new Date(appt.appointment_date) >= today)
            .map(appt => ({
              id: appt.id,
              patientId: appt.patient_id,
              doctorId: appt.doctor_id,
              date: appt.appointment_date,
              time: appt.appointment_time,
              status: (appt.status || 'pending') as "pending" | "confirmed" | "cancelled" | "completed",
              reason: appt.symptoms || '',
              doctorName: doctorNameMap.get(appt.doctor_id) || 'Dr. Unknown'
            }))
            .slice(0, 2); // Just get the first 2 upcoming appointments
          
          setUpcomingAppointments(formattedAppointments);
        }

        // Fetch recommended doctors
        const { data: doctorsData, error: doctorsError } = await supabase
          .from('profiles')
          .select(`
            *,
            doctor_profiles(*)
          `)
          .eq('role', 'doctor')
          .limit(3);

        if (doctorsError) {
          console.error("Error fetching doctors:", doctorsError);
        } else if (doctorsData) {
          // Transform data to match our Doctor interface
          const formattedDoctors = doctorsData.map(doc => ({
            id: doc.id,
            name: doc.full_name,
            email: doc.email,
            phone: doc.phone || '',
            role: 'doctor' as const, // Use a const assertion to ensure type safety
            specialty: doc.doctor_profiles?.[0]?.specialty || 'General Practitioner', 
            experience: doc.doctor_profiles?.[0]?.experience_years || 5,
            rating: 4.8, // Default value
            profilePic: '/lovable-uploads/769f4117-004e-45a0-adf4-56b690fc298b.png' // Default image
          }));
          
          setRecommendDoctors(formattedDoctors);
        }

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const formattedDate = format(new Date(), "EEEE, MMMM d");

  const handleBookAppointment = (doctorId: string) => {
    navigate(`/patient/find-doctor?selected=${doctorId}`);
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
      <div className="bg-primary text-white p-4 pb-12 rounded-b-3xl">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Hello, {user?.name || 'there'}!</h1>
            <p className="text-white/80">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
          </div>
          <div className="flex space-x-2">
            <Button variant="ghost" size="icon" className="text-white">
              <Bell />
            </Button>
          </div>
        </div>
        <div className="mt-6 flex space-x-3">
          <Button onClick={() => navigate("/patient/find-doctor")} className="bg-white text-primary hover:bg-gray-100 flex-1">
            Find Doctor
          </Button>
          <Button 
            onClick={() => navigate("/patient/appointments")} 
            variant="secondary"
            className="bg-white/90 text-primary hover:bg-white flex-1"
          >
            Appointments
          </Button>
        </div>
      </div>

      {/* Upcoming Appointments */}
      <div className="mt-6 px-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">Upcoming Appointments</h2>
          <Button variant="link" className="text-primary p-0" onClick={() => navigate("/patient/appointments")}>
            View All
          </Button>
        </div>

        {upcomingAppointments.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-6 text-center">
            <CalendarDays className="h-12 w-12 mx-auto text-gray-400 mb-2" />
            <h3 className="font-medium">No Upcoming Appointments</h3>
            <p className="text-sm text-gray-500 mb-4">You don't have any appointments scheduled</p>
            <Button onClick={() => navigate("/patient/find-doctor")}>
              Book an Appointment
            </Button>
          </div>
        ) : (
          upcomingAppointments.map((appointment) => (
            <AppointmentCard
              key={appointment.id}
              appointment={appointment}
              person={{
                id: appointment.doctorId,
                name: appointment.doctorName || "Dr. Unknown",
                email: "doctor@example.com",
                phone: "",
                role: "doctor",
                specialty: "General Practitioner"
              }}
              onCancel={() => {
                // Handle cancellation
              }}
            />
          ))
        )}
      </div>

      {/* Recommended Doctors */}
      <div className="mt-6 px-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">Recommended Doctors</h2>
          <Button variant="link" className="text-primary p-0" onClick={() => navigate("/patient/find-doctor")}>
            View All
          </Button>
        </div>

        {recommendedDoctors.map((doctor) => (
          <DoctorCard
            key={doctor.id}
            doctor={doctor}
            onBookAppointment={() => navigate(`/patient/find-doctor?selected=${doctor.id}`)}
          />
        ))}
      </div>

      <BottomNavigation />
    </div>
  );
}
