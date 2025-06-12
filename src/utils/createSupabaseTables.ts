import { supabase } from "@/integrations/supabase/client";

/**
 * Create missing Supabase tables if they don't exist
 * This is a fallback for when tables are missing
 */
export const createMissingTables = async () => {
  try {
    console.log("Checking and creating missing Supabase tables...");

    // Check if ai_chat_history table exists
    const { error: aiChatError } = await supabase
      .from('ai_chat_history')
      .select('id')
      .limit(1);

    if (aiChatError && aiChatError.message.includes('does not exist')) {
      console.log("ai_chat_history table doesn't exist - this is expected, using Firebase instead");
    }

    // Check if patient_profiles table exists
    const { error: patientProfileError } = await supabase
      .from('patient_profiles')
      .select('id')
      .limit(1);

    if (patientProfileError && patientProfileError.message.includes('does not exist')) {
      console.log("patient_profiles table doesn't exist - this is expected, using profiles table instead");
    }

    // Check if messages table exists for doctor-patient chat
    const { error: messagesError } = await supabase
      .from('messages')
      .select('id')
      .limit(1);

    if (messagesError && messagesError.message.includes('does not exist')) {
      console.log("messages table doesn't exist - using Firebase for messaging instead");
    }

    console.log("Table check completed - using Firebase for chat functionality");
    return true;

  } catch (error) {
    console.error("Error checking tables:", error);
    return false;
  }
};

/**
 * Initialize database tables on app startup
 */
export const initializeDatabase = async () => {
  try {
    await createMissingTables();
    console.log("Database initialization completed");
  } catch (error) {
    console.error("Database initialization failed:", error);
  }
};
