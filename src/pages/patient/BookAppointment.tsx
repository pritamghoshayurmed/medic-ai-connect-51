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

  useEffect(() => {
    // Simulate fetching doctor details
    const fetchDoctorDetails = async () => {
      setLoading(true);
      // In a real app, you would fetch this from your backend
      await new Promise(resolve => setTimeout(resolve, 1000));
      const mockDoctor: Doctor = {
        id: id!,
        name: "Dr. John Doe",
        specialty: "Cardiology",
        profilePic: "/placeholder-doctor.jpg"
      };
      setDoctor(mockDoctor);
      setLoading(false);
    };

    if (id) {
      fetchDoctorDetails();
    } else {
      navigate("/doctors"); // Or some error page
    }
  }, [id, navigate]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user || !doctor || !date || !time) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setSubmitting(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    const appointmentId = uuidv4();
    const newAppointment = {
      id: appointmentId,
      patientId: user.uid,
      doctorId: doctor.id,
      doctorName: doctor.name,
      doctorSpecialty: doctor.specialty,
      date: format(date, "yyyy-MM-dd"),
      time,
      reason,
      appointmentType,
      status: "Scheduled"
    };

    // In a real app, save this to your database
    console.log("New Appointment:", newAppointment);

    // Store in localStorage (for demo purposes)
    const existingAppointments = JSON.parse(localStorage.getItem("appointments") || "[]");
    localStorage.setItem("appointments", JSON.stringify([...existingAppointments, newAppointment]));

    setSubmitting(false);
    toast.success("Appointment booked successfully!");
    navigate(`/appointment-confirmed/${appointmentId}`);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (!doctor) {
    return <div className="flex justify-center items-center h-screen">Doctor not found.</div>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="sticky top-0 z-10 flex items-center justify-between p-4 border-b bg-background">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ChevronLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-xl font-semibold">Book Appointment</h1>
        <div className="w-8"></div> {/* Placeholder for right-side icon if any */}
      </header>

      <main className="flex-grow p-4 mb-16"> {/* mb-16 for bottom navigation */}
        <div className="flex items-center p-4 mb-6 bg-card rounded-lg shadow">
          {doctor.profilePic && (
            <img
              src={doctor.profilePic}
              alt={doctor.name}
              className="w-16 h-16 mr-4 rounded-full"
            />
          )}
          <div>
            <h2 className="text-lg font-semibold">{doctor.name}</h2>
            <p className="text-sm text-muted-foreground">{doctor.specialty}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="reason">Reason for Visit</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Briefly describe the reason for your visit"
              className="mt-1"
            />
          </div>

          <div>
            <Label>Appointment Type</Label>
            <RadioGroup
              value={appointmentType}
              onValueChange={(value: "video" | "phone" | "in_person") => setAppointmentType(value)}
              className="mt-1 flex space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="video" id="video" />
                <Label htmlFor="video">Video Call</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="phone" id="phone" />
                <Label htmlFor="phone">Phone Call</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="in_person" id="in_person" />
                <Label htmlFor="in_person">In-Person</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="date">Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal mt-1",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                    disabled={(day) => day < addDays(new Date(), -1) || day > addDays(new Date(), 30)} // Example: disable past dates and dates more than 30 days out
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label htmlFor="time">Time</Label>
              <Select value={time} onValueChange={setTime}>
                <SelectTrigger className="w-full mt-1">
                  <Clock className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Select a time" />
                </SelectTrigger>
                <SelectContent>
                  {availableTimeSlots.map((slot) => (
                    <SelectItem key={slot} value={slot}>
                      {slot}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Booking..." : "Book Appointment"}
          </Button>
        </form>
      </main>

      <BottomNavigation />
    </div>
  );
}