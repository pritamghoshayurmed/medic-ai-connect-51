import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  Users, 
  Activity, 
  FileSearch, 
  Bell, 
  Clock, 
  User, 
  CheckCircle,
  XCircle,
  CalendarClock
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import BottomNavigation from "@/components/BottomNavigation";
import Header from "@/components/Header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Appointment, Patient } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { format } from "date-fns";

// Get current date in YYYY-MM-DD format
const getTodayDateString = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

export default function DoctorDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Using a more flexible type definition to accommodate our UI needs
  interface EnhancedAppointment extends Appointment {
    patient: Patient;
    type?: 'in-person' | 'video' | 'phone';
  }
  
  const [todayAppointments, setTodayAppointments] = useState<EnhancedAppointment[]>([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState<EnhancedAppointment[]>([]);
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
              type: "in-person", // Default value since we don't have this in the database yet
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

        // Calculate weekly stats (appointments count for last 7 days)
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const today = new Date();
        const weekStats = [];

        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(today.getDate() - i);
          const dayName = days[date.getDay()];
          const dateString = date.toISOString().split('T')[0];

          // Fetch count of appointments for this day
          const { count, error: countError } = await supabase
            .from('appointments')
            .select('*', { count: 'exact', head: true })
            .eq('doctor_id', user.id)
            .eq('appointment_date', dateString);

          if (countError) throw countError;

          weekStats.push({
            day: dayName,
            patients: count || 0
          });
        }

        setWeeklyStats(weekStats);

        // Get total unique patients
        const { count: patientCount, error: countError } = await supabase
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
    try {
      let status: string;
      
      switch(action) {
        case 'confirm':
          status = 'confirmed';
          break;
        case 'cancel':
          status = 'cancelled';
          break;
        case 'complete':
          status = 'completed';
          break;
        default:
          throw new Error("Invalid action");
      }
      
      // Update the appointment status in the database
      const { error } = await supabase
        .from('appointments')
        .update({ status })
        .eq('id', appointmentId);
        
      if (error) throw error;
      
      // Show success message
      toast({
        title: "Success",
        description: `Appointment ${action}ed successfully`,
      });
      
      // Update the local state to reflect the change
      const updateAppointments = (appointments: (Appointment & { patient: Patient })[]) => {
        return appointments.map(apt => {
          if (apt.id === appointmentId) {
            return {
              ...apt,
              status: status as 'pending' | 'confirmed' | 'cancelled' | 'completed'
            };
          }
          return apt;
        });
      };
      
      setTodayAppointments(updateAppointments(todayAppointments));
      setUpcomingAppointments(updateAppointments(upcomingAppointments));
      
    } catch (error) {
      console.error("Error updating appointment:", error);
      toast({
        title: "Error",
        description: "Failed to update appointment status",
        variant: "destructive"
      });
    }
  };
  
  // Get formatted date for today
  const formattedDate = format(new Date(), "EEEE, MMMM d");

  // Get appointment status badge color
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'pending':
        return "bg-yellow-100 text-yellow-700";
      case 'confirmed':
        return "bg-blue-100 text-blue-600";
      case 'completed':
        return "bg-green-100 text-green-600";
      case 'cancelled':
        return "bg-red-100 text-red-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  // Generate data for pie chart
  const typeData = [
    { name: "In-Person", value: todayAppointments.filter(apt => apt.type === 'in-person').length || 1 },
    { name: "Video", value: todayAppointments.filter(apt => apt.type === 'video').length || 0 },
    { name: "Phone", value: todayAppointments.filter(apt => apt.type === 'phone').length || 0 }
  ];
  
  const COLORS = ['#00C389', '#0088FE', '#FF8042'];
  
  // Get appointment type icon
  const getAppointmentTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#00C389]"><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/></svg>;
      case 'phone':
        return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>;
      case 'in-person':
      default:
        return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-500"><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 1 0-16 0"/></svg>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-[#004953] via-[#006064] to-[#00363a]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00C389]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-[70px]">
      <Header title="Doctor Dashboard" />
      <div className="container px-4 pt-20">
        <div className="max-w-[425px] mx-auto px-5">
          {/* Header */}
          <div className="pt-5 pb-3">
            <div className="flex justify-between items-center">
              <h1 className="text-xl font-bold text-white">Doctor Dashboard</h1>
              <div className="flex">
                <Button variant="ghost" size="icon" className="text-white">
                  <Bell size={20} />
                </Button>
              </div>
            </div>
            <p className="text-white/80 text-sm mt-1">{formattedDate}</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="bg-white p-4 rounded-[15px] shadow-md flex flex-col items-center justify-center">
              <div className="w-10 h-10 rounded-full bg-[rgba(0,195,137,0.1)] flex items-center justify-center mb-2">
                <Users className="h-5 w-5 text-[#00C389]" />
              </div>
              <p className="text-gray-500 text-xs mb-1">Total Patients</p>
              <p className="text-2xl font-bold">{totalPatients}</p>
            </div>
            
            <div className="bg-white p-4 rounded-[15px] shadow-md flex flex-col items-center justify-center">
              <div className="w-10 h-10 rounded-full bg-[rgba(0,195,137,0.1)] flex items-center justify-center mb-2">
                <Calendar className="h-5 w-5 text-[#00C389]" />
              </div>
              <p className="text-gray-500 text-xs mb-1">Today's Appointments</p>
              <p className="text-2xl font-bold">{todayAppointments.length}</p>
            </div>
          </div>

          {/* Weekly Statistics */}
          <div className="bg-white rounded-[15px] shadow-md p-4 mb-5">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-[#004953] font-medium">Weekly Statistics</h2>
              <Activity className="h-5 w-5 text-[#00C389]" />
            </div>
            
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyStats}>
                  <XAxis dataKey="day" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ background: "white", border: "1px solid #eee", borderRadius: "8px" }}
                    labelStyle={{ fontWeight: "bold", color: "#004953" }}
                  />
                  <Bar
                    dataKey="patients"
                    fill="#00C389"
                    radius={[4, 4, 0, 0]}
                    name="Patients"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Appointment Types */}
          {todayAppointments.length > 0 && (
            <div className="bg-white rounded-[15px] shadow-md p-4 mb-5">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-[#004953] font-medium">Appointment Types</h2>
                <FileSearch className="h-5 w-5 text-[#00C389]" />
              </div>
              
              <div className="h-[180px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={typeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={70}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {typeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} appointments`, 'Count']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Today's Appointments */}
          <div className="bg-white rounded-[15px] shadow-md p-4 mb-5">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-[#004953] font-medium">Today's Appointments</h2>
              <Clock className="h-5 w-5 text-[#00C389]" />
            </div>
            
            {todayAppointments.length > 0 ? (
              <div className="space-y-3">
                {todayAppointments.map((appointment) => (
                  <div 
                    key={appointment.id} 
                    className="p-3 rounded-lg border border-gray-100 bg-gray-50 hover:bg-gray-100/70 transition-colors cursor-pointer"
                    onClick={() => navigate(`/doctor/appointment/${appointment.id}`)}
                  >
                    <div className="flex items-center mb-2">
                      <Avatar className="h-10 w-10 mr-3">
                        <AvatarFallback className="bg-[#004953]/10 text-[#004953]">
                          {appointment.patient.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <p className="font-medium text-[#004953]">{appointment.patient.name}</p>
                          <Badge className={getStatusColor(appointment.status)}>
                            {appointment.status}
                          </Badge>
                        </div>
                        <div className="flex items-center text-xs text-gray-500 mt-0.5">
                          {getAppointmentTypeIcon(appointment.type)}
                          <span className="ml-1 capitalize">{appointment.type}</span>
                          <span className="mx-1.5">•</span>
                          <Clock className="h-3 w-3 mr-1" />
                          {appointment.time}
                        </div>
                      </div>
                    </div>
                    
                    {appointment.status === 'pending' || appointment.status === 'confirmed' ? (
                      <div className="flex space-x-2 mt-2">
                        {appointment.status === 'pending' && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-blue-600 border-blue-200 hover:border-blue-300 hover:bg-blue-50 flex-1 h-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAppointmentAction(appointment.id, 'confirm');
                            }}
                          >
                            <CheckCircle className="h-3.5 w-3.5 mr-1" /> Confirm
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          className="bg-[#00C389] hover:bg-[#00A070] h-8 flex-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAppointmentAction(appointment.id, 'complete');
                          }}
                        >
                          <CheckCircle className="h-3.5 w-3.5 mr-1" /> Complete
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-red-600 border-red-200 hover:border-red-300 hover:bg-red-50 h-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAppointmentAction(appointment.id, 'cancel');
                          }}
                        >
                          <XCircle className="h-3.5 w-3.5 mr-1" /> Cancel
                        </Button>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="w-12 h-12 bg-[#004953]/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CalendarClock className="h-6 w-6 text-[#00C389]" />
                </div>
                <p className="text-gray-500">No appointments scheduled for today</p>
              </div>
            )}
          </div>

          {/* Upcoming Appointments */}
          <div className="bg-white rounded-[15px] shadow-md p-4 mb-5">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-[#004953] font-medium">Upcoming Appointments</h2>
              <Calendar className="h-5 w-5 text-[#00C389]" />
            </div>
            
            {upcomingAppointments.length > 0 ? (
              <div className="space-y-3">
                {upcomingAppointments.map((appointment) => (
                  <div 
                    key={appointment.id} 
                    className="p-3 rounded-lg border border-gray-100 bg-gray-50 hover:bg-gray-100/70 transition-colors cursor-pointer"
                    onClick={() => navigate(`/doctor/appointment/${appointment.id}`)}
                  >
                    <div className="flex items-center">
                      <Avatar className="h-10 w-10 mr-3">
                        <AvatarFallback className="bg-[#004953]/10 text-[#004953]">
                          {appointment.patient.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <p className="font-medium text-[#004953]">{appointment.patient.name}</p>
                          <Badge className={getStatusColor(appointment.status)}>
                            {appointment.status}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap text-xs text-gray-500 mt-0.5">
                          <span className="mr-1.5">
                            {format(new Date(appointment.date), "MMM d")}
                          </span>
                          <span className="mx-1.5">•</span>
                          <Clock className="h-3 w-3 mr-1" />
                          {appointment.time}
                          <span className="mx-1.5">•</span>
                          <span className="flex items-center">
                            {getAppointmentTypeIcon(appointment.type)}
                            <span className="ml-1 capitalize">{appointment.type}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="w-12 h-12 bg-[#004953]/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CalendarClock className="h-6 w-6 text-[#00C389]" />
                </div>
                <p className="text-gray-500">No upcoming appointments</p>
              </div>
            )}
            
            <div className="mt-4 text-center">
              <Button 
                className="bg-[#00C389] hover:bg-[#00A070] text-white w-full"
                onClick={() => navigate('/doctor/appointment')}
              >
                View All Appointments
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      <BottomNavigation />
    </div>
  );
}

