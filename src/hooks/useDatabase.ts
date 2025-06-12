import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DatabaseService } from '@/services/databaseService';
import { User, UserRole, Doctor, Patient, Appointment, Message } from '@/types';
import { toast } from 'sonner';

// Query Keys
export const queryKeys = {
  user: (id: string) => ['user', id],
  doctor: (id: string) => ['doctor', id],
  patient: (id: string) => ['patient', id],
  doctors: () => ['doctors'],
  appointments: (userId: string, role: UserRole) => ['appointments', userId, role],
  messages: (userId1: string, userId2: string) => ['messages', userId1, userId2],
  chatRooms: (userId: string) => ['chatRooms', userId],
};

// User Profile Hooks
export function useUserProfile(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.user(userId || ''),
    queryFn: () => DatabaseService.getUserProfile(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useUpdateUserProfile() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ userId, updates }: { userId: string; updates: Partial<User> }) =>
      DatabaseService.updateUserProfile(userId, updates),
    onSuccess: (success, { userId }) => {
      if (success) {
        queryClient.invalidateQueries({ queryKey: queryKeys.user(userId) });
        toast.success('Profile updated successfully');
      } else {
        toast.error('Failed to update profile');
      }
    },
    onError: () => {
      toast.error('Failed to update profile');
    },
  });
}

// Doctor Profile Hooks
export function useDoctorProfile(doctorId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.doctor(doctorId || ''),
    queryFn: () => DatabaseService.getDoctorProfile(doctorId!),
    enabled: !!doctorId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useAllDoctors() {
  return useQuery({
    queryKey: queryKeys.doctors(),
    queryFn: DatabaseService.getAllDoctors,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useUpdateDoctorProfile() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ doctorId, updates }: { doctorId: string; updates: Partial<Doctor> }) =>
      DatabaseService.updateDoctorProfile(doctorId, updates),
    onSuccess: (success, { doctorId }) => {
      if (success) {
        queryClient.invalidateQueries({ queryKey: queryKeys.doctor(doctorId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.doctors() });
        toast.success('Doctor profile updated successfully');
      } else {
        toast.error('Failed to update doctor profile');
      }
    },
    onError: () => {
      toast.error('Failed to update doctor profile');
    },
  });
}

// Patient Profile Hooks
export function usePatientProfile(patientId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.patient(patientId || ''),
    queryFn: () => DatabaseService.getPatientProfile(patientId!),
    enabled: !!patientId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdatePatientProfile() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ patientId, updates }: { patientId: string; updates: Partial<Patient> }) =>
      DatabaseService.updatePatientProfile(patientId, updates),
    onSuccess: (success, { patientId }) => {
      if (success) {
        queryClient.invalidateQueries({ queryKey: queryKeys.patient(patientId) });
        toast.success('Patient profile updated successfully');
      } else {
        toast.error('Failed to update patient profile');
      }
    },
    onError: () => {
      toast.error('Failed to update patient profile');
    },
  });
}

// Appointment Hooks
export function useAppointments(userId: string | undefined, role: UserRole | undefined) {
  return useQuery({
    queryKey: queryKeys.appointments(userId || '', role || 'patient'),
    queryFn: () => DatabaseService.getAppointments(userId!, role!),
    enabled: !!userId && !!role,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useCreateAppointment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (appointment: Omit<Appointment, 'id'>) =>
      DatabaseService.createAppointment(appointment),
    onSuccess: (appointmentId, appointment) => {
      if (appointmentId) {
        // Invalidate appointments for both patient and doctor
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.appointments(appointment.patientId, 'patient') 
        });
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.appointments(appointment.doctorId, 'doctor') 
        });
        toast.success('Appointment created successfully');
      } else {
        toast.error('Failed to create appointment');
      }
    },
    onError: () => {
      toast.error('Failed to create appointment');
    },
  });
}

export function useUpdateAppointmentStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ appointmentId, status }: { appointmentId: string; status: Appointment['status'] }) =>
      DatabaseService.updateAppointmentStatus(appointmentId, status),
    onSuccess: (success) => {
      if (success) {
        // Invalidate all appointment queries
        queryClient.invalidateQueries({ queryKey: ['appointments'] });
        toast.success('Appointment status updated');
      } else {
        toast.error('Failed to update appointment status');
      }
    },
    onError: () => {
      toast.error('Failed to update appointment status');
    },
  });
}

// Message Hooks
export function useMessages(userId1: string | undefined, userId2: string | undefined) {
  return useQuery({
    queryKey: queryKeys.messages(userId1 || '', userId2 || ''),
    queryFn: () => DatabaseService.getMessages(userId1!, userId2!),
    enabled: !!userId1 && !!userId2,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 5 * 1000, // Refetch every 5 seconds for real-time feel
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ senderId, receiverId, content }: { senderId: string; receiverId: string; content: string }) =>
      DatabaseService.sendMessage(senderId, receiverId, content),
    onSuccess: (messageId, { senderId, receiverId }) => {
      if (messageId) {
        // Invalidate messages between these users
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.messages(senderId, receiverId) 
        });
        // Invalidate chat rooms for both users
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.chatRooms(senderId) 
        });
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.chatRooms(receiverId) 
        });
      } else {
        toast.error('Failed to send message');
      }
    },
    onError: () => {
      toast.error('Failed to send message');
    },
  });
}

export function useMarkMessagesAsRead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ userId, otherUserId }: { userId: string; otherUserId: string }) =>
      DatabaseService.markMessagesAsRead(userId, otherUserId),
    onSuccess: (success, { userId, otherUserId }) => {
      if (success) {
        // Invalidate messages and chat rooms
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.messages(userId, otherUserId) 
        });
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.chatRooms(userId) 
        });
      }
    },
  });
}

// Chat Rooms Hook
export function useChatRooms(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.chatRooms(userId || ''),
    queryFn: () => DatabaseService.getChatRooms(userId!),
    enabled: !!userId,
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchInterval: 10 * 1000, // Refetch every 10 seconds
  });
}
