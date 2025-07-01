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
  
import { doctorService } from "@/services/doctorService"; // Import doctorService

interface Doctor {
  id: string;
  name: string;
  specialty: string;
  profilePic?: string;
}

export default function BookAppointment() {
  const navigate = useNavigate();
  const { id: doctorSupabaseId } = useParams<{ id: string }>(); // doctorSupabaseId from route
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

  // Fetch doctor info using doctorService
  useEffect(() => {
    if (!doctorSupabaseId) {
      toast.error("Doctor ID is missing.");
      setLoading(false);
      navigate("/patient/find-doctor"); // Or some other appropriate page
      return;
    }

    const fetchDoctorDetails = async () => {
      setLoading(true);
      try {
        const doctorProfile = await doctorService.getDoctorById(doctorSupabaseId);
        if (doctorProfile) {
          setDoctor({
            id: doctorProfile.id,
            name: doctorProfile.full_name,
            specialty: doctorProfile.specialty?.name || "N/A", // Assuming specialty is an object with a name property
            // profilePic: doctorProfile.profile_pic_url, // Uncomment if available
          });
        } else {
          toast.error("Failed to load doctor information.");
          navigate("/patient/find-doctor");
        }
      } catch (error) {
        console.error("Error fetching doctor:", error);
        toast.error("An error occurred while loading doctor information.");
        navigate("/patient/find-doctor");
      } finally {
        setLoading(false);
      }
    };
    
    fetchDoctorDetails();
  }, [doctorSupabaseId, navigate]);
  
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
    
import appointmentService from "@/services/appointmentService"; // Import appointmentService
import { NewAppointment } from "@/types"; // Import NewAppointment type

// ... (other imports and component code) ...

export default function BookAppointment() {
  // ... (hooks and state variables) ...
  const navigate = useNavigate();
  const { id: doctorSupabaseId } = useParams<{ id: string }>();
  const { user: patientUser } = useAuth(); // Get the logged-in patient
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [doctor, setDoctor] = useState<Doctor | null>(null); // Doctor here is simplified for display
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [time, setTime] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [appointmentType, setAppointmentType] = useState<"video" | "phone" | "in_person">("video");

  // ... (useEffect for fetching doctor details remains the same) ...
  useEffect(() => {
    if (!doctorSupabaseId) {
      toast.error("Doctor ID is missing.");
      setLoading(false);
      navigate("/patient/find-doctor");
      return;
    }

    const fetchDoctorDetails = async () => {
      setLoading(true);
      try {
        const doctorProfile = await doctorService.getDoctorById(doctorSupabaseId);
        if (doctorProfile) {
          setDoctor({
            id: doctorProfile.id,
            name: doctorProfile.full_name,
            specialty: doctorProfile.specialty?.name || "N/A",
          });
        } else {
          toast.error("Failed to load doctor information.");
          navigate("/patient/find-doctor");
        }
      } catch (error) {
        console.error("Error fetching doctor:", error);
        toast.error("An error occurred while loading doctor information.");
        navigate("/patient/find-doctor");
      } finally {
        setLoading(false);
      }
    };

    fetchDoctorDetails();
  }, [doctorSupabaseId, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!doctor || !date || !time || !reason || !patientUser) {
      toast.error("Please fill all required fields and ensure you are logged in.");
      return;
    }

    if (submitting) {
      console.log("Already submitting, preventing double submission");
      return;
    }

    setSubmitting(true);
    console.log("Booking appointment...");
    
    const appointmentData: NewAppointment = {
      patient_id: patientUser.id, // Logged-in patient's Supabase ID
      doctor_id: doctor.id,       // Selected doctor's Supabase ID
      appointment_date: format(date, "yyyy-MM-dd"), // Format date correctly
      appointment_time: time,
      reason: reason,
      appointment_type: appointmentType,
      status: 'pending', // Default status
      // notes: "", // Optional: add if there's a field for patient notes
      location: appointmentType === 'in_person' ? "Kabiraj Clinic (Default Location)" : undefined, // Example, make configurable if needed
      meeting_link: appointmentType === 'video' ? `https://meet.kabiraj.com/appointment/${uuidv4()}` : undefined, // Example link
    };
      
    try {
      const createdAppointment = await appointmentService.createAppointment(appointmentData);
      
      if (createdAppointment) {
        console.log("Appointment created successfully:", createdAppointment);
        toast.success("Appointment booked successfully!");
        navigate("/patient/appointments", { 
          state: { newAppointmentId: createdAppointment.id } // Pass ID for potential highlighting
        });
      } else {
        // This case should ideally be covered by error throwing in service
        toast.error("Failed to book appointment. Response was empty.");
      }
    } catch (error: any) {
      console.error("Error booking appointment:", error);
      toast.error(`Failed to book appointment: ${error.message || "Unknown error"}`);
    } finally {
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