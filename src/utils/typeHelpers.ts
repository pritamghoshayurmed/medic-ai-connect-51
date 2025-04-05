
import { User, UserRole, Appointment, Doctor, Patient } from "@/types";

export function asUserRole(role: string): UserRole {
  if (role === 'patient' || role === 'doctor') {
    return role;
  }
  return 'patient'; // Default to patient for safety
}

export function toAppointment(data: any): Appointment {
  return {
    id: data.id,
    patientId: data.patient_id,
    doctorId: data.doctor_id,
    date: data.appointment_date,
    time: data.appointment_time,
    status: data.status || 'pending',
    reason: data.symptoms || '',
  };
}

export function toAppointmentWithPatient(data: Appointment & { patient: Patient }): Appointment & { patient: Patient } {
  return data;
}

export function toAppointmentWithDoctor(data: Appointment & { doctor: Doctor }): Appointment & { doctor: Doctor } {
  return data;
}

export function toDoctor(data: any): Doctor {
  return {
    id: data.id,
    name: data.full_name || '',
    email: data.email || '',
    phone: data.phone || '',
    role: 'doctor',
    specialty: data.specialty || 'General Practitioner',
    experience: data.experience_years || 0,
    rating: data.rating || 4.5,
    profilePic: data.profile_pic || '/lovable-uploads/769f4117-004e-45a0-adf4-56b690fc298b.png',
  };
}

export function toPatient(data: any): Patient {
  return {
    id: data.id,
    name: data.full_name || '',
    email: data.email || '',
    phone: data.phone || '',
    role: 'patient',
    profilePic: data.profile_pic,
    dateOfBirth: data.date_of_birth,
    gender: data.gender,
    bloodGroup: data.blood_group,
    allergies: data.allergies,
    medicalConditions: data.medical_conditions,
  };
}
