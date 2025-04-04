import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft, Calendar } from "lucide-react";
import BottomNavigation from "@/components/BottomNavigation";
import AppointmentCard from "@/components/AppointmentCard";
import { Appointment, Patient } from "@/types";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export default function DoctorAppointments() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [appointments, setAppointments] = useState<(Appointment & { patient: Patient })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch doctor's appointments
    const fetchAppointments = async () => {
      if (!user) return;

      setLoading(true);
      try {
        // Get all appointments for this doctor
        const { data, error } = await supabase
          .from('appointments')
          .select(`
            id,
            patient_id,
            appointment_date,
            appointment_time,
            status,
            symptoms,
            profiles:patient_id (
              id,
              full_name,
              email,
              phone,
              role
            )
          `)
          .eq('doctor_id', user.id)
          .order('appointment_date', { ascending: true });

        if (error) throw error;

        // Format the appointments data
        const formattedAppointments = data.map(apt => {
          const patientProfile = apt.profiles;
          
          // Map the database status to our app's status type
          let typedStatus: 'pending' | 'confirmed' | 'cancelled' | 'completed';
          
          switch(apt.status) {
            case 'pending': 
              typedStatus = 'pending';
              break;
            case 'confirmed': 
              typedStatus = 'confirmed';
              break;
            case 'cancelled': 
              typedStatus = 'cancelled';
              break;
            case 'completed': 
              typedStatus = 'completed';
              break;
            default:
              // Default to pending if unknown status
              typedStatus = 'pending';
          }
          
          return {
            id: apt.id,
            patientId: apt.patient_id,
            doctorId: user.id,
            date: apt.appointment_date,
            time: apt.appointment_time,
            status: typedStatus,
            reason: apt.symptoms,
            patient: {
              id: patientProfile.id,
              name: patientProfile.full_name,
              email: patientProfile.email,
              phone: patientProfile.phone,
              role: 'patient' as const
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
  
  // Filter appointments by selected date
  const filteredAppointments = upcomingAppointments.filter((apt) => {
    if (!selectedDate) return true;
    
    const aptDate = new Date(apt.date);
    return (
      aptDate.getDate() === selectedDate.getDate() &&
      aptDate.getMonth() === selectedDate.getMonth() &&
      aptDate.getFullYear() === selectedDate.getFullYear()
    );
  });

  // Update appointment status
  const updateAppointmentStatus = async (appointmentId: string, status: 'confirmed' | 'completed' | 'cancelled') => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status })
        .eq('id', appointmentId);

      if (error) throw error;

      // Update local state
      setAppointments(appointments.map(apt => 
        apt.id === appointmentId ? { ...apt, status } : apt
      ));

      toast({
        title: "Status Updated",
        description: `Appointment status has been updated to ${status}.`,
      });
    } catch (error) {
      console.error("Error updating appointment status:", error);
      toast({
        title: "Error",
        description: "Failed to update appointment status. Please try again.",
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
        <h1 className="text-xl font-bold">Appointments</h1>
      </div>

      {/* Calendar */}
      <div className="p-4 bg-white shadow-sm">
        <div className="flex items-center mb-3">
          <Calendar className="w-5 h-5 text-gray-500 mr-2" />
          <h2 className="font-bold">Select Date</h2>
        </div>
        <CalendarComponent
          mode="single"
          selected={selectedDate}
          onSelect={setSelectedDate}
          className="rounded-md border"
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="appointments" className="w-full mt-4">
        <TabsList className="grid grid-cols-2 w-full mb-2 px-4">
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
        
        {/* Appointments Tab */}
        <TabsContent value="appointments" className="px-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold">
              {selectedDate
                ? `Appointments for ${selectedDate.toLocaleDateString()}`
                : "All Upcoming Appointments"}
            </h3>
            <span className="text-sm text-primary font-semibold">
              {filteredAppointments.length} appointments
            </span>
          </div>
          
          {filteredAppointments.length > 0 ? (
            filteredAppointments.map((appointment) => (
              <div key={appointment.id} className="mb-4">
                <AppointmentCard
                  appointment={appointment}
                  person={appointment.patient}
                />
                {appointment.status === "pending" && (
                  <div className="flex gap-2 mt-2">
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => updateAppointmentStatus(appointment.id, "confirmed")}
                    >
                      Confirm
                    </Button>
                    <Button 
                      variant="destructive" 
                      className="flex-1"
                      onClick={() => updateAppointmentStatus(appointment.id, "cancelled")}
                    >
                      Decline
                    </Button>
                  </div>
                )}
                {appointment.status === "confirmed" && (
                  <Button 
                    variant="outline" 
                    className="w-full mt-2"
                    onClick={() => updateAppointmentStatus(appointment.id, "completed")}
                  >
                    Mark as Completed
                  </Button>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <p className="text-gray-500">No appointments for selected date</p>
            </div>
          )}
        </TabsContent>
        
        {/* History Tab */}
        <TabsContent value="history" className="px-4">
          <h3 className="font-bold mb-3">Past Appointments</h3>
          
          {pastAppointments.length > 0 ? (
            pastAppointments.map((appointment) => (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
                person={appointment.patient}
              />
            ))
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <p className="text-gray-500">No past appointments</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <BottomNavigation />
    </div>
  );
}
