import { supabase } from "@/integrations/supabase/client";
import { User, UserRole, Doctor, Patient, Appointment, Message } from "@/types";
import type { Database } from "@/integrations/supabase/types";

type Tables = Database['public']['Tables'];
type ProfileRow = Tables['profiles']['Row'];
type DoctorProfileRow = Tables['doctor_profiles']['Row'];
type PatientProfileRow = Tables['patient_profiles']['Row'];
type AppointmentRow = Tables['appointments']['Row'];
type MessageRow = Tables['messages']['Row'];

export class DatabaseService {
  // User Profile Operations
  static async getUserProfile(userId: string): Promise<User | null> {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select(`
          *,
          doctor_profiles(*),
          patient_profiles(*)
        `)
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }

      if (!profile) return null;

      // Transform database profile to User type
      const userData: User = {
        id: profile.id,
        name: profile.full_name,
        email: profile.email,
        phone: profile.phone || '',
        role: profile.role as UserRole,
        profilePic: undefined // Add profile pic logic later
      };

      return userData;
    } catch (error) {
      console.error('Error in getUserProfile:', error);
      return null;
    }
  }

  static async getLimitedDoctors(limit: number = 3): Promise<Doctor[]> { // Default to 3 as per dashboard
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          email,
          phone,
          avatar_url,
          doctor_profiles (
            qualification,
            experience_years,
            rating
          )
        `)
        .eq('role', 'doctor')
        .order('full_name', { ascending: true }) // Simple ordering for consistency
        .limit(limit);

      if (error) {
        console.error('Error fetching limited doctors:', error);
        return [];
      }

      return data.map(profile => {
        const doctorProfile = profile.doctor_profiles as DoctorProfileRow | null; // doctor_profiles can be null if no entry

        return {
          id: profile.id,
          name: profile.full_name || 'N/A',
          email: profile.email || '',
          phone: profile.phone || '',
          profilePic: profile.avatar_url || undefined,
          role: 'doctor' as const,
          specialty: doctorProfile?.qualification || 'General Practitioner',
          experience: doctorProfile?.experience_years || 0,
          rating: doctorProfile?.rating || 0,
          // Fields not fetched for limited view, can be defaulted or omitted
          availableDays: [],
          availableHours: {},
          consultationFee: 0
        };
      });
    } catch (error) {
      console.error('Error in getLimitedDoctors:', error);
      return [];
    }
  }

  static async updateUserProfile(userId: string, updates: Partial<User>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: updates.name,
          email: updates.email,
          phone: updates.phone,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        console.error('Error updating user profile:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateUserProfile:', error);
      return false;
    }
  }

  // Doctor Profile Operations
  static async getDoctorProfile(doctorId: string): Promise<Doctor | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          doctor_profiles(*)
        `)
        .eq('id', doctorId)
        .eq('role', 'doctor')
        .single();

      if (error || !data) {
        console.error('Error fetching doctor profile:', error);
        return null;
      }

      const doctorProfile = data.doctor_profiles as DoctorProfileRow;
      
      const doctor: Doctor = {
        id: data.id,
        name: data.full_name,
        email: data.email,
        phone: data.phone || '',
        role: 'doctor',
        specialty: doctorProfile?.qualification || '',
        experience: doctorProfile?.experience_years || 0,
        rating: doctorProfile?.rating || 0,
        availableDays: doctorProfile?.available_days || [],
        availableHours: doctorProfile?.available_hours as Record<string, string[]> || {},
        consultationFee: doctorProfile?.consultation_fee || 0
      };

      return doctor;
    } catch (error) {
      console.error('Error in getDoctorProfile:', error);
      return null;
    }
  }

  static async getAllDoctors(): Promise<Doctor[]> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          doctor_profiles(*)
        `)
        .eq('role', 'doctor');

      if (error) {
        console.error('Error fetching doctors:', error);
        return [];
      }

      return data.map(profile => {
        const doctorProfile = profile.doctor_profiles as DoctorProfileRow | null;
        
        return {
          id: profile.id,
          name: profile.full_name || 'N/A',
          email: profile.email || '',
          phone: profile.phone || '',
          profilePic: profile.avatar_url || undefined,
          role: 'doctor' as const,
          specialty: doctorProfile?.qualification || 'General Practitioner',
          experience: doctorProfile?.experience_years || 0,
          rating: doctorProfile?.rating || 0,
          availableDays: doctorProfile?.available_days || [],
          availableHours: doctorProfile?.available_hours as Record<string, string[]> || {},
          consultationFee: doctorProfile?.consultation_fee || 0
        };
      });
    } catch (error) {
      console.error('Error in getAllDoctors:', error);
      return [];
    }
  }

  static async updateDoctorProfile(doctorId: string, updates: Partial<Doctor>): Promise<boolean> {
    try {
      // Update basic profile
      if (updates.name || updates.email || updates.phone) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            full_name: updates.name,
            email: updates.email,
            phone: updates.phone,
            updated_at: new Date().toISOString()
          })
          .eq('id', doctorId);

        if (profileError) {
          console.error('Error updating doctor profile:', profileError);
          return false;
        }
      }

      // Update doctor-specific profile
      const doctorUpdates: any = {};
      if (updates.specialty !== undefined) doctorUpdates.qualification = updates.specialty;
      if (updates.experience !== undefined) doctorUpdates.experience_years = updates.experience;
      if (updates.consultationFee !== undefined) doctorUpdates.consultation_fee = updates.consultationFee;
      if (updates.availableDays !== undefined) doctorUpdates.available_days = updates.availableDays;
      if (updates.availableHours !== undefined) doctorUpdates.available_hours = updates.availableHours;

      if (Object.keys(doctorUpdates).length > 0) {
        doctorUpdates.updated_at = new Date().toISOString();
        
        const { error: doctorError } = await supabase
          .from('doctor_profiles')
          .update(doctorUpdates)
          .eq('id', doctorId);

        if (doctorError) {
          console.error('Error updating doctor profile details:', doctorError);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Error in updateDoctorProfile:', error);
      return false;
    }
  }

  // Patient Profile Operations
  static async getPatientProfile(patientId: string): Promise<Patient | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          patient_profiles(*)
        `)
        .eq('id', patientId)
        .eq('role', 'patient')
        .single();

      if (error || !data) {
        console.error('Error fetching patient profile:', error);
        return null;
      }

      const patientProfile = data.patient_profiles as PatientProfileRow;
      
      const patient: Patient = {
        id: data.id,
        name: data.full_name,
        email: data.email,
        phone: data.phone || '',
        role: 'patient',
        bloodGroup: patientProfile?.blood_type || '',
        allergies: patientProfile?.allergies || [],
        medicalConditions: patientProfile?.chronic_conditions || []
      };

      return patient;
    } catch (error) {
      console.error('Error in getPatientProfile:', error);
      return null;
    }
  }

  static async updatePatientProfile(patientId: string, updates: Partial<Patient>): Promise<boolean> {
    try {
      // Update basic profile
      if (updates.name || updates.email || updates.phone) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            full_name: updates.name,
            email: updates.email,
            phone: updates.phone,
            updated_at: new Date().toISOString()
          })
          .eq('id', patientId);

        if (profileError) {
          console.error('Error updating patient profile:', profileError);
          return false;
        }
      }

      // Update patient-specific profile
      const patientUpdates: any = {};
      if (updates.bloodGroup !== undefined) patientUpdates.blood_type = updates.bloodGroup;
      if (updates.allergies !== undefined) patientUpdates.allergies = updates.allergies;
      if (updates.medicalConditions !== undefined) patientUpdates.chronic_conditions = updates.medicalConditions;

      if (Object.keys(patientUpdates).length > 0) {
        patientUpdates.updated_at = new Date().toISOString();
        
        // First check if patient profile exists
        const { data: existingProfile } = await supabase
          .from('patient_profiles')
          .select('id')
          .eq('id', patientId)
          .single();

        if (existingProfile) {
          // Update existing profile
          const { error: patientError } = await supabase
            .from('patient_profiles')
            .update(patientUpdates)
            .eq('id', patientId);

          if (patientError) {
            console.error('Error updating patient profile details:', patientError);
            return false;
          }
        } else {
          // Create new patient profile
          const { error: patientError } = await supabase
            .from('patient_profiles')
            .insert({
              id: patientId,
              ...patientUpdates
            });

          if (patientError) {
            console.error('Error creating patient profile details:', patientError);
            return false;
          }
        }
      }

      return true;
    } catch (error) {
      console.error('Error in updatePatientProfile:', error);
      return false;
    }
  }

  // Appointment Operations
  static async getAppointments(userId: string, role: UserRole): Promise<Appointment[]> {
    try {
      const query = supabase
        .from('appointments')
        .select(`
          *,
          patient:profiles!appointments_patient_id_fkey(id, full_name, email, phone),
          doctor:profiles!appointments_doctor_id_fkey(id, full_name, email, phone)
        `);

      // Filter based on user role
      if (role === 'patient') {
        query.eq('patient_id', userId);
      } else if (role === 'doctor') {
        query.eq('doctor_id', userId);
      }

      const { data, error } = await query.order('appointment_date', { ascending: true });

      if (error) {
        console.error('Error fetching appointments:', error);
        return [];
      }

      return data.map(appointment => ({
        id: appointment.id,
        patientId: appointment.patient_id || '',
        doctorId: appointment.doctor_id || '',
        date: appointment.appointment_date,
        time: appointment.appointment_time,
        status: appointment.status as Appointment['status'],
        reason: appointment.symptoms || ''
      }));
    } catch (error) {
      console.error('Error in getAppointments:', error);
      return [];
    }
  }

  static async createAppointment(appointment: Omit<Appointment, 'id'>): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .insert({
          patient_id: appointment.patientId,
          doctor_id: appointment.doctorId,
          appointment_date: appointment.date,
          appointment_time: appointment.time,
          status: appointment.status,
          symptoms: appointment.reason
        })
        .select('id')
        .single();

      if (error) {
        console.error('Error creating appointment:', error);
        return null;
      }

      return data.id;
    } catch (error) {
      console.error('Error in createAppointment:', error);
      return null;
    }
  }

  static async updateAppointmentStatus(appointmentId: string, status: Appointment['status']): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', appointmentId);

      if (error) {
        console.error('Error updating appointment status:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateAppointmentStatus:', error);
      return false;
    }
  }

  // Message Operations
  static async getMessages(userId1: string, userId2: string): Promise<Message[]> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${userId1},receiver_id.eq.${userId2}),and(sender_id.eq.${userId2},receiver_id.eq.${userId1})`)
        .order('timestamp', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        return [];
      }

      return data.map(message => ({
        id: message.id,
        sender_id: message.sender_id,
        receiver_id: message.receiver_id,
        content: message.content,
        timestamp: message.timestamp || new Date().toISOString(),
        read: message.read || false
      }));
    } catch (error) {
      console.error('Error in getMessages:', error);
      return [];
    }
  }

  static async sendMessage(senderId: string, receiverId: string, content: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_id: senderId,
          receiver_id: receiverId,
          content,
          read: false
        })
        .select('id')
        .single();

      if (error) {
        console.error('Error sending message:', error);
        return null;
      }

      return data.id;
    } catch (error) {
      console.error('Error in sendMessage:', error);
      return null;
    }
  }

  static async markMessagesAsRead(userId: string, otherUserId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ read: true })
        .eq('sender_id', otherUserId)
        .eq('receiver_id', userId)
        .eq('read', false);

      if (error) {
        console.error('Error marking messages as read:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in markMessagesAsRead:', error);
      return false;
    }
  }

  // Chat Rooms Operations
  static async getChatRooms(userId: string): Promise<any[]> {
    try {
      // Get all conversations where user is either sender or receiver
      const { data, error } = await supabase
        .from('messages')
        .select(`
          sender_id,
          receiver_id,
          content,
          timestamp,
          read,
          sender:profiles!messages_sender_id_fkey(id, full_name, email, role),
          receiver:profiles!messages_receiver_id_fkey(id, full_name, email, role)
        `)
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .order('timestamp', { ascending: false });

      if (error) {
        console.error('Error fetching chat rooms:', error);
        return [];
      }

      // Group messages by conversation partner
      const conversations = new Map();

      data.forEach(message => {
        const partnerId = message.sender_id === userId ? message.receiver_id : message.sender_id;
        const partner = message.sender_id === userId ? message.receiver : message.sender;

        if (!conversations.has(partnerId)) {
          conversations.set(partnerId, {
            id: partnerId,
            partner,
            lastMessage: {
              content: message.content,
              timestamp: message.timestamp,
              senderId: message.sender_id
            },
            unreadCount: 0
          });
        }

        // Count unread messages
        if (message.receiver_id === userId && !message.read) {
          const conversation = conversations.get(partnerId);
          conversation.unreadCount++;
        }
      });

      return Array.from(conversations.values());
    } catch (error) {
      console.error('Error in getChatRooms:', error);
      return [];
    }
  }
}
