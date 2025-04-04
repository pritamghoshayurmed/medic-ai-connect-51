
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, ChevronLeft } from "lucide-react";
import BottomNavigation from "@/components/BottomNavigation";
import DoctorCard from "@/components/DoctorCard";
import { Doctor } from "@/types";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";

// Mock data
const mockDoctors: Doctor[] = [
  {
    id: "doc1",
    name: "Dr. Sarah Johnson",
    email: "sarah@example.com",
    phone: "+1234567890",
    role: "doctor",
    specialty: "Cardiologist",
    experience: 10,
    hospital: "City Hospital",
    rating: 4.8,
  },
  {
    id: "doc2",
    name: "Dr. Michael Chen",
    email: "michael@example.com",
    phone: "+1234567891",
    role: "doctor",
    specialty: "Neurologist",
    experience: 8,
    hospital: "General Medical Center",
    rating: 4.5,
  },
  {
    id: "doc3",
    name: "Dr. Emily Williams",
    email: "emily@example.com",
    phone: "+1234567892",
    role: "doctor",
    specialty: "Pediatrician",
    experience: 12,
    hospital: "Children's Hospital",
    rating: 4.9,
  },
  {
    id: "doc4",
    name: "Dr. James Wilson",
    email: "james@example.com",
    phone: "+1234567893",
    role: "doctor",
    specialty: "Dermatologist",
    experience: 7,
    hospital: "Skin & Care Clinic",
    rating: 4.6,
  },
  {
    id: "doc5",
    name: "Dr. Lisa Rodriguez",
    email: "lisa@example.com",
    phone: "+1234567894",
    role: "doctor",
    specialty: "Psychiatrist",
    experience: 9,
    hospital: "Mental Health Center",
    rating: 4.7,
  },
];

const specialties = [
  "All",
  "Cardiologist",
  "Neurologist",
  "Pediatrician",
  "Dermatologist",
  "Psychiatrist",
  "Orthopedic",
  "Ophthalmologist",
  "Gynecologist",
];

export default function FindDoctor() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>("All");
  const [filteredDoctors, setFilteredDoctors] = useState(mockDoctors);
  
  // Booking state
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [bookingDate, setBookingDate] = useState<Date | undefined>(undefined);
  const [bookingTime, setBookingTime] = useState<string>("");
  const [bookingReason, setBookingReason] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleSearch = () => {
    let results = mockDoctors;
    
    if (searchQuery) {
      results = results.filter(
        (doctor) =>
          doctor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          doctor.specialty.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (selectedSpecialty !== "All") {
      results = results.filter(
        (doctor) => doctor.specialty === selectedSpecialty
      );
    }
    
    setFilteredDoctors(results);
  };

  const handleBookAppointment = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setIsDialogOpen(true);
  };

  const confirmBooking = () => {
    if (!bookingDate || !bookingTime) {
      toast({
        title: "Missing information",
        description: "Please select both date and time for your appointment.",
        variant: "destructive",
      });
      return;
    }

    // Here you would normally save the appointment to your backend
    toast({
      title: "Appointment Booked!",
      description: `Your appointment with ${selectedDoctor?.name} has been scheduled.`,
    });
    
    setIsDialogOpen(false);
    setSelectedDoctor(null);
    setBookingDate(undefined);
    setBookingTime("");
    setBookingReason("");
    
    navigate("/patient/appointments");
  };

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="bg-primary text-white p-4 flex items-center">
        <Button variant="ghost" size="icon" className="text-white mr-2" onClick={() => navigate(-1)}>
          <ChevronLeft />
        </Button>
        <h1 className="text-xl font-bold">Find Doctor</h1>
      </div>

      {/* Search and Filter */}
      <div className="p-4 bg-white shadow-sm">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <Input
            placeholder="Search by name, specialty..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              handleSearch();
            }}
          />
        </div>
        
        <div className="flex space-x-2 overflow-x-auto pb-2 hide-scrollbar">
          {specialties.map((specialty) => (
            <Button
              key={specialty}
              variant={selectedSpecialty === specialty ? "default" : "outline"}
              className="flex-shrink-0"
              onClick={() => {
                setSelectedSpecialty(specialty);
                handleSearch();
              }}
            >
              {specialty}
            </Button>
          ))}
        </div>
      </div>

      {/* Doctor List */}
      <div className="p-4">
        <h2 className="text-lg font-bold mb-4">{filteredDoctors.length} Doctors Found</h2>
        
        {filteredDoctors.length > 0 ? (
          filteredDoctors.map((doctor) => (
            <DoctorCard
              key={doctor.id}
              doctor={doctor}
              onBookAppointment={() => handleBookAppointment(doctor)}
            />
          ))
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No doctors found matching your criteria</p>
          </div>
        )}
      </div>

      {/* Booking Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Book Appointment</DialogTitle>
            <DialogDescription>
              Select date and time for your appointment with {selectedDoctor?.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select Date</Label>
              <Calendar
                mode="single"
                selected={bookingDate}
                onSelect={setBookingDate}
                className="rounded-md border"
                disabled={(date) => date < new Date() || date > new Date(new Date().setMonth(new Date().getMonth() + 2))}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Select Time</Label>
              <Select value={bookingTime} onValueChange={setBookingTime}>
                <SelectTrigger>
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="09:00 AM">09:00 AM</SelectItem>
                  <SelectItem value="10:00 AM">10:00 AM</SelectItem>
                  <SelectItem value="11:00 AM">11:00 AM</SelectItem>
                  <SelectItem value="01:00 PM">01:00 PM</SelectItem>
                  <SelectItem value="02:00 PM">02:00 PM</SelectItem>
                  <SelectItem value="03:00 PM">03:00 PM</SelectItem>
                  <SelectItem value="04:00 PM">04:00 PM</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Reason for Visit</Label>
              <Input
                placeholder="Briefly describe your issue"
                value={bookingReason}
                onChange={(e) => setBookingReason(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={confirmBooking}>Confirm Booking</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BottomNavigation />
    </div>
  );
}
