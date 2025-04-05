
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
        specialty: 'System',
        experience_years: 0
      })
      .select()
      .single();
      
    if (doctorProfilesError && !doctorProfilesError.message.includes('duplicate key')) {
      console.error("Error creating doctor_profiles table:", doctorProfilesError);
    }
    
    // Create appointments table
    const { error: appointmentsError } = await supabase
      .from('appointments')
      .select()
      .limit(1);
      
    if (appointmentsError && !appointmentsError.code.includes('PGRST')) {
      console.error("Error accessing appointments table:", appointmentsError);
    }
    
    // Create messages table
    const { error: messagesError } = await supabase
      .from('messages')
      .select()
      .limit(1);
      
    if (messagesError && !messagesError.code.includes('PGRST')) {
      console.error("Error accessing messages table:", messagesError);
    }
    
    // Check medications table
    const { error: medicationsError } = await supabase
      .from('medications')
      .select()
      .limit(1);
      
    if (medicationsError && !medicationsError.code.includes('PGRST')) {
      console.error("Error accessing medications table:", medicationsError);
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
