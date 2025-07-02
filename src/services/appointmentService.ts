import { supabase } from '@/integrations/supabase/client';
import { Appointment, NewAppointment } from '@/types'; // Assuming these types will be defined/updated

export const appointmentService = {
  /**
   * Create a new appointment
   */
  async createAppointment(appointmentData: NewAppointment): Promise<Appointment | null> {
    try {
      // Ensure all required fields are present
      if (!appointmentData.patient_id || !appointmentData.doctor_id || !appointmentData.appointment_date || !appointmentData.appointment_time || !appointmentData.reason || !appointmentData.appointment_type) {
        throw new Error("Missing required appointment fields.");
      }

      const { data, error } = await supabase
        .from('appointments')
        .insert([
          {
            patient_id: appointmentData.patient_id,
            doctor_id: appointmentData.doctor_id,
            appointment_date: appointmentData.appointment_date,
            appointment_time: appointmentData.appointment_time,
            reason: appointmentData.reason,
            appointment_type: appointmentData.appointment_type,
            status: appointmentData.status || 'pending', // Default status
            notes: appointmentData.notes,
            location: appointmentData.location,
            meeting_link: appointmentData.meeting_link,
            // id and created_at will be handled by Supabase
          },
        ])
        .select()
        .single(); // Assuming you want the created record back

      if (error) {
        console.error('Error creating appointment in Supabase:', error);
        throw error;
      }

      console.log('Appointment created successfully in Supabase:', data);
      return data as Appointment;
    } catch (error) {
      console.error('Error in appointmentService.createAppointment:', error);
      // Consider how to propagate this error or handle it for the UI
      // For now, re-throwing, but a more user-friendly error might be needed.
      throw error;
    }
  },

  /**
   * Get appointments for a patient
   */
  async getAppointmentsForPatient(patientId: string): Promise<Appointment[]> {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          doctor:profiles!appointments_doctor_id_fkey (
            id,
            full_name,
            email,
            phone,
            role,
            doctor_profiles (specialty_id),
            specialties (name)
          )
        `)
        .eq('patient_id', patientId)
        .order('appointment_date', { ascending: false })
        .order('appointment_time', { ascending: false });

      if (error) {
        console.error('Error fetching patient appointments:', error);
        throw error;
      }
      return (data as Appointment[]) || [];
    } catch (error) {
      console.error('Error in getAppointmentsForPatient:', error);
      throw error;
    }
  },

  /**
   * Get appointments for a doctor
   */
  async getAppointmentsForDoctor(doctorId: string): Promise<Appointment[]> {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          patient:profiles!appointments_patient_id_fkey (
            id,
            full_name,
            email,
            phone,
            role
          )
        `)
        .eq('doctor_id', doctorId)
        .order('appointment_date', { ascending: false })
        .order('appointment_time', { ascending: false });

      if (error) {
        console.error('Error fetching doctor appointments:', error);
        throw error;
      }
      return (data as Appointment[]) || [];
    } catch (error) {
      console.error('Error in getAppointmentsForDoctor:', error);
      throw error;
    }
  },

  // Add other methods like updateAppointmentStatus, cancelAppointment etc. as needed
};

export default appointmentService;
