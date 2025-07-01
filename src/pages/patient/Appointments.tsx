import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
import { format, addDays, isSameDay, parseISO } from "date-fns"; // Added parseISO
// import { supabase } from "@/integrations/supabase/client"; // No longer needed for direct calls here
import { appointmentService } from "@/services/appointmentService"; // Import the service
import { Appointment } from "@/types"; // Import the global Appointment type
import { Input } from "@/components/ui/input";
import BottomNavigation from "@/components/BottomNavigation";
import { toast } from "sonner";


export default function Appointments() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [refreshKey, setRefreshKey] = useState(0);

  const location = useLocation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [refreshKey, setRefreshKey] = useState(0); // Keep for now, might be useful

  useEffect(() => {
    // This effect can be used to highlight a new appointment if its ID is passed in location.state
    if (location.state?.newAppointmentId) {
      // Potentially scroll to or highlight the new appointment
      // For now, just clear the state and allow refresh if needed
      console.log("New appointment ID from state:", location.state.newAppointmentId);
      navigate(location.pathname, { replace: true, state: {} });
      // setRefreshKey(prev => prev + 1); // Trigger re-fetch if needed, or rely on cache invalidation
    }
  }, [location.state, navigate]);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false); // Not logged in, nothing to load
      return;
    }
    
    const fetchAppointmentsForPatient = async () => {
      setLoading(true);
      try {
        console.log(`Fetching appointments for patient ID: ${user.id}`);
        const fetchedAppointments = await appointmentService.getAppointmentsForPatient(user.id);
        setAppointments(fetchedAppointments);
        // Initial filter based on the initially selected date (today)
        filterAppointmentsByDateAndSearch(fetchedAppointments, selectedDate, searchTerm);
        console.log(`Appointments loaded successfully: ${fetchedAppointments.length}`);
      } catch (error: any) {
        console.error("Error fetching appointments:", error);
        toast.error(`Failed to load appointments: ${error.message || "Unknown error"}`);
        setAppointments([]); // Clear appointments on error
        setFilteredAppointments([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAppointmentsForPatient();
  }, [user?.id, refreshKey]); // Removed selectedDate from here, filtering is separate

  // Combined filter function
  const filterAppointmentsByDateAndSearch = (
    sourceAppointments: Appointment[],
    dateToFilter: Date,
    currentSearchTerm: string
  ) => {
    let dateFiltered = sourceAppointments.filter(appointment => {
      if (!appointment.appointment_date) return false;
      // Ensure appointment_date is treated as UTC to avoid timezone issues with isSameDay
      // Supabase date type is 'YYYY-MM-DD'. parseISO will interpret this correctly.
      const appointmentDate = parseISO(appointment.appointment_date);
      return isSameDay(appointmentDate, dateToFilter);
    });

    if (currentSearchTerm.trim() !== "") {
      const lowerSearchTerm = currentSearchTerm.toLowerCase();
      dateFiltered = dateFiltered.filter(appointment =>
        (appointment.doctor?.full_name?.toLowerCase() || "").includes(lowerSearchTerm) ||
        (appointment.doctor?.specialties?.[0]?.name?.toLowerCase() || "").includes(lowerSearchTerm) || // Check first specialty
        (appointment.reason?.toLowerCase() || "").includes(lowerSearchTerm)
      );
    }
    setFilteredAppointments(dateFiltered);
  };

  // Effect for handling date selection changes
  useEffect(() => {
    filterAppointmentsByDateAndSearch(appointments, selectedDate, searchTerm);
  }, [selectedDate, appointments]); // Re-filter when date changes or base appointments load

  // Effect for handling search term changes
  useEffect(() => {
    filterAppointmentsByDateAndSearch(appointments, selectedDate, searchTerm);
  }, [searchTerm, appointments]); // Re-filter when search term changes or base appointments load


  const handleDateSelection = (date: Date) => {
    setSelectedDate(date); // This will trigger the useEffect above
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
        
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input 
            className="pl-9 bg-white border-0 shadow-md"
            placeholder="Search doctor or specialty..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
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
      className="rounded-[15px] shadow-lg border-0 cursor-pointer hover:shadow-xl transition-shadow"
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
              <h3 className="font-semibold text-[#004953]">
                {appointment.doctor?.full_name ? `Dr. ${appointment.doctor.full_name}` : 'N/A'}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {appointment.doctor?.specialties?.[0]?.name || "General Practitioner"}
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
  const navigate = useNavigate();
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
        onClick={() => navigate('/patient/book-appointment')}
      >
        Book an Appointment
      </Button>
    </div>
  );
}
