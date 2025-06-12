import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Appointment, Patient } from "@/types";
import { toAppointmentWithPatient } from "@/utils/typeHelpers";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { Calendar, Clock, Pencil, X, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import BottomNavigation from "@/components/BottomNavigation";

export default function DoctorAppointments() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<(Appointment & { patient: Patient })[]>([]);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchAppointments = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('appointments')
          .select(`
            *,
            patient:patient_id (
              id,
              full_name,
              email,
              phone,
              role
            )
          `)
          .eq('doctor_id', user.id);

        if (error) {
          console.error('Error fetching appointments:', error);
          return;
        }

        if (data) {
          console.log("Appointment data:", data);
          // Transform data to match our interface
          const formattedAppointments = data.map(appt => toAppointmentWithPatient({
            id: appt.id,
            patientId: appt.patient_id,
            doctorId: appt.doctor_id,
            date: appt.appointment_date,
            time: appt.appointment_time,
            status: (appt.status || 'pending') as "pending" | "confirmed" | "cancelled" | "completed",
            reason: appt.symptoms || '',
            patient: {
              id: appt.patient.id,
              name: appt.patient.full_name,
              email: appt.patient.email,
              phone: appt.patient.phone || '',
              role: 'patient'
            }
          }));

          setAppointments(formattedAppointments);
        }
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
  
  async function updateStatus(appointmentId: string, newStatus: 'confirmed' | 'cancelled' | 'completed') {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: newStatus })
        .eq('id', appointmentId);
        
      if (error) {
        console.error('Error updating appointment status:', error);
        return;
      }
      
      // Update local state
      setAppointments(prev => 
        prev.map(appt => 
          appt.id === appointmentId 
            ? { ...appt, status: newStatus } 
            : appt
        )
      );
    } catch (err) {
      console.error('Error:', err);
    }
  }

  return (
    <div className="pb-24 min-h-screen" style={{background: 'linear-gradient(135deg, #005A7A, #002838)'}}>
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white p-4">
        <div className="flex justify-between items-center mb-2">
          <div>
            <h1 className="text-2xl font-bold">Appointments</h1>
            <p className="text-white text-opacity-90">Manage your schedule</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 w-full mb-4 bg-white bg-opacity-10 backdrop-blur-sm">
            <TabsTrigger 
              value="upcoming" 
              className="text-white data-[state=active]:bg-white data-[state=active]:text-teal-700"
            >
              Upcoming
            </TabsTrigger>
            <TabsTrigger 
              value="past"
              className="text-white data-[state=active]:bg-white data-[state=active]:text-teal-700"
            >
              Past
            </TabsTrigger>
            <TabsTrigger 
              value="all"
              className="text-white data-[state=active]:bg-white data-[state=active]:text-teal-700"
            >
              All
            </TabsTrigger>
          </TabsList>
          
          <div className="mt-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              </div>
            ) : appointments.length === 0 ? (
              <div className="text-center py-6 bg-white bg-opacity-10 backdrop-blur-sm rounded-lg border border-white border-opacity-20">
                <p className="text-white text-opacity-80">No appointments found.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {getFilteredAppointments().map((appointment) => (
                  <Card key={appointment.id} className="bg-white bg-opacity-10 backdrop-blur-sm border-white border-opacity-20">
                    <CardContent className="p-4">
                      <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                          <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                            <h3 className="font-semibold text-lg text-white">{appointment.patient.name}</h3>
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                              {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                            </span>
                          </div>
                          
                          <div className="space-y-2 text-white text-opacity-90">
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
                                <p className="font-medium">Reason:</p>
                                <p className="mt-1 text-white text-opacity-80">{appointment.reason}</p>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="bg-white bg-opacity-5 backdrop-blur-sm p-4 rounded-lg md:w-64">
                          <div className="mb-4">
                            <p className="text-sm font-medium text-white text-opacity-90">Patient Info</p>
                            <p className="text-sm text-white text-opacity-80">{appointment.patient.email}</p>
                            <p className="text-sm text-white text-opacity-80">{appointment.patient.phone}</p>
                          </div>
                          
                          <div className="flex flex-wrap gap-2">
                            {appointment.status === 'confirmed' && (
                              <Button 
                                className="w-full bg-teal-500 hover:bg-teal-600 text-white" 
                                onClick={() => navigate(`/doctor/chat/${appointment.patientId}`)}
                              >
                                <MessageSquare className="h-4 w-4 mr-2" />
                                Message
                              </Button>
                            )}
                            {appointment.status === 'pending' && (
                              <div className="w-full flex gap-2">
                                <Button 
                                  className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                                  onClick={() => updateStatus(appointment.id, 'confirmed')}
                                >
                                  Accept
                                </Button>
                                <Button 
                                  className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                                  onClick={() => updateStatus(appointment.id, 'cancelled')}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                            {appointment.status === 'completed' && (
                              <Button 
                                className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                              >
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit Notes
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
      
      <BottomNavigation />
    </div>
  );
  
  function getStatusColor(status: string) {
    switch (status) {
      case 'pending':
        return 'bg-amber-500 text-white';
      case 'confirmed':
        return 'bg-green-500 text-white';
      case 'cancelled':
        return 'bg-red-500 text-white';
      case 'completed':
        return 'bg-blue-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  }
}
