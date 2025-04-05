
import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Appointment, Doctor } from "@/types";
import { toAppointmentWithDoctor, toDoctorType } from "@/utils/typeHelpers";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { Calendar, Clock } from "lucide-react";

export default function Appointments() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<(Appointment & { doctor: Doctor })[]>([]);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchAppointments = async () => {
      setLoading(true);
      try {
        // First fetch appointment data
        const { data: appointmentsData, error: appointmentsError } = await supabase
          .from('appointments')
          .select(`
            id,
            patient_id,
            doctor_id,
            appointment_date,
            appointment_time,
            status,
            symptoms
          `)
          .eq('patient_id', user.id);

        if (appointmentsError) {
          console.error('Error fetching appointments:', appointmentsError);
          return;
        }

        if (!appointmentsData || appointmentsData.length === 0) {
          setAppointments([]);
          return;
        }

        // Fetch all doctors involved in appointments
        const doctorIds = [...new Set(appointmentsData.map(appt => appt.doctor_id))];
        const { data: doctorsData, error: doctorsError } = await supabase
          .from('profiles')
          .select(`
            id,
            full_name,
            email,
            phone,
            role,
            doctor_profiles (
              specialty_id,
              experience_years,
              qualification,
              rating
            )
          `)
          .in('id', doctorIds);

        if (doctorsError) {
          console.error('Error fetching doctors:', doctorsError);
          return;
        }

        // Create a map of doctor data by ID for faster lookup
        const doctorsMap = new Map();
        doctorsData.forEach(doc => {
          doctorsMap.set(doc.id, doc);
        });

        // Merge appointment data with doctor data
        const formattedAppointments = appointmentsData.map(appt => {
          const doctorData = doctorsMap.get(appt.doctor_id) || {};
          
          const doctor = toDoctorType({
            id: doctorData.id || '',
            name: doctorData.full_name || '',
            email: doctorData.email || '',
            phone: doctorData.phone || '',
            role: 'doctor',
            experience: doctorData.doctor_profiles?.experience_years || 0,
            education: doctorData.doctor_profiles?.qualification || '',
            rating: doctorData.doctor_profiles?.rating || 0,
            profilePic: '/lovable-uploads/769f4117-004e-45a0-adf4-56b690fc298b.png'
          });

          return {
            id: appt.id,
            patientId: appt.patient_id,
            doctorId: appt.doctor_id,
            date: appt.appointment_date,
            time: appt.appointment_time,
            status: appt.status,
            reason: appt.symptoms || '',
            notes: '',
            doctor
          };
        });

        setAppointments(formattedAppointments);
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [user]);

  function getFilteredAppointments() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    switch (activeTab) {
      case 'upcoming':
        return appointments.filter(appt => {
          const apptDate = new Date(appt.date);
          return apptDate >= today && (appt.status === 'pending' || appt.status === 'confirmed');
        });
      case 'past':
        return appointments.filter(appt => {
          const apptDate = new Date(appt.date);
          return apptDate < today || appt.status === 'completed' || appt.status === 'cancelled';
        });
      case 'all':
      default:
        return appointments;
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'pending':
        return 'bg-amber-100 text-amber-800';
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">My Appointments</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>
        
        <div className="mt-6">
          {loading ? (
            <div className="text-center py-10">Loading appointments...</div>
          ) : appointments.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-500">No appointments found.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {getFilteredAppointments().map((appointment) => (
                <Card key={appointment.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex flex-col md:flex-row">
                      <div className="p-4 md:p-6 flex-1">
                        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                          <h3 className="font-semibold text-lg">Dr. {appointment.doctor.name}</h3>
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                            {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                          </span>
                        </div>
                        
                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2" />
                            <span>{format(new Date(appointment.date), 'MMMM d, yyyy')}</span>
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-2" />
                            <span>{appointment.time}</span>
                          </div>
                          {appointment.reason && (
                            <div className="mt-2">
                              <p className="font-medium text-gray-700">Reason:</p>
                              <p className="mt-1">{appointment.reason}</p>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 p-4 md:p-6 md:w-64 flex flex-col justify-between">
                        <div className="mb-4">
                          <p className="text-sm font-medium text-gray-500">Doctor Info</p>
                          <p className="font-medium">{appointment.doctor.specialty || "General Medicine"}</p>
                          <p className="text-sm text-gray-600">{appointment.doctor.experience} years experience</p>
                        </div>
                        
                        <div className="flex flex-wrap gap-2">
                          {appointment.status === 'confirmed' && (
                            <Button className="w-full" variant="default">
                              Start Consultation
                            </Button>
                          )}
                          {appointment.status === 'pending' && (
                            <>
                              <Button className="w-full" variant="outline">
                                Reschedule
                              </Button>
                              <Button className="w-full" variant="destructive">
                                Cancel
                              </Button>
                            </>
                          )}
                          {appointment.status === 'completed' && (
                            <Button className="w-full" variant="secondary">
                              View Notes
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </Tabs>
    </div>
  );
}
