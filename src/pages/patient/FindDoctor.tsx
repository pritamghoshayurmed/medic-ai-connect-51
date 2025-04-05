import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ChevronLeft } from "lucide-react";
import BottomNavigation from "@/components/BottomNavigation";
import DoctorCard from "@/components/DoctorCard";
import { Doctor } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { useAuth } from "@/contexts/AuthContext";

export default function FindDoctor() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>("All");
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);
  const [specialties, setSpecialties] = useState<{id: string, name: string}[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Booking state
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [bookingDate, setBookingDate] = useState<Date | undefined>(undefined);
  const [bookingTime, setBookingTime] = useState<string>("");
  const [bookingReason, setBookingReason] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    // Fetch doctors and specialties
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch specialties
        const { data: specialtiesData, error: specialtiesError } = await supabase
          .from('specialties')
          .select('*');

        if (specialtiesError) {
          console.error("Error fetching specialties:", specialtiesError);
          setSpecialties([{id: 'all', name: 'All'}]);
        } else {
          setSpecialties([{id: 'all', name: 'All'}, ...specialtiesData]);
        }

        // Fetch doctors with their profiles and specialties using a more reliable approach
        const { data: doctorProfiles, error: doctorsError } = await supabase
          .from('profiles')
          .select(`
            id,
            full_name,
            email,
            phone,
            role,
            doctor_profiles!inner(
              id,
              specialty_id,
              experience_years,
              consultation_fee,
              available_days,
              available_hours,
              qualification,
              rating,
              about
            )
          `)
          .eq('role', 'doctor');

        if (doctorsError) {
          console.error("Error fetching doctors:", doctorsError);
          throw doctorsError;
        }

        // Now fetch specialties for each doctor if needed
        const doctorsWithSpecialties = await Promise.all(
          doctorProfiles.map(async (doc) => {
            const specialtyId = doc.doctor_profiles.specialty_id;
            let specialtyName = 'General Practitioner';
            
            if (specialtyId) {
              const { data: specialtyData } = await supabase
                .from('specialties')
                .select('name')
                .eq('id', specialtyId)
                .single();
                
              if (specialtyData) {
                specialtyName = specialtyData.name;
              }
            }
            
            return {
              id: doc.id,
              name: doc.full_name,
              email: doc.email,
              phone: doc.phone || '',
              role: 'doctor',
              specialty: specialtyName,
              experience: doc.doctor_profiles.experience_years || 0,
              hospital: '',
              rating: doc.doctor_profiles.rating || 4.5,
              education: doc.doctor_profiles.qualification || '',
              profilePic: '/lovable-uploads/769f4117-004e-45a0-adf4-56b690fc298b.png'
            };
          })
        );

        setDoctors(doctorsWithSpecialties);
        setFilteredDoctors(doctorsWithSpecialties);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: "Error",
          description: "Failed to load doctors data. Please try again.",
          variant: "destructive",
        });
        // Set empty arrays to prevent further errors
        setDoctors([]);
        setFilteredDoctors([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  const handleSearch = () => {
    let results = [...doctors];
    
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

  useEffect(() => {
    handleSearch();
  }, [searchQuery, selectedSpecialty]);

  const handleBookAppointment = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    // Set default booking date to today
    setBookingDate(new Date());
    setIsDialogOpen(true);
  };

  const confirmBooking = async () => {
    if (!bookingDate || !bookingTime || !user || !selectedDoctor) {
      toast({
        title: "Missing information",
        description: "Please select both date and time for your appointment.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Format date and time
      const formattedDate = bookingDate.toISOString().split('T')[0];
      const today = new Date().toISOString().split('T')[0];

      // Validate the date is not in the past
      if (formattedDate < today) {
        toast({
          title: "Invalid date",
          description: "Cannot book appointments in the past.",
          variant: "destructive",
        });
        return;
      }

      // Insert appointment into database
      const { data, error } = await supabase
        .from('appointments')
        .insert({
          patient_id: user.id,
          doctor_id: selectedDoctor.id,
          appointment_date: formattedDate,
          appointment_time: bookingTime,
          symptoms: bookingReason,
          status: 'pending'
        })
        .select();

      if (error) throw error;

      // Create notifications for both patient and doctor
      await supabase
        .from('notifications')
        .insert([
          {
            user_id: user.id,
            title: 'Appointment Booked',
            message: `Your appointment with ${selectedDoctor.name} has been scheduled for ${formattedDate} at ${bookingTime}.`,
            type: 'appointment'
          },
          {
            user_id: selectedDoctor.id,
            title: 'New Appointment',
            message: `${user.name} has booked an appointment for ${formattedDate} at ${bookingTime}.`,
            type: 'appointment'
          }
        ]);

      toast({
        title: "Appointment Booked!",
        description: `Your appointment with ${selectedDoctor.name} has been scheduled.`,
      });
      
      setIsDialogOpen(false);
      setSelectedDoctor(null);
      setBookingDate(undefined);
      setBookingTime("");
      setBookingReason("");
      
      navigate("/patient/appointments");
    } catch (error) {
      console.error("Error booking appointment:", error);
      toast({
        title: "Booking Failed",
        description: "There was an error booking your appointment. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

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
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex space-x-2 overflow-x-auto pb-2 hide-scrollbar">
          {specialties.map((specialty) => (
            <Button
              key={specialty.id}
              variant={selectedSpecialty === specialty.name ? "default" : "outline"}
              className="flex-shrink-0"
              onClick={() => setSelectedSpecialty(specialty.name)}
            >
              {specialty.name}
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
