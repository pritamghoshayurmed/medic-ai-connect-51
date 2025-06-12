import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, addDays } from "date-fns";
import { ChevronLeft, Calendar as CalendarIcon, Clock } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import BottomNavigation from "@/components/BottomNavigation";
import { v4 as uuidv4 } from "uuid";

interface Doctor {
  id: string;
  name: string;
  specialty: string;
  profilePic?: string;
}

export default function BookAppointment() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Form state
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [time, setTime] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [appointmentType, setAppointmentType] = useState<"video" | "phone" | "in_person">("video");
  
  // Available time slots
  const availableTimeSlots = [
    "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", 
    "11:00 AM", "11:30 AM", "12:00 PM", "02:00 PM", 
    "02:30 PM", "03:00 PM", "03:30 PM", "04:00 PM"
  ];
  
  // Fetch doctor info
  useEffect(() => {
    const fetchDoctor = async () => {
      setLoading(true);
      try {
        // Mock data for now, would normally fetch from API
        setDoctor({
          id: id || "1",
          name: id === "1" ? "Dr. Priya Sharma" : id === "2" ? "Dr. Samridhya Dey" : "Dr. Koushik Das",
          specialty: "General Practitioner"
        });
      } catch (error) {
        console.error("Error fetching doctor:", error);
        toast.error("Failed to load doctor information");
      } finally {
        setLoading(false);
      }
    };
    
    fetchDoctor();
  }, [id]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!doctor || !date || !time || !reason) {
      toast.error("Please fill all required fields");
      return;
    }
    
    if (submitting) {
      console.log("Already submitting, preventing double submission");
      return;
    }
    
    setSubmitting(true);
    console.log("Booking appointment...");
    
    try {
      // Create a new appointment object
      const newAppointment: any = {
        id: uuidv4(),
        doctor: {
          id: doctor.id,
          full_name: doctor.name,
          specialties: [doctor.specialty],
          profile_pic: doctor.profilePic
        },
        specialties: [{ name: doctor.specialty }],
        appointment_date: date.toISOString().split('T')[0],
        appointment_time: time,
        status: 'pending',
        appointment_type: appointmentType,
        notes: reason,
        location: appointmentType === 'in_person' ? "City Hospital, Suite 100" : undefined,
        meeting_link: appointmentType === 'video' ? "https://meet.google.com/xyz-abcd-123" : undefined
      };
      
      console.log("New appointment data:", newAppointment);
      
      // Store the appointment in localStorage
      const existingAppointments = localStorage.getItem('bookedAppointments');
      let appointmentsArray = [];
      
      if (existingAppointments) {
        try {
          appointmentsArray = JSON.parse(existingAppointments);
        } catch (error) {
          console.error("Error parsing stored appointments:", error);
          appointmentsArray = [];
        }
      }
      
      appointmentsArray.push(newAppointment);
      localStorage.setItem('bookedAppointments', JSON.stringify(appointmentsArray));
      console.log("Appointment saved to localStorage");
      
      // Simulate API call
      setTimeout(() => {
        console.log("Booking complete, navigating to appointments page");
        toast.success("Appointment booked successfully");
        // Navigate to appointments page with state flag
        navigate("/patient/appointments", { 
          state: { newAppointment: true }
        });
        setSubmitting(false);
      }, 1000);
    } catch (error) {
      console.error("Error booking appointment:", error);
      toast.error("Failed to book appointment");
      setSubmitting(false);
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
            <h1 className="text-xl font-bold text-white">Book Appointment</h1>
          </div>
        </div>
        
        {/* Doctor Info */}
        {doctor && (
          <div className="bg-white rounded-[15px] p-4 shadow-lg mb-5">
            <div className="flex items-center">
              <div className="w-16 h-16 rounded-full bg-[#004953]/10 text-[#004953] flex items-center justify-center text-xl font-bold mr-4">
                {doctor.name.split(" ").map(n => n[0]).join("")}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[#004953]">{doctor.name}</h2>
                <p className="text-sm text-gray-500">{doctor.specialty}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Appointment Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Appointment Type */}
          <div className="bg-white rounded-[15px] p-5 shadow-lg">
            <h3 className="text-base font-semibold text-[#004953] mb-3">Appointment Type</h3>
            <RadioGroup 
              value={appointmentType} 
              onValueChange={(value) => setAppointmentType(value as "video" | "phone" | "in_person")}
              className="flex flex-col space-y-3"
            >
              <div className="flex items-center space-x-2 bg-gray-50 p-3 rounded-lg">
                <RadioGroupItem value="video" id="video" />
                <Label htmlFor="video" className="cursor-pointer flex-1">Video Consultation</Label>
              </div>
              <div className="flex items-center space-x-2 bg-gray-50 p-3 rounded-lg">
                <RadioGroupItem value="phone" id="phone" />
                <Label htmlFor="phone" className="cursor-pointer flex-1">Phone Call</Label>
              </div>
              <div className="flex items-center space-x-2 bg-gray-50 p-3 rounded-lg">
                <RadioGroupItem value="in_person" id="in_person" />
                <Label htmlFor="in_person" className="cursor-pointer flex-1">In-person Visit</Label>
              </div>
            </RadioGroup>
          </div>
          
          {/* Date & Time */}
          <div className="bg-white rounded-[15px] p-5 shadow-lg">
            <h3 className="text-base font-semibold text-[#004953] mb-3">Date & Time</h3>
            
            <div className="space-y-4">
              {/* Date Picker */}
              <div>
                <Label htmlFor="date" className="text-sm text-gray-500 mb-1 block">Select Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal border border-gray-300 bg-white hover:bg-gray-50 text-gray-700"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : <span className="text-gray-400">Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              {/* Time Picker */}
              <div>
                <Label htmlFor="time" className="text-sm text-gray-500 mb-1 block">Select Time</Label>
                <Select value={time} onValueChange={setTime}>
                  <SelectTrigger className="w-full border border-gray-300 bg-white text-gray-700">
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTimeSlots.map((slot) => (
                      <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          {/* Reason for Visit */}
          <div className="bg-white rounded-[15px] p-5 shadow-lg">
            <h3 className="text-base font-semibold text-[#004953] mb-3">Reason for Visit</h3>
            <Textarea 
              placeholder="Briefly describe your symptoms or reason for consultation..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-[100px] border border-gray-300 focus:border-[#00C389] text-gray-700"
            />
          </div>
          
          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full bg-[#00C389] hover:bg-[#00A070] text-white py-3 h-auto text-base"
            disabled={submitting}
          >
            {submitting ? "Booking..." : "Confirm Appointment"}
          </Button>
        </form>
      </div>
      
      <BottomNavigation />
    </div>
  );
} 