
export type UserRole = "patient" | "doctor";

export interface User {
  id: string;
  email: string;
  name?: string;         // Populated from profile.full_name
  phone?: string;
  role?: UserRole;
  profilePic?: string;
  full_name?: string;   // Potentially redundant with name, review usage
}

export interface Doctor extends User {
  role: "doctor";
  specialty?: string;
  experience?: number;
  rating?: number;
  availableDays?: string[];
  availableHours?: Record<string, string[]>;
  consultationFee?: number;
}

export interface Patient extends User {
  role: "patient";
  dateOfBirth?: string;
  gender?: string;
  bloodGroup?: string;
  allergies?: string[];
  medicalConditions?: string[];
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  date: string;
  time: string;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  reason?: string;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  timestamp: string;
  read: boolean;
}

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  startDate: string;
  endDate?: string;
  prescribed_by: string;
}

export interface ChatRoom {
  id: string;
  participants: string[];
  lastMessage?: {
    content: string;
    timestamp: string;
    senderId: string;
  };
  unreadCount?: number;
}

// Additional Types for Supabase

export interface PatientMedicalInfo {
  id: string;
  patient_id: string;
  blood_type: string | null;
  allergies: string[];
  chronic_conditions: string[];
  created_at: string;
  updated_at: string;
}

export interface DoctorProfile {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  role: string;
  doctor_profiles?: {
    about?: string;
    available_days?: string[];
    available_hours?: Record<string, any>;
    consultation_fee?: number;
    experience_years?: number;
    qualification?: string;
    rating?: number;
    total_reviews?: number;
    specialty_id?: string;
  };
  specialty?: {
    id: string;
    name: string;
  };
}

export interface PatientProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'patient';
  profilePic?: string;
  medical_info?: {
    blood_type: string | null;
    allergies: string[];
    chronic_conditions: string[];
  };
}

export interface MedicalReport {
  id: string;
  patientId: string;
  doctorId?: string;
  date: string;
  reportType: string;
  reportFile: string;
  aiAnalysis?: string;
  diagnosis?: string;
}

export interface Availability {
  day: string;
  startTime: string;
  endTime: string;
  slotDuration: number; // in minutes
}
