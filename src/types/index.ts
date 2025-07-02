export type UserRole = 'patient' | 'doctor';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  profilePic?: string;
}

export interface Patient extends User {
  role: 'patient';
  dateOfBirth?: string;
  bloodType?: string;
  allergies?: string[];
  medications?: Medication[];
  appointments?: Appointment[];
  medicalReports?: MedicalReport[];
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

export interface PatientMedicalInfo {
  id: string;
  patient_id: string;
  blood_type: string | null;
  allergies: string[];
  chronic_conditions: string[];
  created_at: string;
  updated_at: string;
}

export interface Doctor extends User {
  role: 'doctor';
  specialty?: string;
  experience?: number;
  education?: string;
  hospital?: string;
  availability?: Availability[];
  rating?: number;
  appointments?: Appointment[]; // This can use the new Appointment type
}

export interface Profile { // Generic profile, can be used for patient or doctor basic info
  id: string;
  full_name: string;
  email?: string;
  phone?: string;
  role?: UserRole;
  profile_pic_url?: string; // Assuming this field might exist
  // Specific profile details would be in doctor_profiles or patient_profiles
  doctor_profiles?: {
    specialty_id?: string;
    // other doctor specific fields
  };
  specialties?: { // if specialties are linked directly to profiles
    id: string;
    name: string;
  };
}


export interface DoctorProfile { // More detailed doctor profile
  id: string;
  full_name: string;
  email: string;
  phone: string;
  role: string; // Should be 'doctor'
  doctor_profiles?: { // Data from the doctor_profiles table
    about?: string;
    available_days?: string[];
    available_hours?: Record<string, any>; // Consider a more structured type
    consultation_fee?: number;
    experience_years?: number;
    qualification?: string;
    rating?: number;
    total_reviews?: number;
    specialty_id?: string; // Foreign key to specialties table
  };
  specialty?: { // Joined data from specialties table
    id: string;
    name: string;
  };
}

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  startDate: string;
  endDate?: string;
  prescribed_by: string; // Could be doctor_id
}

// For creating a new appointment (input to the service)
export interface NewAppointment {
  patient_id: string;
  doctor_id: string;
  appointment_date: string; // YYYY-MM-DD
  appointment_time: string; // HH:MM AM/PM or 24hr format
  reason: string;
  appointment_type: 'video' | 'phone' | 'in_person';
  status?: 'pending' | 'confirmed' | 'cancelled' | 'completed'; // Optional, defaults to 'pending'
  notes?: string;
  location?: string;      // For in-person
  meeting_link?: string;  // For video/phone
}

// For displaying/using an appointment (output from the service)
export interface Appointment {
  id: string; // uuid
  patient_id: string;
  doctor_id: string;
  appointment_date: string; // date
  appointment_time: string; // text
  reason: string;           // text
  appointment_type: 'video' | 'phone' | 'in_person'; // text
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'; // text
  notes?: string | null;        // text
  location?: string | null;     // text
  meeting_link?: string | null; // text
  created_at: string;       // timestampz

  // Optional: populated by joins in the service
  doctor?: Profile; // Basic doctor info
  patient?: Profile; // Basic patient info
}

export interface ArticleAuthor { // Simplified author profile for articles
  full_name: string | null;
  profile_pic_url?: string | null;
}
export interface Article {
  id: string; // uuid
  title: string;
  slug: string;
  content: string; // Full content (Markdown or HTML)
  author_id?: string | null; // uuid, FK to profiles
  author_name?: string | null; // Denormalized or if external author
  image_url?: string | null;
  tags?: string[] | null;
  estimated_read_time?: number | null; // In minutes
  published_at: string; // timestampz
  created_at: string; // timestampz
  updated_at: string; // timestampz
  author?: ArticleAuthor | null; // Joined author profile data
  // content_snippet?: string; // If fetched by service, otherwise generate in component
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

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  timestamp: string;
  read: boolean;
  appointmentId?: string;
}

export interface ChatRoom {
  id: string;
  participants: string[];
  lastMessage?: Message;
}

export interface Availability {
  day: string;
  startTime: string;
  endTime: string;
  slotDuration: number; // in minutes
}
