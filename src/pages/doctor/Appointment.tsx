import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import BottomNavigation from "@/components/BottomNavigation";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Video,
  Phone,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Search,
  Calendar as CalendarIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format, addDays, isSameDay } from "date-fns";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  appointment_date: string;
  appointment_time: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  appointment_type: 'video' | 'in-person' | 'phone';
  notes?: string;
  is_paid: boolean;
  patient?: {
    full_name: string;
    profile_pic?: string;
    age?: number;
    gender?: string;
  };
}

export default function DoctorAppointments() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    
    const fetchAppointments = async () => {
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
            appointment_type,
            notes,
            is_paid,
            patient:patient_id (
              full_name,
              profile_pic,
              age,
              gender
            )
          `)
          .eq('doctor_id', user.id)
          .order('appointment_date', { ascending: true });
        
        if (error) throw error;
        
        setAppointments(data || []);
      } catch (error) {
        console.error("Error fetching appointments:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAppointments();
  }, [user]);
  
  useEffect(() => {
    filterAppointments();
  }, [appointments, selectedDate, searchQuery]);
  
  const filterAppointments = () => {
    let filtered = [...appointments];
    
    // Filter by date
    if (selectedDate) {
      filtered = filtered.filter(app => {
        const appDate = new Date(app.appointment_date);
        return isSameDay(appDate, selectedDate);
      });
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(app => 
        app.patient?.full_name.toLowerCase().includes(query) ||
        app.appointment_time.toLowerCase().includes(query) ||
        app.status.toLowerCase().includes(query) ||
        app.appointment_type.toLowerCase().includes(query)
      );
    }
    
    setFilteredAppointments(filtered);
  };
  
  const updateAppointmentStatus = async (id: string, status: 'scheduled' | 'completed' | 'cancelled') => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status })
        .eq('id', id);
      
      if (error) throw error;
      
      // Update local state
      setAppointments(prev => 
        prev.map(app => app.id === id ? { ...app, status } : app)
      );
      
      setDetailsOpen(false);
    } catch (error) {
      console.error("Error updating appointment status:", error);
    }
  };
  
  // Generate next 7 days for date selector
  const dateOptions = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(new Date(), i);
    return {
      date,
      label: format(date, i === 0 ? "'Today'" : i === 1 ? "'Tomorrow'" : "E")
    };
  });
  
  const getAppointmentTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className="h-4 w-4 text-[#00C389]" />;
      case 'phone':
        return <Phone className="h-4 w-4 text-blue-500" />;
      case 'in-person':
      default:
        return <User className="h-4 w-4 text-orange-500" />;
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return "bg-blue-100 text-blue-600";
      case 'completed':
        return "bg-green-100 text-green-600";
      case 'cancelled':
      default:
        return "bg-red-100 text-red-600";
    }
  };
  
  const formattedDate = format(selectedDate, "EEEE, MMMM d");
  
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
        <div className="flex justify-between items-center w-full py-2.5 mt-5">
          <button 
            onClick={() => navigate(-1)} 
            className="bg-transparent border-0 text-white text-2xl cursor-pointer"
          >
            <ArrowLeft size={24} />
          </button>
          <h2 className="text-xl font-bold text-white">Appointments</h2>
          <div className="w-6"></div> {/* Spacer for alignment */}
        </div>
        
        {/* Date Display */}
        <div className="w-full text-center mb-5">
          <p className="text-white/80 text-sm">{formattedDate}</p>
        </div>
        
        {/* Date selector */}
        <div className="flex overflow-x-auto pb-2 mb-5 space-x-2 scrollbar-hide">
          {dateOptions.map((option) => (
            <button
              key={option.label}
              onClick={() => setSelectedDate(option.date)}
              className={cn(
                "flex flex-col items-center min-w-[60px] py-2 px-3 rounded-[10px] transition-colors",
                isSameDay(selectedDate, option.date)
                  ? "bg-[#00C389] text-white shadow-lg"
                  : "bg-white text-gray-700"
              )}
            >
              <span className="text-xs font-medium">{option.label}</span>
              <span className="mt-1 text-lg font-bold">
                {format(option.date, "d")}
              </span>
            </button>
          ))}
        </div>
        
        {/* Search */}
        <div className="relative mb-5">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <Input
            type="text"
            placeholder="Search appointments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 bg-white rounded-[10px] border-0 shadow-sm w-full"
          />
        </div>
        
        {/* Appointment Tabs */}
        <Tabs defaultValue="all" className="w-full mb-5">
          <TabsList className="grid grid-cols-3 bg-white rounded-full p-1 shadow-sm">
            <TabsTrigger 
              value="all" 
              className="data-[state=active]:bg-[#00C389] data-[state=active]:text-white rounded-full"
            >
              All
            </TabsTrigger>
            <TabsTrigger 
              value="upcoming" 
              className="data-[state=active]:bg-[#00C389] data-[state=active]:text-white rounded-full"
            >
              Upcoming
            </TabsTrigger>
            <TabsTrigger 
              value="past" 
              className="data-[state=active]:bg-[#00C389] data-[state=active]:text-white rounded-full"
            >
              Past
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="mt-4">
            {renderAppointmentsList(filteredAppointments)}
          </TabsContent>
          
          <TabsContent value="upcoming" className="mt-4">
            {renderAppointmentsList(filteredAppointments.filter(app => app.status === 'scheduled'))}
          </TabsContent>
          
          <TabsContent value="past" className="mt-4">
            {renderAppointmentsList(filteredAppointments.filter(app => app.status === 'completed' || app.status === 'cancelled'))}
          </TabsContent>
        </Tabs>
      </div>

      {/* Appointment Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-[425px] bg-white rounded-[15px]">
          <DialogHeader>
            <DialogTitle className="text-[#004953]">Appointment Details</DialogTitle>
          </DialogHeader>
          
          {selectedAppointment && (
            <div className="space-y-6">
              {/* Patient info */}
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedAppointment.patient?.profile_pic} />
                  <AvatarFallback className="bg-[#004953]/10 text-[#004953]">
                    {selectedAppointment.patient?.full_name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg">{selectedAppointment.patient?.full_name}</h3>
                  <div className="flex text-sm text-gray-500 gap-2">
                    <span>{selectedAppointment.patient?.gender || 'Unknown'}</span>
                    <span>•</span>
                    <span>{selectedAppointment.patient?.age || '--'} years</span>
                  </div>
                </div>
              </div>
              
              {/* Appointment details */}
              <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <CalendarIcon className="h-5 w-5 text-[#00C389] mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Date</p>
                    <p className="font-medium">{format(new Date(selectedAppointment.appointment_date), "MMMM d, yyyy")}</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-[#00C389] mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Time</p>
                    <p className="font-medium">{selectedAppointment.appointment_time}</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  {getAppointmentTypeIcon(selectedAppointment.appointment_type)}
                  <div className="ml-3">
                    <p className="text-sm text-gray-500">Type</p>
                    <p className="font-medium capitalize">{selectedAppointment.appointment_type}</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className={`h-2.5 w-2.5 rounded-full ${
                    selectedAppointment.status === 'scheduled' ? 'bg-blue-500' :
                    selectedAppointment.status === 'completed' ? 'bg-green-500' : 'bg-red-500'
                  } mr-3`} />
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <p className="font-medium capitalize">{selectedAppointment.status}</p>
                  </div>
                </div>
                
                {selectedAppointment.notes && (
                  <div className="border-t border-gray-200 pt-3 mt-3">
                    <p className="text-sm text-gray-500 mb-1">Notes</p>
                    <p className="text-sm">{selectedAppointment.notes}</p>
                  </div>
                )}
              </div>
              
              {/* Action buttons */}
              <div className="flex flex-col gap-3">
                {selectedAppointment.status === 'scheduled' && (
                  <>
                    <Button
                      onClick={() => updateAppointmentStatus(selectedAppointment.id, 'completed')}
                      className="bg-[#00C389] hover:bg-[#00A070] text-white border-none"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" /> Mark as Completed
                    </Button>
                    <Button
                      onClick={() => updateAppointmentStatus(selectedAppointment.id, 'cancelled')}
                      variant="outline"
                      className="border-red-300 text-red-600 hover:bg-red-50"
                    >
                      <XCircle className="h-4 w-4 mr-2" /> Cancel Appointment
                    </Button>
                  </>
                )}
                
                <Button 
                  variant="outline"
                  onClick={() => setDetailsOpen(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      <BottomNavigation />
    </div>
  );
  
  function renderAppointmentsList(appointments: Appointment[]) {
    if (appointments.length === 0) {
      return (
        <div className="bg-white rounded-[15px] p-6 text-center shadow-lg">
          <Calendar className="w-12 h-12 text-[#00C389] mx-auto mb-3" />
          <h3 className="text-lg font-medium text-[#004953] mb-1">No Appointments Found</h3>
          <p className="text-gray-500">There are no appointments scheduled for this day.</p>
        </div>
      );
    }
    
    return (
      <div className="space-y-4">
        {appointments.map(appointment => (
          <div
            key={appointment.id}
            className="bg-white rounded-[15px] p-4 shadow-lg cursor-pointer transition-transform hover:scale-[1.02]"
            onClick={() => {
              setSelectedAppointment(appointment);
              setDetailsOpen(true);
            }}
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center">
                <Avatar className="h-10 w-10 mr-3">
                  <AvatarImage src={appointment.patient?.profile_pic} />
                  <AvatarFallback className="bg-[#004953]/10 text-[#004953]">
                    {appointment.patient?.full_name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-medium">{appointment.patient?.full_name}</h3>
                  <div className="flex items-center mt-0.5">
                    {getAppointmentTypeIcon(appointment.appointment_type)}
                    <span className="ml-1 text-xs text-gray-500 capitalize">
                      {appointment.appointment_type}
                    </span>
                  </div>
                </div>
              </div>
              <Badge className={cn("font-normal capitalize", getStatusColor(appointment.status))}>
                {appointment.status}
              </Badge>
            </div>
            
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center text-gray-500">
                <Clock className="h-3.5 w-3.5 mr-1" />
                {appointment.appointment_time}
              </div>
              
              <div className="flex space-x-1">
                <button className="p-1.5 rounded-full bg-blue-50 text-blue-600">
                  <MessageSquare className="h-3.5 w-3.5" />
                </button>
                {appointment.status === 'scheduled' && appointment.appointment_type === 'video' && (
                  <button className="p-1.5 rounded-full bg-[#00C389]/10 text-[#00C389]">
                    <Video className="h-3.5 w-3.5" />
                  </button>
                )}
                {appointment.status === 'scheduled' && appointment.appointment_type === 'phone' && (
                  <button className="p-1.5 rounded-full bg-blue-50 text-blue-600">
                    <Phone className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }
} 