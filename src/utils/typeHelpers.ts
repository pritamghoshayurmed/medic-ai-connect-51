
import { Doctor, Patient, Appointment, UserRole, DoctorProfile } from "@/types";

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
    id: doctorData.id || '',
    name: doctorData.name || doctorData.full_name || '',
    email: doctorData.email || '',
    phone: doctorData.phone || '',
    role: 'doctor' as const, // Explicitly set as 'doctor' to satisfy TypeScript
    specialty: doctorData.specialty || '',
    experience: doctorData.experience || doctorData.experience_years || 0,
    education: doctorData.education || doctorData.qualification || '',
    hospital: doctorData.hospital || '',
    rating: doctorData.rating || 0,
    profilePic: doctorData.profilePic || '/lovable-uploads/769f4117-004e-45a0-adf4-56b690fc298b.png'
  };
}

/**
 * Helper to convert doctor profiles data to doctor array
 */
export function toDoctorArray(doctorProfilesData: any[]): Doctor[] {
  if (!Array.isArray(doctorProfilesData)) return [];
  
  return doctorProfilesData.map(doctor => toDoctorType(doctor));
}

/**
 * Helper to convert doctor profiles from database format to app format
 */
export function processDoctorProfile(profileData: any): Doctor {
  // Handle potential Supabase query error or null data
  if (!profileData || profileData.error || !profileData.id) {
    return {
      id: '',
      name: '',
      email: '',
      phone: '',
      role: 'doctor',
      specialty: '',
      experience: 0,
      education: '',
      hospital: '',
      rating: 0,
      profilePic: '/lovable-uploads/769f4117-004e-45a0-adf4-56b690fc298b.png'
    };
  }

  return {
    id: profileData.id,
    name: profileData.full_name || '',
    email: profileData.email || '',
    phone: profileData.phone || '',
    role: 'doctor',
    specialty: profileData.specialties?.name || 
              (profileData.doctor_profiles?.specialty_id ? 'Specialist' : 'General Practitioner'),
    experience: profileData.doctor_profiles?.experience_years || 0,
    education: profileData.doctor_profiles?.qualification || '',
    hospital: '',
    rating: profileData.doctor_profiles?.rating || 0,
    profilePic: '/lovable-uploads/769f4117-004e-45a0-adf4-56b690fc298b.png'
  };
}

/**
 * Helper to convert appointments with correct types
 */
export function toAppointmentWithDoctor(appointmentData: any): Appointment & { doctor: Doctor } {
  const status = asAppointmentStatus(appointmentData.status);
  const doctor = toDoctorType(appointmentData.doctor || {});
  
  return {
    id: appointmentData.id,
    patientId: appointmentData.patientId || appointmentData.patient_id,
    doctorId: appointmentData.doctorId || appointmentData.doctor_id,
    date: appointmentData.date || appointmentData.appointment_date,
    time: appointmentData.time || appointmentData.appointment_time,
    status: status,
    reason: appointmentData.reason || appointmentData.symptoms || '',
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
    patientId: appointmentData.patientId || appointmentData.patient_id,
    doctorId: appointmentData.doctorId || appointmentData.doctor_id,
    date: appointmentData.date || appointmentData.appointment_date,
    time: appointmentData.time || appointmentData.appointment_time,
    status: status,
    reason: appointmentData.reason || appointmentData.symptoms || '',
    notes: appointmentData.notes || '',
    patient: {
      id: appointmentData.patient?.id || '',
      name: appointmentData.patient?.name || appointmentData.patient?.full_name || '',
      email: appointmentData.patient?.email || '',
      phone: appointmentData.patient?.phone || '',
      role: 'patient'
    }
  };
}
