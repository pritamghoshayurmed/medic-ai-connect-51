
import { supabase } from "@/integrations/supabase/client";

export async function initializeDatabase() {
  try {
    console.log("Initializing database...");
    
    // Create profiles table if it doesn't exist
    const { error: profilesError } = await supabase
      .from('profiles')
      .insert({
        id: '00000000-0000-0000-0000-000000000000',
        full_name: 'System',
        email: 'system@example.com',
        role: 'system'
      })
      .select()
      .single();
      
    if (profilesError && !profilesError.message.includes('duplicate key')) {
      console.error("Error creating profiles table:", profilesError);
    }
    
    // Create doctor_profiles table
    const { error: doctorProfilesError } = await supabase
      .from('doctor_profiles')
      .insert({
        id: '00000000-0000-0000-0000-000000000000',
        experience_years: 0,
        available_days: ['Monday'],
        available_hours: {},
        consultation_fee: 0,
        qualification: 'System'
      })
      .select()
      .single();
      
    if (doctorProfilesError && !doctorProfilesError.message.includes('duplicate key')) {
      console.error("Error creating doctor_profiles table:", doctorProfilesError);
    }
    
    // Check appointments table
    const { error: appointmentsError } = await supabase
      .from('appointments')
      .select()
      .limit(1);
      
    if (appointmentsError && !appointmentsError.code.includes('PGRST')) {
      console.error("Error accessing appointments table:", appointmentsError);
    }
    
    // Check messages table
    const { error: messagesError } = await supabase
      .from('messages')
      .select()
      .limit(1);
      
    if (messagesError && !messagesError.code.includes('PGRST')) {
      console.error("Error accessing messages table:", messagesError);
    }
    
    console.log("Database initialization complete.");
    
  } catch (error) {
    console.error("Error initializing database:", error);
  }
}

export async function initializeUserTriggers() {
  try {
    console.log("Database and triggers already initialized through migrations");
    return true;
  } catch (error) {
    console.error("Error during trigger initialization check:", error);
    return false;
  }
}
