
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Calendar, Check, X, MoreHorizontal } from "lucide-react";
import { useNavigate } from "react-router-dom";
import BottomNavigation from "@/components/BottomNavigation";
import AppointmentCard from "@/components/AppointmentCard";
import { Appointment, Doctor } from "@/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { asAppointmentStatus, toAppointmentWithDoctor } from "@/utils/typeHelpers";

export default function PatientAppointments() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [appointments, setAppointments] = useState<(Appointment & { doctor: Doctor })[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!user) return;
    
    const fetchAppointments = async () => {
      setLoading(true);
      try {
        // Fetch appointments with the doctor information
        const { data: appointmentsData, error: appointmentsError } = await supabase
          .from("appointments")
          .select(`
            id, 
            doctor_id, 
            appointment_date, 
            appointment_time, 
            status, 
            symptoms,
            doctor:doctor_id(
              id, 
              full_name, 
              email, 
              phone, 
              role,
              doctor_profiles (
                experience_years,
                qualification,
                rating
              )
            )
          `)
          .eq("patient_id", user.id)
          .order("appointment_date", { ascending: false });
        
        if (appointmentsError) {
          console.error("Error fetching appointments:", appointmentsError);
          throw appointmentsError;
        }
        
        if (appointmentsData) {
          // Convert to our application's appointment format
          const formattedAppointments = appointmentsData.map(appointment => {
            // Make sure doctor data is properly formatted
            const doctorData = appointment.doctor || {};
            
            const doctor: Doctor = {
              id: doctorData.id || '',
              name: doctorData.full_name || '',
              email: doctorData.email || '',
              phone: doctorData.phone || '',
              role: 'doctor',
              specialty: '',
              experience: doctorData.doctor_profiles?.experience_years || 0,
              education: doctorData.doctor_profiles?.qualification || '',
              rating: doctorData.doctor_profiles?.rating || 0,
              profilePic: '/lovable-uploads/769f4117-004e-45a0-adf4-56b690fc298b.png'
            };
            
            return {
              id: appointment.id,
              patientId: user.id,
              doctorId: appointment.doctor_id || '',
              date: appointment.appointment_date,
              time: appointment.appointment_time,
              status: asAppointmentStatus(appointment.status),
              reason: appointment.symptoms || '',
              notes: '',
              doctor
            };
          });
          
          setAppointments(formattedAppointments);
        }
      } catch (error) {
        console.error("Error in fetchAppointments:", error);
        toast({
          title: "Error",
          description: "Failed to load appointments.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchAppointments();
  }, [user, toast]);
  
  const cancelAppointment = async (appointmentId: string) => {
    try {
      const { error } = await supabase
        .from("appointments")
        .update({ status: "cancelled" })
        .eq("id", appointmentId)
        .eq("patient_id", user?.id);
      
      if (error) throw error;
      
      // Update state
      setAppointments(prevAppointments => 
        prevAppointments.map(appointment => 
          appointment.id === appointmentId
            ? { ...appointment, status: "cancelled" }
            : appointment
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
        description: "Failed to cancel appointment.",
        variant: "destructive",
      });
    }
  };

  // Filter appointments based on status
  const upcomingAppointments = appointments.filter(
    app => app.status === "pending" || app.status === "confirmed"
  );
  
  const pastAppointments = appointments.filter(
    app => app.status === "completed" || app.status === "cancelled"
  );

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="bg-primary text-white p-4 flex items-center">
        <Button variant="ghost" size="icon" className="text-white mr-2" onClick={() => navigate(-1)}>
          <ChevronLeft />
        </Button>
        <h1 className="text-xl font-bold">Appointments</h1>
      </div>

      {/* Appointment Tabs */}
      <Tabs defaultValue="upcoming" className="w-full p-4">
        <TabsList className="grid grid-cols-2 w-full mb-4">
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
        </TabsList>
        
        {/* Upcoming Appointments */}
        <TabsContent value="upcoming">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : upcomingAppointments.length > 0 ? (
            <div className="space-y-4">
              {upcomingAppointments.map((appointment) => (
                <AppointmentCard
                  key={appointment.id}
                  appointment={appointment}
                  doctorName={appointment.doctor.name}
                  doctorSpecialty={appointment.doctor.specialty || "Doctor"}
                  doctorImage={appointment.doctor.profilePic}
                  onCancel={() => cancelAppointment(appointment.id)}
                  showCancelButton={appointment.status !== "cancelled"}
                  onViewDetails={() => navigate(`/patient/appointment/${appointment.id}`)}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 bg-gray-50 rounded-lg">
              <Calendar className="h-12 w-12 text-gray-400 mb-2" />
              <h3 className="text-xl font-semibold text-gray-700">No Upcoming Appointments</h3>
              <p className="text-gray-500 mb-4 text-center px-4">
                You don't have any upcoming appointments scheduled.
              </p>
              <Button onClick={() => navigate("/patient/find-doctor")}>
                Book an Appointment
              </Button>
            </div>
          )}
        </TabsContent>
        
        {/* Past Appointments */}
        <TabsContent value="past">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : pastAppointments.length > 0 ? (
            <div className="space-y-4">
              {pastAppointments.map((appointment) => (
                <AppointmentCard
                  key={appointment.id}
                  appointment={appointment}
                  doctorName={appointment.doctor.name}
                  doctorSpecialty={appointment.doctor.specialty || "Doctor"}
                  doctorImage={appointment.doctor.profilePic}
                  onViewDetails={() => navigate(`/patient/appointment/${appointment.id}`)}
                  showCancelButton={false}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 bg-gray-50 rounded-lg">
              <Calendar className="h-12 w-12 text-gray-400 mb-2" />
              <h3 className="text-xl font-semibold text-gray-700">No Past Appointments</h3>
              <p className="text-gray-500 text-center px-4">
                You don't have any past appointments.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <BottomNavigation />
    </div>
  );
}
