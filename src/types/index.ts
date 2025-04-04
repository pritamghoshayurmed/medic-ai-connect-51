
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

export interface Doctor extends User {
  role: 'doctor';
  specialty: string;
  experience: number;
  education?: string;
  hospital?: string;
  availability?: Availability[];
  rating?: number;
  appointments?: Appointment[];
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

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  reason?: string;
  notes?: string;
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
