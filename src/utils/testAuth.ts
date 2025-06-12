// Test authentication functions
import { supabase } from '@/integrations/supabase/client';
import { runDatabaseSetup } from './runDatabaseSetup';

export const testDatabaseConnection = async () => {
  try {
    console.log('Testing database connection...');
    
    // Test basic connection
    const { data, error } = await supabase
      .from('profiles')
      .select('count(*)')
      .limit(1);
    
    if (error) {
      console.error('Database connection failed:', error);
      return false;
    }
    
    console.log('Database connection successful');
    return true;
  } catch (error) {
    console.error('Database connection error:', error);
    return false;
  }
};

export const testUserProfile = async (userId: string) => {
  try {
    console.log('Testing user profile fetch for:', userId);
    
    // Test profile fetch
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('Profile fetch failed:', error);
      return null;
    }
    
    console.log('Profile fetched successfully:', profile);
    
    // Test role-specific profile
    if (profile.role === 'doctor') {
      const { data: doctorProfile, error: doctorError } = await supabase
        .from('doctor_profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (doctorError) {
        console.warn('Doctor profile not found:', doctorError);
      } else {
        console.log('Doctor profile found:', doctorProfile);
      }
    } else if (profile.role === 'patient') {
      const { data: patientProfile, error: patientError } = await supabase
        .from('patient_profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (patientError) {
        console.warn('Patient profile not found:', patientError);
      } else {
        console.log('Patient profile found:', patientProfile);
      }
    }
    
    return profile;
  } catch (error) {
    console.error('User profile test error:', error);
    return null;
  }
};

export const testSignup = async (email: string, password: string, role: 'doctor' | 'patient', fullName: string, phone: string) => {
  try {
    console.log('Testing signup for:', email, 'as', role);
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: role,
          phone: phone
        }
      }
    });
    
    if (error) {
      console.error('Signup failed:', error);
      return false;
    }
    
    console.log('Signup successful:', data);
    
    // Wait for trigger to complete
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    if (data.user) {
      await testUserProfile(data.user.id);
    }
    
    return true;
  } catch (error) {
    console.error('Signup test error:', error);
    return false;
  }
};

export const testLogin = async (email: string, password: string) => {
  try {
    console.log('Testing login for:', email);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      console.error('Login failed:', error);
      return false;
    }
    
    console.log('Login successful:', data);
    
    if (data.user) {
      await testUserProfile(data.user.id);
    }
    
    return true;
  } catch (error) {
    console.error('Login test error:', error);
    return false;
  }
};

// Add to window for easy testing in browser console
if (typeof window !== 'undefined') {
  (window as any).testAuth = {
    testDatabaseConnection,
    testUserProfile,
    testSignup,
    testLogin
  };
}
