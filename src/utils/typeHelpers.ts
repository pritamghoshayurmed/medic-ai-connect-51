
import { Doctor, Patient, Appointment, UserRole } from "@/types";

/**
 * Helper function to convert a string to a valid UserRole type
 */
export function asUserRole(role: string): UserRole {
  return role === 'doctor' ? 'doctor' : 'patient';
}

/**
 * Helper function to convert string status to appointment status type
 */
export function asAppointmentStatus(status: string): 'pending' | 'confirmed' | 'cancelled' | 'completed' {
  switch (status) {
    case 'pending':
      return 'pending';
    case 'confirmed':
      return 'confirmed';
    case 'cancelled':
      return 'cancelled';
    case 'completed':
      return 'completed';
    default:
      return 'pending'; // Default fallback
  }
}

/**
 * Helper to convert doctor data from Supabase to Doctor type
 */
export function toDoctorType(doctorData: any): Doctor {
  return {
    id: doctorData.id,
    name: doctorData.name || doctorData.full_name,
    email: doctorData.email,
    phone: doctorData.phone || '',
    role: 'doctor',
    specialty: doctorData.specialty || '',
    experience: doctorData.experience || doctorData.experience_years || 0,
    education: doctorData.education || '',
    hospital: doctorData.hospital || '',
    rating: doctorData.rating || 0,
    profilePic: doctorData.profilePic || '/lovable-uploads/769f4117-004e-45a0-adf4-56b690fc298b.png'
  };
}

/**
 * Helper to convert appointments with correct types
 */
export function toAppointmentWithDoctor(appointmentData: any): Appointment & { doctor: Doctor } {
  const status = asAppointmentStatus(appointmentData.status);
  const doctor = toDoctorType(appointmentData.doctor);
  
  return {
    id: appointmentData.id,
    patientId: appointmentData.patientId,
    doctorId: appointmentData.doctorId,
    date: appointmentData.date,
    time: appointmentData.time,
    status: status,
    reason: appointmentData.reason || '',
    notes: appointmentData.notes || '',
    doctor
  };
}

/**
 * Helper to convert appointments with correct types
 */
export function toAppointmentWithPatient(appointmentData: any): Appointment & { patient: Patient } {
  const status = asAppointmentStatus(appointmentData.status);
  
  return {
    id: appointmentData.id,
    patientId: appointmentData.patientId,
    doctorId: appointmentData.doctorId,
    date: appointmentData.date,
    time: appointmentData.time,
    status: status,
    reason: appointmentData.reason || '',
    notes: appointmentData.notes || '',
    patient: {
      id: appointmentData.patient.id,
      name: appointmentData.patient.name || appointmentData.patient.full_name,
      email: appointmentData.patient.email,
      phone: appointmentData.patient.phone || '',
      role: 'patient'
    }
  };
}
