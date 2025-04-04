
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft, Calendar } from "lucide-react";
import BottomNavigation from "@/components/BottomNavigation";
import AppointmentCard from "@/components/AppointmentCard";
import { Appointment, Patient } from "@/types";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

// Mock data
const mockPatients: Patient[] = [
  {
    id: "pat1",
    name: "John Doe",
    email: "john@example.com",
    phone: "+1234567890",
    role: "patient",
    dateOfBirth: "1980-05-15",
    bloodType: "A+",
  },
  {
    id: "pat2",
    name: "Jane Smith",
    email: "jane@example.com",
    phone: "+1234567891",
    role: "patient",
    dateOfBirth: "1992-10-20",
    bloodType: "O-",
  },
  {
    id: "pat3",
    name: "Robert Johnson",
    email: "robert@example.com",
    phone: "+1234567892",
    role: "patient",
    dateOfBirth: "1975-03-08",
    bloodType: "B+",
  },
];

const mockAppointments: (Appointment & { patient: Patient })[] = [
  {
    id: "apt1",
    patientId: "pat1",
    doctorId: "doc1",
    date: "2025-04-10",
    time: "10:00 AM",
    status: "confirmed",
    reason: "Regular checkup",
    patient: mockPatients[0],
  },
  {
    id: "apt2",
    patientId: "pat2",
    doctorId: "doc1",
    date: "2025-04-10",
    time: "11:30 AM",
    status: "confirmed",
    reason: "Headaches",
    patient: mockPatients[1],
  },
  {
    id: "apt3",
    patientId: "pat3",
    doctorId: "doc1",
    date: "2025-04-15",
    time: "2:00 PM",
    status: "pending",
    reason: "Back pain",
    patient: mockPatients[2],
  },
  {
    id: "apt4",
    patientId: "pat1",
    doctorId: "doc1",
    date: "2025-03-28",
    time: "9:30 AM",
    status: "completed",
    reason: "Follow-up checkup",
    patient: mockPatients[0],
  },
  {
    id: "apt5",
    patientId: "pat2",
    doctorId: "doc1",
    date: "2025-03-20",
    time: "3:00 PM",
    status: "cancelled",
    reason: "Skin rash",
    patient: mockPatients[1],
  },
];

export default function DoctorAppointments() {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [appointments, setAppointments] = useState(mockAppointments);

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
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
                person={appointment.patient}
              />
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
