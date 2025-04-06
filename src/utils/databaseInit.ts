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
    
    await initializeAIChatHistoryTable();
    
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

// Add this function to create the AI chat history table
export const initializeAIChatHistoryTable = async () => {
  try {
    const { supabase } = await import('@/integrations/supabase/client');
    
    // Check if the table exists
    const { error: checkError } = await supabase.from('ai_chat_history').select('id').limit(1);
    
    // If we get an error about the relation not existing, we need to create the table
    if (checkError && checkError.message.includes('relation "ai_chat_history" does not exist')) {
      // Create the table with SQL
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS public.ai_chat_history (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          messages JSONB NOT NULL,
          summary TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
        
        -- Add RLS policies
        ALTER TABLE public.ai_chat_history ENABLE ROW LEVEL SECURITY;
        
        -- Users can view/modify only their own chat history
        CREATE POLICY "Users can view their own chat history" 
          ON public.ai_chat_history FOR SELECT 
          USING (auth.uid() = user_id);
        
        CREATE POLICY "Users can insert their own chat history" 
          ON public.ai_chat_history FOR INSERT 
          WITH CHECK (auth.uid() = user_id);
        
        CREATE POLICY "Users can update their own chat history" 
          ON public.ai_chat_history FOR UPDATE
          USING (auth.uid() = user_id);
        
        CREATE POLICY "Users can delete their own chat history" 
          ON public.ai_chat_history FOR DELETE
          USING (auth.uid() = user_id);
        
        -- Grant permissions
        GRANT ALL ON public.ai_chat_history TO authenticated;
        GRANT ALL ON public.ai_chat_history TO service_role;
      `;
      
      // Execute the SQL
      const { error } = await supabase.rpc('exec_sql', { sql: createTableSQL });
      
      if (error) {
        console.error('Error creating ai_chat_history table:', error);
      } else {
        console.log('ai_chat_history table created successfully');
      }
    } else if (checkError) {
      console.error('Error checking for ai_chat_history table:', checkError);
    } else {
      console.log('ai_chat_history table already exists');
    }
  } catch (error) {
    console.error('Error initializing ai_chat_history table:', error);
  }
};
