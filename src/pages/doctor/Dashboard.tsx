
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Calendar, Users, Activity, FileSearch, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import BottomNavigation from "@/components/BottomNavigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Appointment, Patient } from "@/types";
import AppointmentCard from "@/components/AppointmentCard";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

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
    date: "2025-04-10",
    time: "2:00 PM",
    status: "pending",
    reason: "Back pain",
    patient: mockPatients[2],
  },
];

const weeklyStats = [
  { day: "Mon", patients: 8 },
  { day: "Tue", patients: 12 },
  { day: "Wed", patients: 10 },
  { day: "Thu", patients: 15 },
  { day: "Fri", patients: 11 },
  { day: "Sat", patients: 6 },
  { day: "Sun", patients: 0 },
];

export default function DoctorDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [todayAppointments, setTodayAppointments] = useState(mockAppointments);
  const [upcomingAppointments, setUpcomingAppointments] = useState(mockAppointments);

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="bg-primary text-white p-4">
        <div className="flex justify-between items-center mb-2">
          <div>
            <h1 className="text-2xl font-bold">Hello, {user?.name?.split(" ")[1] || "Doctor"}</h1>
            <p className="text-white text-opacity-80">Welcome back</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center">
            <span className="text-primary text-xl font-bold">{user?.name?.charAt(0)}</span>
          </div>
        </div>
        
        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="bg-white bg-opacity-10 rounded-lg p-3">
            <p className="text-white text-opacity-80 text-sm">Today's Patients</p>
            <p className="text-xl font-bold">{todayAppointments.length}</p>
          </div>
          <div className="bg-white bg-opacity-10 rounded-lg p-3">
            <p className="text-white text-opacity-80 text-sm">Total Patients</p>
            <p className="text-xl font-bold">124</p>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="px-4 py-4 grid grid-cols-4 gap-2">
        <Button
          variant="outline"
          className="flex flex-col items-center justify-center h-20 p-2 space-y-1"
          onClick={() => navigate("/doctor/appointments")}
        >
          <Calendar className="h-6 w-6" />
          <span className="text-xs">Schedule</span>
        </Button>
        <Button
          variant="outline"
          className="flex flex-col items-center justify-center h-20 p-2 space-y-1"
          onClick={() => navigate("/doctor/chat-rooms")}
        >
          <Users className="h-6 w-6" />
          <span className="text-xs">Consult</span>
        </Button>
        <Button
          variant="outline"
          className="flex flex-col items-center justify-center h-20 p-2 space-y-1"
          onClick={() => navigate("/doctor/analytics")}
        >
          <Activity className="h-6 w-6" />
          <span className="text-xs">Analytics</span>
        </Button>
        <Button
          variant="outline"
          className="flex flex-col items-center justify-center h-20 p-2 space-y-1"
          onClick={() => navigate("/doctor/diagnosis")}
        >
          <FileSearch className="h-6 w-6" />
          <span className="text-xs">Diagnosis</span>
        </Button>
      </div>

      {/* Weekly Stats */}
      <div className="px-4 py-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Weekly Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={weeklyStats}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="patients" fill="#2563EB" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Appointments */}
      <div className="px-4 py-2">
        <Tabs defaultValue="today" className="w-full">
          <TabsList className="grid grid-cols-2 w-full mb-2">
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          </TabsList>
          
          {/* Today's Appointments */}
          <TabsContent value="today">
            <h3 className="font-bold mb-3">Today's Appointments</h3>
            {todayAppointments.length > 0 ? (
              todayAppointments.map((appointment) => (
                <AppointmentCard
                  key={appointment.id}
                  appointment={appointment}
                  person={appointment.patient}
                />
              ))
            ) : (
              <div className="text-center py-6 bg-gray-50 rounded-lg">
                <p className="text-gray-500">No appointments for today</p>
              </div>
            )}
          </TabsContent>
          
          {/* Upcoming Appointments */}
          <TabsContent value="upcoming">
            <h3 className="font-bold mb-3">Upcoming Appointments</h3>
            {upcomingAppointments.length > 0 ? (
              upcomingAppointments.map((appointment) => (
                <AppointmentCard
                  key={appointment.id}
                  appointment={appointment}
                  person={appointment.patient}
                />
              ))
            ) : (
              <div className="text-center py-6 bg-gray-50 rounded-lg">
                <p className="text-gray-500">No upcoming appointments</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <BottomNavigation />
    </div>
  );
}
