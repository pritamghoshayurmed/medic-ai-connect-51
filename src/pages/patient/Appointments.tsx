
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft } from "lucide-react";
import BottomNavigation from "@/components/BottomNavigation";
import AppointmentCard from "@/components/AppointmentCard";
import { Appointment, Doctor } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export default function Appointments() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [appointments, setAppointments] = useState<(Appointment & { doctor: Doctor })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch user's appointments
    const fetchAppointments = async () => {
      if (!user) return;

      setLoading(true);
      try {
        // Get all appointments for this patient
        const { data, error } = await supabase
          .from('appointments')
          .select(`
            id,
            doctor_id,
            appointment_date,
            appointment_time,
            status,
            symptoms,
            doctor_profiles!appointments_doctor_id_fkey (
              experience_years,
              consultation_fee,
              rating,
              profiles:id (
                full_name,
                email,
                phone,
                role
              )
            )
          `)
          .eq('patient_id', user.id)
          .order('appointment_date', { ascending: true });

        if (error) throw error;

        // Format the appointments data
        const formattedAppointments = data.map(apt => {
          const doctorProfile = apt.doctor_profiles;
          
          return {
            id: apt.id,
            patientId: user.id,
            doctorId: apt.doctor_id,
            date: apt.appointment_date,
            time: apt.appointment_time,
            status: apt.status,
            reason: apt.symptoms,
            doctor: {
              id: apt.doctor_id,
              name: doctorProfile.profiles.full_name,
              email: doctorProfile.profiles.email,
              phone: doctorProfile.profiles.phone,
              role: 'doctor',
              specialty: 'Doctor', // We'll need to join with specialties table to get this
              experience: doctorProfile.experience_years,
              rating: doctorProfile.rating,
              profilePic: '/lovable-uploads/769f4117-004e-45a0-adf4-56b690fc298b.png'
            }
          };
        });

        setAppointments(formattedAppointments);
      } catch (error) {
        console.error("Error fetching appointments:", error);
        toast({
          title: "Error",
          description: "Failed to load appointments. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [user, toast]);

  const upcomingAppointments = appointments.filter(
    (apt) => apt.status === "confirmed" || apt.status === "pending"
  );
  
  const pastAppointments = appointments.filter(
    (apt) => apt.status === "completed" || apt.status === "cancelled"
  );

  const handleCancelAppointment = async (appointmentId: string) => {
    try {
      // Update appointment status in the database
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', appointmentId);

      if (error) throw error;

      // Update local state
      setAppointments(
        appointments.map((apt) =>
          apt.id === appointmentId ? { ...apt, status: "cancelled" } : apt
        )
      );
      
      toast({
        title: "Appointment Cancelled",
        description: "Your appointment has been cancelled successfully.",
      });
    } catch (error) {
      console.error("Error cancelling appointment:", error);
      toast({
        title: "Error",
        description: "Failed to cancel appointment. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
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
        <h1 className="text-xl font-bold">My Appointments</h1>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
        </TabsList>
        
        {/* Upcoming Appointments */}
        <TabsContent value="upcoming" className="p-4">
          {upcomingAppointments.length > 0 ? (
            upcomingAppointments.map((appointment) => (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
                person={appointment.doctor}
                onCancel={() => handleCancelAppointment(appointment.id)}
              />
            ))
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <p className="text-gray-500">No upcoming appointments</p>
              <Button 
                variant="link" 
                className="mt-2"
                onClick={() => navigate("/patient/find-doctor")}
              >
                Book an appointment
              </Button>
            </div>
          )}
        </TabsContent>
        
        {/* Past Appointments */}
        <TabsContent value="past" className="p-4">
          {pastAppointments.length > 0 ? (
            pastAppointments.map((appointment) => (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
                person={appointment.doctor}
              />
            ))
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <p className="text-gray-500">No past appointments</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Book button */}
      <div className="fixed bottom-20 right-4">
        <Button 
          size="lg" 
          className="rounded-full h-14 w-14 shadow-lg"
          onClick={() => navigate("/patient/find-doctor")}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 5V19M5 12H19" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Button>
      </div>

      <BottomNavigation />
    </div>
  );
}
