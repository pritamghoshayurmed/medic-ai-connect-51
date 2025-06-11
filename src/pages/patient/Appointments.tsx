import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ChevronLeft } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import AppointmentCard from "@/components/AppointmentCard";
import BottomNavigation from "@/components/BottomNavigation";
import { Appointment, Doctor, UserRole } from "@/types";

interface AppointmentWithDoctor extends Appointment {
  doctor: Doctor;
}

export default function Appointments() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState("upcoming");
  const [appointments, setAppointments] = useState<AppointmentWithDoctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    if (!user) return;
    
    const fetchAppointments = async () => {
      try {
        setLoading(true);
        
        // Simplify the query to avoid foreign key relationship issues
        const { data, error } = await supabase
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
          .order('appointment_date', { ascending: true });
          
        if (error) {
          console.error("Error fetching appointments:", error);
          throw error;
        }
        
        if (data && data.length > 0) {
          // Get unique doctor IDs
          const doctorIds = [...new Set(data.map(appt => appt.doctor_id))];
          
          // Fetch doctor details separately
          const { data: doctorsData, error: doctorsError } = await supabase
            .from('profiles')
            .select('id, full_name, email, phone, role')
            .in('id', doctorIds)
            .eq('role', 'doctor');
            
          if (doctorsError) {
            console.error("Error fetching doctors:", doctorsError);
            throw doctorsError;
          }
          
          // Create a map of doctors for easy lookup
          const doctorsMap = new Map();
          if (doctorsData) {
            doctorsData.forEach(doc => {
              doctorsMap.set(doc.id, {
                id: doc.id,
                name: doc.full_name || 'Unknown Doctor',
                email: doc.email || '',
                phone: doc.phone || '',
                role: 'doctor' as const,
                specialty: 'General Practitioner', // Default value
                experience: 5, // Default value
                profilePic: '/lovable-uploads/769f4117-004e-45a0-adf4-56b690fc298b.png'
              });
            });
          }
          
          // Map appointments with doctor info
          const formattedAppointments = data.map(appt => {
            const doctorId = appt.doctor_id || '';
            const doctorObj = doctorsMap.get(doctorId) || {
              id: doctorId,
              name: 'Unknown Doctor',
              email: '',
              phone: '',
              role: 'doctor' as const,
              specialty: 'General Practitioner',
              experience: 5,
              profilePic: '/lovable-uploads/769f4117-004e-45a0-adf4-56b690fc298b.png'
            };
            
            return {
              id: appt.id,
              patientId: appt.patient_id,
              doctorId: appt.doctor_id,
              date: appt.appointment_date,
              time: appt.appointment_time,
              status: (appt.status || 'pending') as "pending" | "confirmed" | "cancelled" | "completed",
              reason: appt.symptoms || '',
              doctor: doctorObj
            };
          });
        
          setAppointments(formattedAppointments);
        } else {
          setAppointments([]);
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAppointments();
  }, [user]);
  
  const getFilteredAppointments = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    switch (activeTab) {
      case "upcoming":
        return appointments.filter(appt => {
          const apptDate = new Date(appt.date);
          return (apptDate >= today || appt.status === 'pending') && 
                 appt.status !== 'completed' && 
                 appt.status !== 'cancelled';
        });
        
      case "past":
        return appointments.filter(appt => {
          const apptDate = new Date(appt.date);
          return apptDate < today || 
                 appt.status === 'completed' || 
                 appt.status === 'cancelled';
        });
        
      case "all":
      default:
        return appointments;
    }
  };
  
  const handleCancel = (appointmentId: string) => {
    setSelectedAppointment(appointmentId);
    setCancelDialogOpen(true);
  };
  
  const confirmCancel = async () => {
    if (!selectedAppointment) return;
    
    setIsCancelling(true);
    
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'cancelled', cancellation_reason: cancelReason })
        .eq('id', selectedAppointment)
        .eq('patient_id', user?.id);
        
      if (error) throw error;
      
      setAppointments(prev => prev.map(appt => 
        appt.id === selectedAppointment 
          ? { ...appt, status: 'cancelled' as const } 
          : appt
      ));
      
      toast({
        title: "Appointment cancelled",
        description: "Your appointment has been successfully cancelled",
      });
      
      setCancelDialogOpen(false);
      setCancelReason("");
      setSelectedAppointment(null);
      
    } catch (error) {
      console.error("Error cancelling appointment:", error);
      toast({
        title: "Error",
        description: "Failed to cancel appointment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsCancelling(false);
    }
  };

  const renderAppointmentsList = () => {
    const filteredAppointments = getFilteredAppointments();
    
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      );
    }
    
    if (filteredAppointments.length === 0) {
      return (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No appointments found</p>
          <Button className="mt-4" onClick={() => navigate("/patient/find-doctor")}>
            Book an Appointment
          </Button>
        </div>
      );
    }
    
    return filteredAppointments.map((appointment) => (
      <AppointmentCard
        key={appointment.id}
        appointment={appointment}
        person={appointment.doctor}
        showCancelButton={appointment.status !== 'cancelled' && appointment.status !== 'completed'}
        onCancel={() => handleCancel(appointment.id)}
        onChat={() => navigate(`/patient/chat/${appointment.doctorId}`)}
        onViewDetails={() => {
          // Handle view details
        }}
      />
    ));
  };

  return (
    <div className="pb-24">
      <div className="bg-white shadow p-4 flex items-center">
        <Button variant="ghost" size="icon" className="mr-2" onClick={() => navigate(-1)}>
          <ChevronLeft />
        </Button>
        <h1 className="text-xl font-bold">My Appointments</h1>
      </div>
      
      <div className="p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="past">Past</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>
          
          <TabsContent value="upcoming" className="mt-4">
            {renderAppointmentsList()}
          </TabsContent>
          
          <TabsContent value="past" className="mt-4">
            {renderAppointmentsList()}
          </TabsContent>
          
          <TabsContent value="all" className="mt-4">
            {renderAppointmentsList()}
          </TabsContent>
        </Tabs>
      </div>
      
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Appointment</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <p className="mb-4">Are you sure you want to cancel this appointment?</p>
            <div className="space-y-2">
              <label htmlFor="cancelReason" className="text-sm font-medium">Reason (Optional)</label>
              <textarea
                id="cancelReason"
                rows={3}
                className="w-full p-2 border rounded-md resize-none"
                placeholder="Please provide a reason for cancellation..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              ></textarea>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
              Back
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmCancel}
              disabled={isCancelling}
            >
              {isCancelling ? "Cancelling..." : "Confirm Cancellation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <BottomNavigation />
    </div>
  );
}
