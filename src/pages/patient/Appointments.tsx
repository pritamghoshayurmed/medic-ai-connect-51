
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarClock, ChevronLeft, ChevronRight } from "lucide-react";
import AppointmentCard from "@/components/AppointmentCard";
import BottomNavigation from "@/components/BottomNavigation";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Doctor, Appointment } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { 
  Dialog,
  DialogContent, 
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { asAppointmentStatus } from "@/utils/typeHelpers";

export default function Appointments() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [upcomingAppointments, setUpcomingAppointments] = useState<(Appointment & { doctor: Doctor })[]>([]);
  const [pastAppointments, setPastAppointments] = useState<(Appointment & { doctor: Doctor })[]>([]);
  const [confirmCancelDialog, setConfirmCancelDialog] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState<string | null>(null);
  const [appointmentDetails, setAppointmentDetails] = useState<(Appointment & { doctor: Doctor }) | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  useEffect(() => {
    if (user) {
      fetchAppointments();
    }
  }, [user]);

  const fetchAppointments = async () => {
    if (!user) return;
    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          patient_id,
          doctor_id,
          appointment_date,
          appointment_time,
          status,
          symptoms,
          created_at,
          doctor:doctor_id (
            id,
            full_name,
            email,
            phone,
            role,
            doctor_profiles (
              about,
              experience_years,
              qualification,
              specialty_id,
              consultation_fee,
              rating
            )
          )
        `)
        .eq('patient_id', user.id);

      if (error) throw error;

      if (data) {
        const appointments = data.map(item => {
          // Default doctor data if not available
          let doctorData: Doctor = {
            id: item.doctor?.id || '',
            name: item.doctor?.full_name || 'Unknown Doctor',
            email: item.doctor?.email || '',
            phone: item.doctor?.phone || '',
            role: 'doctor',
            specialty: 'General Practitioner',
            experience: item.doctor?.doctor_profiles?.experience_years || 0,
            education: item.doctor?.doctor_profiles?.qualification || '',
            hospital: '',
            rating: item.doctor?.doctor_profiles?.rating || 0,
            profilePic: '/lovable-uploads/769f4117-004e-45a0-adf4-56b690fc298b.png'
          };

          return {
            id: item.id,
            patientId: item.patient_id,
            doctorId: item.doctor_id,
            date: item.appointment_date,
            time: item.appointment_time,
            status: asAppointmentStatus(item.status),
            reason: item.symptoms || '',
            notes: '',
            doctor: doctorData
          };
        });

        // Sort all appointments by date (most recent first)
        appointments.sort((a, b) => {
          const dateA = new Date(`${a.date} ${a.time}`);
          const dateB = new Date(`${b.date} ${b.time}`);
          return dateB.getTime() - dateA.getTime();
        });

        // Separate into upcoming and past appointments
        const now = new Date();
        const upcoming: (Appointment & { doctor: Doctor })[] = [];
        const past: (Appointment & { doctor: Doctor })[] = [];

        appointments.forEach(appt => {
          const apptDate = new Date(`${appt.date} ${appt.time}`);
          if (apptDate > now && appt.status !== 'cancelled') {
            upcoming.push(appt);
          } else {
            past.push(appt);
          }
        });

        setUpcomingAppointments(upcoming);
        setPastAppointments(past);
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);
      toast({
        title: "Error",
        description: "Failed to load appointments",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAppointment = (appointmentId: string) => {
    setAppointmentToCancel(appointmentId);
    setConfirmCancelDialog(true);
  };

  const confirmCancelAppointment = async () => {
    if (!appointmentToCancel) return;
    
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', appointmentToCancel);
      
      if (error) throw error;
      
      toast({
        title: "Appointment Cancelled",
        description: "Your appointment has been cancelled successfully"
      });
      
      // Update local state
      setUpcomingAppointments(prev => 
        prev.map(appt => 
          appt.id === appointmentToCancel
            ? { ...appt, status: 'cancelled' }
            : appt
        )
      );
      
      // Move to past appointments if it's cancelled
      const cancelledAppointment = upcomingAppointments.find(appt => appt.id === appointmentToCancel);
      if (cancelledAppointment) {
        setPastAppointments(prev => [...prev, { ...cancelledAppointment, status: 'cancelled' }]);
        setUpcomingAppointments(prev => prev.filter(appt => appt.id !== appointmentToCancel));
      }
      
    } catch (error) {
      console.error("Error cancelling appointment:", error);
      toast({
        title: "Error",
        description: "Failed to cancel appointment",
        variant: "destructive"
      });
    } finally {
      setConfirmCancelDialog(false);
      setAppointmentToCancel(null);
    }
  };

  const viewAppointmentDetails = (appointment: Appointment & { doctor: Doctor }) => {
    setAppointmentDetails(appointment);
    setShowDetailsDialog(true);
  };

  return (
    <div className="pb-16">
      {/* Header */}
      <div className="bg-primary text-white p-4 flex items-center justify-between">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" className="text-white mr-2" onClick={() => navigate(-1)}>
            <ChevronLeft />
          </Button>
          <h1 className="text-xl font-bold">My Appointments</h1>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-white"
          onClick={() => navigate('/patient/find-doctor')}
        >
          Book New
        </Button>
      </div>

      {/* Appointments tabs */}
      <Tabs defaultValue="upcoming" className="p-4">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
        </TabsList>
        
        <TabsContent value="upcoming">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : upcomingAppointments.length > 0 ? (
            upcomingAppointments.map(appointment => (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
                person={appointment.doctor}
                doctorName={appointment.doctor.name}
                doctorSpecialty={appointment.doctor.specialty}
                doctorImage={appointment.doctor.profilePic}
                onCancel={async () => handleCancelAppointment(appointment.id)}
                showCancelButton={true}
                onViewDetails={() => viewAppointmentDetails(appointment)}
              />
            ))
          ) : (
            <div className="text-center py-8">
              <CalendarClock className="w-16 h-16 mx-auto text-gray-300" />
              <p className="mt-4 text-gray-500">You don't have any upcoming appointments</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => navigate('/patient/find-doctor')}
              >
                Book an Appointment
              </Button>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="past">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : pastAppointments.length > 0 ? (
            pastAppointments.map(appointment => (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
                person={appointment.doctor}
                doctorName={appointment.doctor.name}
                doctorSpecialty={appointment.doctor.specialty}
                doctorImage={appointment.doctor.profilePic}
                onViewDetails={() => viewAppointmentDetails(appointment)}
                showCancelButton={false}
              />
            ))
          ) : (
            <div className="text-center py-8">
              <CalendarClock className="w-16 h-16 mx-auto text-gray-300" />
              <p className="mt-4 text-gray-500">You don't have any past appointments</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Confirm cancellation dialog */}
      <Dialog open={confirmCancelDialog} onOpenChange={setConfirmCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Appointment</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this appointment? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmCancelDialog(false)}>No, Keep It</Button>
            <Button variant="destructive" onClick={confirmCancelAppointment}>Yes, Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Appointment details dialog */}
      {appointmentDetails && (
        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Appointment Details</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-sm text-gray-500">Doctor</h3>
                <p>{appointmentDetails.doctor.name}</p>
              </div>
              
              <div>
                <h3 className="font-semibold text-sm text-gray-500">Specialty</h3>
                <p>{appointmentDetails.doctor.specialty}</p>
              </div>
              
              <div>
                <h3 className="font-semibold text-sm text-gray-500">Date & Time</h3>
                <p>
                  {format(new Date(appointmentDetails.date), "MMMM d, yyyy")} at {appointmentDetails.time}
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold text-sm text-gray-500">Status</h3>
                <p className="capitalize">{appointmentDetails.status}</p>
              </div>
              
              <div>
                <h3 className="font-semibold text-sm text-gray-500">Reason for Visit</h3>
                <p>{appointmentDetails.reason || "Not specified"}</p>
              </div>
            </div>
            
            <DialogFooter>
              <Button onClick={() => setShowDetailsDialog(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <BottomNavigation />
    </div>
  );
}
