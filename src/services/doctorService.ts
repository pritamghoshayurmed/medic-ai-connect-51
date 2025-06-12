import { supabase } from '@/integrations/supabase/client';
import { DoctorProfile } from '@/types';

/**
 * Service to handle doctor data from Supabase
 * This bridges the gap between Supabase user management and Firebase chat
 */
class DoctorService {
  /**
   * Get doctor profile by ID from Supabase
   */
  async getDoctorById(doctorId: string): Promise<DoctorProfile | null> {
    try {
      console.log(`Fetching doctor profile for ID: ${doctorId}`);

      const { data: profile, error } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          email,
          phone,
          role,
          doctor_profiles (
            about,
            available_days,
            available_hours,
            consultation_fee,
            experience_years,
            qualification,
            rating,
            total_reviews,
            specialty_id
          ),
          specialties (
            id,
            name
          )
        `)
        .eq('id', doctorId)
        .eq('role', 'doctor')
        .single();

      if (error) {
        console.error('Error fetching doctor profile:', error);
        return null;
      }

      if (!profile) {
        console.log(`No doctor found with ID: ${doctorId}`);
        return null;
      }

      // Transform the data to match our DoctorProfile interface
      const doctorProfile: DoctorProfile = {
        id: profile.id,
        full_name: profile.full_name,
        email: profile.email,
        phone: profile.phone || '',
        role: profile.role,
        doctor_profiles: profile.doctor_profiles,
        specialty: profile.specialties
      };

      console.log(`Successfully fetched doctor profile:`, doctorProfile);
      return doctorProfile;
    } catch (error) {
      console.error('Error in getDoctorById:', error);
      return null;
    }
  }

  /**
   * Get all available doctors
   */
  async getAllDoctors(): Promise<DoctorProfile[]> {
    try {
      console.log('Fetching all doctors...');

      const { data: profiles, error } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          email,
          phone,
          role,
          doctor_profiles (
            about,
            available_days,
            available_hours,
            consultation_fee,
            experience_years,
            qualification,
            rating,
            total_reviews,
            specialty_id
          ),
          specialties (
            id,
            name
          )
        `)
        .eq('role', 'doctor');

      if (error) {
        console.error('Error fetching doctors:', error);
        return [];
      }

      const doctors: DoctorProfile[] = profiles?.map(profile => ({
        id: profile.id,
        full_name: profile.full_name,
        email: profile.email,
        phone: profile.phone || '',
        role: profile.role,
        doctor_profiles: profile.doctor_profiles,
        specialty: profile.specialties
      })) || [];

      console.log(`Successfully fetched ${doctors.length} doctors`);
      return doctors;
    } catch (error) {
      console.error('Error in getAllDoctors:', error);
      return [];
    }
  }

  /**
   * Search doctors by name or specialty
   */
  async searchDoctors(query: string): Promise<DoctorProfile[]> {
    try {
      console.log(`Searching doctors with query: ${query}`);

      const { data: profiles, error } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          email,
          phone,
          role,
          doctor_profiles (
            about,
            available_days,
            available_hours,
            consultation_fee,
            experience_years,
            qualification,
            rating,
            total_reviews,
            specialty_id
          ),
          specialties (
            id,
            name
          )
        `)
        .eq('role', 'doctor')
        .or(`full_name.ilike.%${query}%,specialties.name.ilike.%${query}%`);

      if (error) {
        console.error('Error searching doctors:', error);
        return [];
      }

      const doctors: DoctorProfile[] = profiles?.map(profile => ({
        id: profile.id,
        full_name: profile.full_name,
        email: profile.email,
        phone: profile.phone || '',
        role: profile.role,
        doctor_profiles: profile.doctor_profiles,
        specialty: profile.specialties
      })) || [];

      console.log(`Found ${doctors.length} doctors matching query: ${query}`);
      return doctors;
    } catch (error) {
      console.error('Error in searchDoctors:', error);
      return [];
    }
  }

  /**
   * Check if a user is a doctor
   */
  async isDoctor(userId: string): Promise<boolean> {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (error || !profile) {
        return false;
      }

      return profile.role === 'doctor';
    } catch (error) {
      console.error('Error checking if user is doctor:', error);
      return false;
    }
  }

  /**
   * Get doctor's basic info for chat display
   */
  async getDoctorBasicInfo(doctorId: string): Promise<{ name: string; specialty?: string } | null> {
    try {
      const doctor = await this.getDoctorById(doctorId);
      if (!doctor) return null;

      return {
        name: doctor.full_name,
        specialty: doctor.specialty?.name
      };
    } catch (error) {
      console.error('Error getting doctor basic info:', error);
      return null;
    }
  }
}

export const doctorService = new DoctorService();
export default doctorService;
