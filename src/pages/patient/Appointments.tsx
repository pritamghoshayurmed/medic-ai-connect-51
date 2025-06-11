import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ChevronLeft,
  CalendarRange,
  MessageSquare,
  Video,
  Phone,
  Calendar,
  Clock,
  MapPin,
  AlarmClock,
  Plus,
  Search
} from "lucide-react";
import { format, addDays, isSameDay } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import BottomNavigation from "@/components/BottomNavigation";
import { toast } from "sonner";

interface Appointment {
  id: string;
  doctor: {
    id: string;
    full_name: string;
    specialties?: string[];
    profile_pic?: string;
  };
  specialties?: {
    name: string;
  }[];
  appointment_date: string;
  appointment_time: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  meeting_link?: string;
  appointment_type: 'video' | 'in_person' | 'phone';
  notes?: string;
  location?: string;
}

export default function Appointments() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  useEffect(() => {
    if (!user?.id) return;
    
    const fetchAppointments = async () => {
      setLoading(true);
      try {
        // Mock appointment data instead of database call
        const mockAppointments: Appointment[] = [
          {
            id: "1",
            doctor: {
              id: "d1",
              full_name: "Dr. Priya Sharma",
              specialties: ["Cardiologist"],
              profile_pic: "/doctor-avatar-1.png"
            },
            specialties: [{ name: "Cardiology" }],
            appointment_date: new Date().toISOString().split('T')[0],
            appointment_time: "10:30 AM",
            status: 'confirmed',
            meeting_link: "https://meet.google.com/abc-defg-hij",
            appointment_type: 'video',
            notes: "Follow-up appointment",
            location: "Apollo Hospital, Suite 302"
          },
          {
            id: "2",
            doctor: {
              id: "d2",
              full_name: "Dr. Samridhi Dev",
              specialties: ["Orthopedic"],
              profile_pic: "/doctor-avatar-2.png"
            },
            specialties: [{ name: "Orthopedics" }],
            appointment_date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
            appointment_time: "2:15 PM",
            status: 'pending',
            appointment_type: 'in_person',
            location: "City Hospital, Room 405"
          },
          {
            id: "3",
            doctor: {
              id: "d3",
              full_name: "Dr. Koushik Das",
              specialties: ["Neurologist"],
              profile_pic: "/doctor-avatar-3.png"
            },
            specialties: [{ name: "Neurology" }],
            appointment_date: new Date(Date.now() - 86400000).toISOString().split('T')[0], // Yesterday
            appointment_time: "11:00 AM",
            status: 'completed',
            appointment_type: 'video',
            notes: "Initial consultation"
          }
        ];
        
        setAppointments(mockAppointments);
        setFilteredAppointments(mockAppointments);
        
        // Filter by default (today)
        handleDateSelection(selectedDate);
      } catch (error) {
        console.error("Error:", error);
        toast.error("An error occurred");
      } finally {
        setLoading(false);
      }
    };
    
    fetchAppointments();
  }, [user?.id]);
  
  // Filter appointments by search term
  useEffect(() => {
    if (searchTerm.trim() === "") {
      handleDateSelection(selectedDate);
    } else {
      const filtered = appointments.filter(
        appointment => 
          appointment.doctor.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (appointment.specialties && 
           appointment.specialties.some(s => 
             s.name.toLowerCase().includes(searchTerm.toLowerCase())
           ))
      );
      setFilteredAppointments(filtered);
    }
  }, [searchTerm, appointments]);

  const handleDateSelection = (date: Date) => {
    setSelectedDate(date);
    
    if (searchTerm.trim() !== "") return;
    
    // Filter appointments based on selected date
    const filtered = appointments.filter(appointment => 
      isSameDay(new Date(appointment.appointment_date), date)
    );
    
    setFilteredAppointments(filtered);
  };
  
  const statusColors = {
    pending: { bg: 'bg-amber-100', text: 'text-amber-600' },
    confirmed: { bg: 'bg-blue-100', text: 'text-blue-600' },
    cancelled: { bg: 'bg-red-100', text: 'text-red-600' },
    completed: { bg: 'bg-green-100', text: 'text-green-600' },
  };
  
  const appointmentTypeIcons = {
    video: <Video className="h-4 w-4" />,
    in_person: <MapPin className="h-4 w-4" />,
    phone: <Phone className="h-4 w-4" />
  };
  
  const getNextWeekDates = () => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      dates.push(addDays(new Date(), i));
    }
    return dates;
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-[#004953] via-[#006064] to-[#00363a]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00C389]"></div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#004953] via-[#006064] to-[#00363a] pb-24">
      <div className="w-full max-w-[425px] mx-auto px-5">
        {/* Header */}
        <div className="flex items-center justify-between pt-5 pb-4">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-white mr-2" 
              onClick={() => navigate(-1)}
            >
              <ChevronLeft size={24} />
            </Button>
            <h1 className="text-xl font-bold text-white">My Appointments</h1>
          </div>
          <Button 
            className="bg-[#00C389] hover:bg-[#00A070] text-white"
            size="sm"
            onClick={() => navigate('/patient/find-doctor')}
          >
            <Plus size={16} className="mr-1" />
            New
          </Button>
        </div>
        
        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input 
            className="pl-9 bg-white border-0 shadow-md text-gray-800 placeholder:text-gray-400"
            placeholder="Search doctor or specialty..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        {/* Date Selector */}
        <div className="mb-5 overflow-x-auto scrollbar-hide">
          <div className="flex space-x-2 py-1">
            {getNextWeekDates().map((date, index) => {
              const isSelected = isSameDay(date, selectedDate);
              const isToday = isSameDay(date, new Date());
              
              return (
                <Button
                  key={index}
                  onClick={() => handleDateSelection(date)}
                  className={`
                    flex flex-col items-center justify-center min-w-[70px] h-[72px] rounded-xl
                    ${isSelected ? 'bg-white text-[#004953]' : 'bg-[rgba(255,255,255,0.15)] hover:bg-[rgba(255,255,255,0.25)] text-white'}
                  `}
                  variant="ghost"
                >
                  <span className="text-[10px] uppercase">
                    {format(date, 'EEE')}
                  </span>
                  <span className={`text-xl font-bold ${isToday ? 'text-[#00C389]' : ''}`}>
                    {format(date, 'd')}
                  </span>
                  <span className="text-[10px] uppercase">
                    {format(date, 'MMM')}
                  </span>
                </Button>
              );
            })}
          </div>
        </div>
        
        {/* Tabs */}
        <Tabs defaultValue="all" className="mb-5">
          <TabsList className="grid grid-cols-4 bg-[#00363a]/10 border border-white/10 rounded-lg">
            <TabsTrigger value="all" className="rounded-md data-[state=active]:bg-white data-[state=active]:text-[#004953]">
              All
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="rounded-md data-[state=active]:bg-white data-[state=active]:text-[#004953]">
              Upcoming
            </TabsTrigger>
            <TabsTrigger value="completed" className="rounded-md data-[state=active]:bg-white data-[state=active]:text-[#004953]">
              Completed
            </TabsTrigger>
            <TabsTrigger value="cancelled" className="rounded-md data-[state=active]:bg-white data-[state=active]:text-[#004953]">
              Cancelled
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="mt-4 space-y-4">
            {filteredAppointments.length > 0 ? (
              filteredAppointments.map((appointment) => (
                <AppointmentCard 
                  key={appointment.id} 
                  appointment={appointment} 
                  navigate={navigate} 
                  statusColors={statusColors}
                  appointmentTypeIcons={appointmentTypeIcons}
                />
              ))
            ) : (
              <EmptyAppointmentState date={selectedDate} />
            )}
          </TabsContent>
          
          <TabsContent value="upcoming" className="mt-4 space-y-4">
            {filteredAppointments.filter(a => ['pending', 'confirmed'].includes(a.status)).length > 0 ? (
              filteredAppointments
                .filter(a => ['pending', 'confirmed'].includes(a.status))
                .map((appointment) => (
                  <AppointmentCard 
                    key={appointment.id} 
                    appointment={appointment} 
                    navigate={navigate} 
                    statusColors={statusColors}
                    appointmentTypeIcons={appointmentTypeIcons}
                  />
                ))
            ) : (
              <EmptyAppointmentState date={selectedDate} filter="upcoming" />
            )}
          </TabsContent>
          
          <TabsContent value="completed" className="mt-4 space-y-4">
            {filteredAppointments.filter(a => a.status === 'completed').length > 0 ? (
              filteredAppointments
                .filter(a => a.status === 'completed')
                .map((appointment) => (
                  <AppointmentCard 
                    key={appointment.id} 
                    appointment={appointment} 
                    navigate={navigate} 
                    statusColors={statusColors}
                    appointmentTypeIcons={appointmentTypeIcons}
                  />
                ))
            ) : (
              <EmptyAppointmentState date={selectedDate} filter="completed" />
            )}
          </TabsContent>
          
          <TabsContent value="cancelled" className="mt-4 space-y-4">
            {filteredAppointments.filter(a => a.status === 'cancelled').length > 0 ? (
              filteredAppointments
                .filter(a => a.status === 'cancelled')
                .map((appointment) => (
                  <AppointmentCard 
                    key={appointment.id} 
                    appointment={appointment} 
                    navigate={navigate} 
                    statusColors={statusColors}
                    appointmentTypeIcons={appointmentTypeIcons}
                  />
                ))
            ) : (
              <EmptyAppointmentState date={selectedDate} filter="cancelled" />
            )}
          </TabsContent>
        </Tabs>
      </div>
      
      <BottomNavigation />
    </div>
  );
}

