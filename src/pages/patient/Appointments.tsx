
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft } from "lucide-react";
import BottomNavigation from "@/components/BottomNavigation";
import AppointmentCard from "@/components/AppointmentCard";
import { Appointment, Doctor } from "@/types";
import { useToast } from "@/hooks/use-toast";

// Mock data
const mockDoctors: Doctor[] = [
  {
    id: "doc1",
    name: "Dr. Sarah Johnson",
    email: "sarah@example.com",
    phone: "+1234567890",
    role: "doctor",
    specialty: "Cardiologist",
    experience: 10,
    hospital: "City Hospital",
    rating: 4.8,
  },
  {
    id: "doc2",
    name: "Dr. Michael Chen",
    email: "michael@example.com",
    phone: "+1234567891",
    role: "doctor",
    specialty: "Neurologist",
    experience: 8,
    hospital: "General Medical Center",
    rating: 4.5,
  },
  {
    id: "doc3",
    name: "Dr. Emily Williams",
    email: "emily@example.com",
    phone: "+1234567892",
    role: "doctor",
    specialty: "Pediatrician",
    experience: 12,
    hospital: "Children's Hospital",
    rating: 4.9,
  },
];

const mockAppointments: (Appointment & { doctor: Doctor })[] = [
  {
    id: "apt1",
    patientId: "pat1",
    doctorId: "doc1",
    date: "2025-04-10",
    time: "10:00 AM",
    status: "confirmed",
    reason: "Regular checkup",
    doctor: mockDoctors[0],
  },
  {
    id: "apt2",
    patientId: "pat1",
    doctorId: "doc2",
    date: "2025-04-15",
    time: "2:30 PM",
    status: "pending",
    reason: "Headaches",
    doctor: mockDoctors[1],
  },
  {
    id: "apt3",
    patientId: "pat1",
    doctorId: "doc3",
    date: "2025-03-27",
    time: "11:00 AM",
    status: "completed",
    reason: "Flu symptoms",
    doctor: mockDoctors[2],
  },
  {
    id: "apt4",
    patientId: "pat1",
    doctorId: "doc1",
    date: "2025-03-05",
    time: "9:00 AM",
    status: "cancelled",
    reason: "Vaccination",
    doctor: mockDoctors[0],
  },
];

export default function Appointments() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [appointments, setAppointments] = useState(mockAppointments);

  const upcomingAppointments = appointments.filter(
    (apt) => apt.status === "confirmed" || apt.status === "pending"
  );
  
  const pastAppointments = appointments.filter(
    (apt) => apt.status === "completed" || apt.status === "cancelled"
  );

  const handleCancelAppointment = (appointmentId: string) => {
    setAppointments(
      appointments.map((apt) =>
        apt.id === appointmentId ? { ...apt, status: "cancelled" } : apt
      )
    );
    
    toast({
      title: "Appointment Cancelled",
      description: "Your appointment has been cancelled successfully.",
    });
  };

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
