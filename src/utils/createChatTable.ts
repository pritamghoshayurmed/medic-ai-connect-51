import { rawSupabase } from "@/integrations/supabase/client";

export const createAIChatHistoryTable = async () => {
  try {
    console.log("Creating ai_chat_history table if it doesn't exist...");
    
    // Create the table
    const { error: tableError } = await rawSupabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.ai_chat_history (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          messages JSONB NOT NULL DEFAULT '[]'::jsonb,
          conversation_history JSONB DEFAULT '[]'::jsonb,
          summary TEXT DEFAULT 'AI Chat Session',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
      `
    });

    if (tableError) {
      console.error("Error creating table:", tableError);
      return false;
    }

    // Enable RLS
    const { error: rlsError } = await rawSupabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE public.ai_chat_history ENABLE ROW LEVEL SECURITY;
      `
    });

    if (rlsError && !rlsError.message.includes('already enabled')) {
      console.error("Error enabling RLS:", rlsError);
    }

    // Create policies
    const { error: policyError } = await rawSupabase.rpc('exec_sql', {
      sql: `
        DO $$ 
        BEGIN
          -- Drop existing policies if they exist
          DROP POLICY IF EXISTS "Users can view their own chat history" ON public.ai_chat_history;
          DROP POLICY IF EXISTS "Users can insert their own chat history" ON public.ai_chat_history;
          DROP POLICY IF EXISTS "Users can update their own chat history" ON public.ai_chat_history;
          DROP POLICY IF EXISTS "Users can delete their own chat history" ON public.ai_chat_history;
          
          -- Create new policies
          CREATE POLICY "Users can view their own chat history" 
            ON public.ai_chat_history FOR SELECT 
            USING (auth.uid() = user_id);
          
          CREATE POLICY "Users can insert their own chat history" 
            ON public.ai_chat_history FOR INSERT 
            WITH CHECK (auth.uid() = user_id);
            
          CREATE POLICY "Users can update their own chat history" 
            ON public.ai_chat_history FOR UPDATE 
            USING (auth.uid() = user_id)
            WITH CHECK (auth.uid() = user_id);
            
          CREATE POLICY "Users can delete their own chat history" 
            ON public.ai_chat_history FOR DELETE 
            USING (auth.uid() = user_id);
        END $$;
      `
    });

    if (policyError) {
      console.error("Error creating policies:", policyError);
      return false;
    }

    console.log("ai_chat_history table created successfully with RLS policies");
    return true;

  } catch (error) {
    console.error("Error in createAIChatHistoryTable:", error);
    return false;
  }
};

// Alternative simple table creation without RPC
export const createAIChatHistoryTableSimple = async () => {
  try {
    console.log("Creating ai_chat_history table using simple approach...");
    
    // Try to insert a test record to see if table exists
    const { error: testError } = await rawSupabase
      .from('ai_chat_history')
      .select('id')
      .limit(1);

    if (testError && testError.message.includes('does not exist')) {
      console.log("Table doesn't exist, but we can't create it via client. Please create it manually in Supabase dashboard.");
      return false;
    }

    console.log("ai_chat_history table exists or accessible");
    return true;

  } catch (error) {
    console.error("Error checking table:", error);
    return false;
  }
};
