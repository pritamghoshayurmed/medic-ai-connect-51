
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
];

export default function PatientDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [upcomingAppointments, setUpcomingAppointments] = useState(mockAppointments);
  const [recommendedDoctors, setRecommendedDoctors] = useState(mockDoctors);

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
        
        {upcomingAppointments.length > 0 ? (
          upcomingAppointments.slice(0, 2).map((appointment) => (
            <AppointmentCard
              key={appointment.id}
              appointment={appointment}
              person={appointment.doctor}
              onCancel={() => {
                // Handle cancellation logic
                const updated = upcomingAppointments.filter(apt => apt.id !== appointment.id);
                setUpcomingAppointments(updated);
              }}
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
        
        {recommendedDoctors.map((doctor) => (
          <DoctorCard
            key={doctor.id}
            doctor={doctor}
            onBookAppointment={() => navigate(`/patient/find-doctor?doctor=${doctor.id}`)}
          />
        ))}
      </div>

      <BottomNavigation />
    </div>
  );
}
