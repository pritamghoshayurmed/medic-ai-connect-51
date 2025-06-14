import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Calendar, Users, Activity, FileSearch } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import BottomNavigation from "@/components/BottomNavigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Appointment, Patient } from "@/types";
import AppointmentCard from "@/components/AppointmentCard";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

// Get current date in YYYY-MM-DD format
const getTodayDateString = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

export default function DoctorDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [todayAppointments, setTodayAppointments] = useState<(Appointment & { patient: Patient })[]>([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState<(Appointment & { patient: Patient })[]>([]);
  const [weeklyStats, setWeeklyStats] = useState<{ day: string; patients: number }[]>([]);
  const [totalPatients, setTotalPatients] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // Get today's date in YYYY-MM-DD format
        const todayDate = getTodayDateString();
        
        // Fetch today's appointments
        const { data: todayData, error: todayError } = await supabase
          .from('appointments')
          .select(`
            id,
            patient_id,
            appointment_date,
            appointment_time,
            status,
            symptoms
          `)
          .eq('doctor_id', user.id)
          .eq('appointment_date', todayDate)
          .order('appointment_time', { ascending: true });

        if (todayError) throw todayError;

        // Fetch upcoming appointments (excluding today)
        const { data: upcomingData, error: upcomingError } = await supabase
          .from('appointments')
          .select(`
            id,
            patient_id,
            appointment_date,
            appointment_time,
            status,
            symptoms
          `)
          .eq('doctor_id', user.id)
          .gt('appointment_date', todayDate)
          .in('status', ['pending', 'confirmed'])
          .order('appointment_date', { ascending: true })
          .order('appointment_time', { ascending: true })
          .limit(5);

        if (upcomingError) throw upcomingError;

        // Fetch patient details for all appointments
        const patientIds = new Set([
          ...todayData.map(apt => apt.patient_id),
          ...upcomingData.map(apt => apt.patient_id)
        ]);

        // Fetch patient profiles in bulk
        const { data: patientProfiles, error: patientError } = await supabase
          .from('profiles')
          .select('*')
          .in('id', Array.from(patientIds));

        if (patientError) throw patientError;

        // Create a map of patient profiles for easy access
        const patientMap = new Map(
          patientProfiles.map(profile => [profile.id, profile])
        );

        // Format appointments with patient data
        const formatAppointments = (appointments: any[]) => {
          return appointments.map(apt => {
            const patientProfile = patientMap.get(apt.patient_id);
            if (!patientProfile) return null;

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
                typedStatus = 'pending';
            }
            
            return {
              id: apt.id,
              patientId: apt.patient_id,
              doctorId: user.id,
              date: apt.appointment_date,
              time: apt.appointment_time,
              status: typedStatus,
              reason: apt.symptoms || "General checkup",
              patient: {
                id: patientProfile.id,
                name: patientProfile.full_name,
                email: patientProfile.email,
                phone: patientProfile.phone || "",
                role: 'patient' as const
              }
            };
          }).filter(Boolean) as (Appointment & { patient: Patient })[];
        };

        setTodayAppointments(formatAppointments(todayData));
        setUpcomingAppointments(formatAppointments(upcomingData));

        // Calculate weekly stats (appointments count for last 7 days) - OPTIMIZED
        const today = new Date();
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(today.getDate() - 6); // 6 days ago to include today in a 7-day window

        const sevenDaysAgoString = sevenDaysAgo.toISOString().split('T')[0];
        const todayString = today.toISOString().split('T')[0];

        const { data: weeklyAppointmentData, error: weeklyError } = await supabase
          .from('appointments')
          .select('appointment_date, id') // Select only necessary fields
          .eq('doctor_id', user.id)
          .gte('appointment_date', sevenDaysAgoString)
          .lte('appointment_date', todayString);

        if (weeklyError) throw weeklyError;

        const countsByDate: { [key: string]: number } = {};
        if (weeklyAppointmentData) {
          for (const appt of weeklyAppointmentData) {
            countsByDate[appt.appointment_date] = (countsByDate[appt.appointment_date] || 0) + 1;
          }
        }

        const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const newWeeklyStats = [];
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(today.getDate() - i);
          const dateString = date.toISOString().split('T')[0];
          const dayName = daysOfWeek[date.getDay()];
          newWeeklyStats.push({
            day: dayName,
            patients: countsByDate[dateString] || 0,
          });
        }
        setWeeklyStats(newWeeklyStats);

        // Get total unique patients
        const { count: patientCount, error: totalPatientsError } = await supabase
          .from('appointments')
          .select('patient_id', { count: 'exact', head: true })
          .eq('doctor_id', user.id);

        if (countError) throw countError;
        setTotalPatients(patientCount || 0);

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        toast({
          title: "Error",
          description: "Failed to load dashboard data",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user, toast]);

  const handleAppointmentAction = async (appointmentId: string, action: 'confirm' | 'cancel' | 'complete') => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Update appointment status
      const status = action === 'confirm' ? 'confirmed' : action === 'cancel' ? 'cancelled' : 'completed';
      
      const { error } = await supabase
        .from('appointments')
        .update({ status })
        .eq('id', appointmentId);

      if (error) throw error;

      // Get appointment details for notification
      const { data: appointmentData, error: fetchError } = await supabase
        .from('appointments')
        .select(`
          appointment_date,
          appointment_time,
          patient_id,
          profiles:patient_id (full_name)
        `)
        .eq('id', appointmentId)
        .single();

      if (fetchError) throw fetchError;

      // Create notification for the patient
      const actionText = action === 'confirm' ? 'confirmed' : action === 'cancel' ? 'cancelled' : 'completed';
      
      await supabase
        .from('notifications')
        .insert({
          user_id: appointmentData.patient_id,
          title: `Appointment ${actionText.charAt(0).toUpperCase() + actionText.slice(1)}`,
          message: `Your appointment on ${appointmentData.appointment_date} at ${appointmentData.appointment_time} has been ${actionText} by Dr. ${user.name}.`,
          type: 'appointment'
        });

      // Update UI
      const updateAppointments = (appointments: (Appointment & { patient: Patient })[]) => {
        return appointments.map(apt => 
          apt.id === appointmentId 
            ? { ...apt, status: status as 'confirmed' | 'cancelled' | 'completed' | 'pending' } 
            : apt
        );
      };

      setTodayAppointments(updateAppointments(todayAppointments));
      setUpcomingAppointments(updateAppointments(upcomingAppointments));

      toast({
        title: "Success",
        description: `Appointment has been ${actionText}.`
      });

    } catch (error) {
      console.error(`Error ${action}ing appointment:`, error);
      toast({
        title: "Error",
        description: `Failed to ${action} the appointment.`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pb-24 min-h-screen" style={{background: 'linear-gradient(135deg, #005A7A, #002838)'}}>
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white p-4">
        <div className="flex justify-between items-center mb-2">
          <div>
            <h1 className="text-2xl font-bold">Hello, {user?.name?.split(" ")[1] || "Doctor"}</h1>
            <p className="text-white text-opacity-90">Welcome back</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-lg">
            <span className="text-teal-600 text-xl font-bold">{user?.name?.charAt(0)}</span>
          </div>
        </div>
        
        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="bg-white bg-opacity-15 backdrop-blur-sm rounded-lg p-3 border border-white border-opacity-20">
            <p className="text-white text-opacity-90 text-sm">Today's Patients</p>
            <p className="text-xl font-bold">{todayAppointments.length}</p>
          </div>
          <div className="bg-white bg-opacity-15 backdrop-blur-sm rounded-lg p-3 border border-white border-opacity-20">
            <p className="text-white text-opacity-90 text-sm">Total Patients</p>
            <p className="text-xl font-bold">{totalPatients}</p>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-4 p-4">
        <Button
          variant="outline"
          className="flex flex-col items-center justify-center h-20 p-2 space-y-1 bg-white bg-opacity-10 backdrop-blur-sm border-white border-opacity-20 text-white hover:bg-white hover:bg-opacity-20 hover:text-white"
          onClick={() => navigate("/doctor/appointments")}
        >
          <Calendar className="h-6 w-6" />
          <span className="text-xs">Schedule</span>
        </Button>
        <Button
          variant="outline"
          className="flex flex-col items-center justify-center h-20 p-2 space-y-1 bg-white bg-opacity-10 backdrop-blur-sm border-white border-opacity-20 text-white hover:bg-white hover:bg-opacity-20 hover:text-white"
          onClick={() => navigate("/doctor/chat-rooms")}
        >
          <Users className="h-6 w-6" />
          <span className="text-xs">Consult</span>
        </Button>
        <Button
          variant="outline"
          className="flex flex-col items-center justify-center h-20 p-2 space-y-1 bg-white bg-opacity-10 backdrop-blur-sm border-white border-opacity-20 text-white hover:bg-white hover:bg-opacity-20 hover:text-white"
          onClick={() => navigate("/doctor/analytics")}
        >
          <Activity className="h-6 w-6" />
          <span className="text-xs">Analysis</span>
        </Button>
        <Button
          variant="outline"
          className="flex flex-col items-center justify-center h-20 p-2 space-y-1 bg-white bg-opacity-10 backdrop-blur-sm border-white border-opacity-20 text-white hover:bg-white hover:bg-opacity-20 hover:text-white"
          onClick={() => navigate("/doctor/diagnosis-engine")}
        >
          <FileSearch className="h-6 w-6" />
          <span className="text-xs">Diagnosis</span>
        </Button>
      </div>

      {/* Weekly Stats */}
      <div className="px-4 py-2">
        <Card className="bg-white bg-opacity-10 backdrop-blur-sm border-white border-opacity-20">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-white">Weekly Stats</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-48">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={weeklyStats}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.2)" />
                  <XAxis dataKey="day" tick={{ fill: 'white' }} />
                  <YAxis tick={{ fill: 'white' }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255,255,255,0.9)', 
                      border: 'none', 
                      borderRadius: '8px',
                      color: '#0f766e'
                    }} 
                  />
                  <Bar dataKey="patients" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Appointments */}
      <div className="px-4 py-2">
        <Tabs defaultValue="today" className="w-full">
          <TabsList className="grid grid-cols-2 w-full mb-2 bg-white bg-opacity-10 backdrop-blur-sm border-white border-opacity-20">
            <TabsTrigger value="today" className="text-white data-[state=active]:bg-white data-[state=active]:text-teal-700">Today</TabsTrigger>
            <TabsTrigger value="upcoming" className="text-white data-[state=active]:bg-white data-[state=active]:text-teal-700">Upcoming</TabsTrigger>
          </TabsList>
          
          {/* Today's Appointments */}
          <TabsContent value="today">
            <h3 className="font-bold mb-3 text-white">Today's Appointments</h3>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              </div>
            ) : todayAppointments.length > 0 ? (
              todayAppointments.map((appointment) => (
                <div key={appointment.id} className="mb-4">
                  <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg border border-white border-opacity-20">
                    <AppointmentCard
                      key={appointment.id}
                      appointment={appointment}
                      person={appointment.patient}
                      onChat={() => navigate(`/doctor/chat/${appointment.patientId}`)}
                    />
                  </div>
                  {appointment.status === "pending" && (
                    <div className="flex gap-2 mt-2">
                      <Button 
                        variant="outline" 
                        className="flex-1 bg-green-500 hover:bg-green-600 text-white border-green-500"
                        onClick={() => handleAppointmentAction(appointment.id, 'confirm')}
                      >
                        Accept
                      </Button>
                      <Button 
                        variant="destructive" 
                        className="flex-1 bg-red-500 hover:bg-red-600"
                        onClick={() => handleAppointmentAction(appointment.id, 'cancel')}
                      >
                        Decline
                      </Button>
                    </div>
                  )}
                  {appointment.status === "confirmed" && (
                    <Button 
                      variant="outline" 
                      className="w-full mt-2 bg-blue-500 hover:bg-blue-600 text-white border-blue-500"
                      onClick={() => handleAppointmentAction(appointment.id, 'complete')}
                    >
                      Mark as Completed
                    </Button>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-6 bg-white bg-opacity-10 backdrop-blur-sm rounded-lg border border-white border-opacity-20">
                <p className="text-white text-opacity-80">No appointments for today</p>
              </div>
            )}
          </TabsContent>
          
          {/* Upcoming Appointments */}
          <TabsContent value="upcoming">
            <h3 className="font-bold mb-3 text-white">Upcoming Appointments</h3>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              </div>
            ) : upcomingAppointments.length > 0 ? (
              upcomingAppointments.map((appointment) => (
                <div key={appointment.id} className="mb-4">
                  <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg border border-white border-opacity-20">
                    <AppointmentCard
                      key={appointment.id}
                      appointment={appointment}
                      person={appointment.patient}
                      onChat={() => navigate(`/doctor/chat/${appointment.patientId}`)}
                    />
                  </div>
                  {appointment.status === "pending" && (
                    <div className="flex gap-2 mt-2">
                      <Button 
                        variant="outline" 
                        className="flex-1 bg-green-500 hover:bg-green-600 text-white border-green-500"
                        onClick={() => handleAppointmentAction(appointment.id, 'confirm')}
                      >
                        Accept
                      </Button>
                      <Button 
                        variant="destructive" 
                        className="flex-1 bg-red-500 hover:bg-red-600"
                        onClick={() => handleAppointmentAction(appointment.id, 'cancel')}
                      >
                        Decline
                      </Button>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-6 bg-white bg-opacity-10 backdrop-blur-sm rounded-lg border border-white border-opacity-20">
                <p className="text-white text-opacity-80">No upcoming appointments</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <BottomNavigation />
    </div>
  );
}