interface AppointmentCardProps {
  appointment: Appointment;
  navigate: any;
  statusColors: any;
  appointmentTypeIcons: any;
}

function AppointmentCard({ appointment, navigate, statusColors, appointmentTypeIcons }: AppointmentCardProps) {
  const statusColor = statusColors[appointment.status];
  const appointmentIcon = appointmentTypeIcons[appointment.appointment_type];
  
  return (
    <Card 
      className="rounded-[15px] shadow-lg border-0 cursor-pointer hover:shadow-xl transition-shadow bg-white"
      onClick={() => navigate(`/patient/appointments/${appointment.id}`)}
    >
      <div className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex items-center">
            <Avatar className="h-12 w-12 mr-3">
              <AvatarFallback className="bg-[#004953]/10 text-[#004953]">
                {appointment.doctor.full_name.split(' ').map((n: string) => n[0]).join('')}
              </AvatarFallback>
              {appointment.doctor.profile_pic && (
                <AvatarImage src={appointment.doctor.profile_pic} alt={appointment.doctor.full_name} />
              )}
            </Avatar>
            <div>
              <h3 className="font-semibold text-[#004953]">Dr. {appointment.doctor.full_name}</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {appointment.specialties?.[0]?.name || "General Practitioner"}
              </p>
            </div>
          </div>
          <Badge className={`font-normal ${statusColor.bg} ${statusColor.text}`}>
            {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
          </Badge>
        </div>
        
        <div className="mt-4 space-y-2">
          <div className="flex items-center text-sm">
            <div className="w-8 h-8 rounded-full bg-[#F5FBFA] flex items-center justify-center mr-2">
              <Calendar className="h-4 w-4 text-[#00C389]" />
            </div>
            <span className="text-gray-700">
              {format(new Date(appointment.appointment_date), "EEEE, MMMM d, yyyy")}
            </span>
          </div>
          
          <div className="flex items-center text-sm">
            <div className="w-8 h-8 rounded-full bg-[#F5FBFA] flex items-center justify-center mr-2">
              <Clock className="h-4 w-4 text-[#00C389]" />
            </div>
            <span className="text-gray-700">{appointment.appointment_time}</span>
          </div>
          
          <div className="flex items-center text-sm">
            <div className="w-8 h-8 rounded-full bg-[#F5FBFA] flex items-center justify-center mr-2">
              {appointmentIcon}
            </div>
            <span className="text-gray-700 capitalize">
              {appointment.appointment_type.replace('_', ' ')} Consultation
            </span>
          </div>
        </div>
        
        {appointment.status === 'confirmed' && (
          <div className="mt-4 flex gap-2">
            <Button 
              className="flex-1 bg-[#00C389] hover:bg-[#00A070] text-white"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                // Handle joining appointment
                if (appointment.meeting_link) {
                  window.open(appointment.meeting_link, '_blank');
                } else {
                  toast.info("Meeting link not available");
                }
              }}
            >
              {appointment.appointment_type === 'video' 
                ? <Video className="h-4 w-4 mr-2" /> 
                : appointment.appointment_type === 'phone' 
                  ? <Phone className="h-4 w-4 mr-2" /> 
                  : <MapPin className="h-4 w-4 mr-2" />
              }
              {appointment.appointment_type === 'video' 
                ? 'Join Call' 
                : appointment.appointment_type === 'phone' 
                  ? 'Call' 
                  : 'Directions'
              }
            </Button>
            
            <Button
              variant="outline" 
              className="flex-1 border-gray-200 text-[#004953]"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/patient/chat/${appointment.doctor.id}`);
              }}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Message
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}

interface EmptyAppointmentStateProps {
  date: Date;
  filter?: string;
}

function EmptyAppointmentState({ date, filter }: EmptyAppointmentStateProps) {
  const dateString = format(date, "MMMM d, yyyy");
  let message = `No appointments for ${dateString}`;
  
  if (filter) {
    message = `No ${filter} appointments for ${dateString}`;
  }
  
  return (
    <div className="bg-white rounded-[15px] p-8 text-center shadow-lg">
      <div className="w-16 h-16 bg-[#F5FBFA] rounded-full flex items-center justify-center mx-auto mb-4">
        <CalendarRange className="h-8 w-8 text-[#00C389]" />
      </div>
      <h3 className="text-lg font-medium text-[#004953] mb-2">No Appointments Found</h3>
      <p className="text-gray-500 mb-4">{message}</p>
      <Button 
        className="bg-[#00C389] hover:bg-[#00A070] text-white"
        onClick={() => {/* Handle booking appointment */}}
      >
        Book an Appointment
      </Button>
    </div>
  );
}
