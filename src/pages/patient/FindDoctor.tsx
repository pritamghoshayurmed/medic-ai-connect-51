
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, Search, Clock, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import DoctorCard from "@/components/DoctorCard";
import BottomNavigation from "@/components/BottomNavigation";
import { Doctor } from "@/types";

// Available time slots
const TIME_SLOTS = [
  "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM",
  "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM",
  "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM",
  "04:00 PM", "04:30 PM", "05:00 PM"
];

// Specialties for filtering
const SPECIALTIES = [
  "All Specialties",
  "General Practitioner",
  "Cardiologist",
  "Dermatologist",
  "Neurologist",
  "Pediatrician",
  "Psychiatrist",
  "Orthopedic"
];

export default function FindDoctor() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Get selected doctor from query params if available
  const searchParams = new URLSearchParams(location.search);
  const preSelectedDoctorId = searchParams.get('selected');
  
  const [searchQuery, setSearchQuery] = useState("");
  const [specialty, setSpecialty] = useState("All Specialties");
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Appointment booking state
  const [bookingOpen, setBookingOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [timeSlot, setTimeSlot] = useState<string | undefined>(undefined);
  const [reason, setReason] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);
  
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('profiles')
          .select(`
            *,
            doctor_profiles(*)
          `)
          .eq('role', 'doctor');
          
        if (error) {
          console.error("Error fetching doctors:", error);
          throw error;
        }
        
        // Transform data to our Doctor interface
        const formattedDoctors = data.map(doc => ({
          id: doc.id,
          name: doc.full_name || 'Dr. Unknown',
          email: doc.email || '',
          phone: doc.phone || '',
          role: 'doctor' as const,
          specialty: doc.doctor_profiles?.[0]?.specialty || 'General Practitioner',
          experience: doc.doctor_profiles?.[0]?.experience_years || 5,
          rating: 4.8,
          profilePic: '/lovable-uploads/769f4117-004e-45a0-adf4-56b690fc298b.png'
        }));
        
        setDoctors(formattedDoctors);
        setFilteredDoctors(formattedDoctors);
        
        // If there's a preselected doctor, open the booking dialog
        if (preSelectedDoctorId) {
          const doctor = formattedDoctors.find(d => d.id === preSelectedDoctorId);
          if (doctor) {
            setSelectedDoctor(doctor);
            setBookingOpen(true);
          }
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDoctors();
  }, [preSelectedDoctorId]);
  
  // Filter doctors when search query or specialty changes
  useEffect(() => {
    let filtered = [...doctors];
    
    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(doctor => 
        doctor.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply specialty filter
    if (specialty !== "All Specialties") {
      filtered = filtered.filter(doctor => 
        doctor.specialty === specialty
      );
    }
    
    setFilteredDoctors(filtered);
  }, [searchQuery, specialty, doctors]);
  
  const handleBookAppointment = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setBookingOpen(true);
    // Reset form values
    setDate(undefined);
    setTimeSlot(undefined);
    setReason("");
  };
  
  const handleCreateAppointment = async () => {
    if (!user || !selectedDoctor || !date || !timeSlot) {
      toast({
        title: "Missing information",
        description: "Please select a date and time for your appointment.",
        variant: "destructive",
      });
      return;
    }
    
    setBookingLoading(true);
    
    try {
      // Create appointment in database
      const { data, error } = await supabase
        .from('appointments')
        .insert({
          patient_id: user.id,
          doctor_id: selectedDoctor.id,
          appointment_date: format(date, "yyyy-MM-dd"),
          appointment_time: timeSlot,
          status: 'pending',
          symptoms: reason || 'General checkup',
        })
        .select();
        
      if (error) {
        throw error;
      }
      
      toast({
        title: "Appointment requested!",
        description: "Your appointment request has been sent to the doctor.",
      });
      
      // Close dialog and redirect to appointments page
      setBookingOpen(false);
      navigate("/patient/appointments");
      
    } catch (error) {
      console.error("Error creating appointment:", error);
      toast({
        title: "Error",
        description: "There was a problem booking your appointment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setBookingLoading(false);
    }
  };
  
  return (
    <div className="pb-24">
      {/* Header */}
      <div className="bg-white shadow p-4 flex items-center">
        <Button variant="ghost" size="icon" className="mr-2" onClick={() => navigate(-1)}>
          <ChevronLeft />
        </Button>
        <h1 className="text-xl font-bold">Find Doctor</h1>
      </div>
      
      {/* Search */}
      <div className="p-4">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <Input
            placeholder="Search doctors..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="mb-4">
          <Select value={specialty} onValueChange={setSpecialty}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by specialty" />
            </SelectTrigger>
            <SelectContent>
              {SPECIALTIES.map((spec) => (
                <SelectItem key={spec} value={spec}>
                  {spec}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Doctor List */}
      <div className="px-4">
        <h2 className="text-lg font-bold mb-4">Available Doctors</h2>
        
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : filteredDoctors.length > 0 ? (
          filteredDoctors.map((doctor) => (
            <DoctorCard
              key={doctor.id}
              doctor={doctor}
              onBookAppointment={() => handleBookAppointment(doctor)}
              onViewProfile={() => navigate(`/patient/doctor-profile/${doctor.id}`)}
            />
          ))
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No doctors found matching your criteria</p>
          </div>
        )}
      </div>
      
      {/* Booking Dialog */}
      <Dialog open={bookingOpen} onOpenChange={setBookingOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Book Appointment</DialogTitle>
          </DialogHeader>
          
          {selectedDoctor && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 pb-2 border-b">
                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white text-xl font-bold">
                  {selectedDoctor.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold">{selectedDoctor.name}</h3>
                  <p className="text-sm text-gray-600">{selectedDoctor.specialty}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Date</label>
                <div className="border rounded-md p-1">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    disabled={(date) => {
                      // Disable past dates and weekends
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      return (
                        date < today ||
                        date.getDay() === 0 ||
                        date.getDay() === 6
                      );
                    }}
                    className="rounded-md"
                  />
                </div>
              </div>
              
              {date && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Time</label>
                  <div className="grid grid-cols-3 gap-2">
                    {TIME_SLOTS.map((time) => (
                      <button
                        key={time}
                        className={`p-2 rounded-md text-sm flex items-center justify-center gap-1 ${
                          timeSlot === time
                            ? "bg-primary text-white"
                            : "bg-gray-100 hover:bg-gray-200"
                        }`}
                        onClick={() => setTimeSlot(time)}
                      >
                        <Clock className="h-3 w-3" />
                        {time}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <label htmlFor="reason" className="text-sm font-medium">Reason for Visit (Optional)</label>
                <textarea
                  id="reason"
                  rows={3}
                  className="w-full p-2 border rounded-md resize-none"
                  placeholder="Describe your symptoms or reason for appointment..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                ></textarea>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setBookingOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleCreateAppointment} 
              disabled={!date || !timeSlot || bookingLoading}
            >
              {bookingLoading ? "Booking..." : "Book Appointment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <BottomNavigation />
    </div>
  );
}
