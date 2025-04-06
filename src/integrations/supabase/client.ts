// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Get environment variables with fallback
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://jwgmrqizyovwvwbyapqp.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3Z21ycWl6eW92d3Z3YnlhcHFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3NDMwNjYsImV4cCI6MjA1OTMxOTA2Nn0.QCOPzdwEMCQW0gCqi7g8mGgK3gn9TEC8VJz-mY29QPM";

console.log('Initializing Supabase with URL:', SUPABASE_URL);

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

// Create typed supabase client
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// For when we need the raw client without type checking
export const rawSupabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// Create ai_chat_history table if it doesn't exist
export const createAIChatHistoryTable = async () => {
  try {
    // Check if the table exists by trying to select from it
    const { error: checkError } = await rawSupabase
      .from('ai_chat_history')
      .select('id')
      .limit(1);
    
    // Create the table if it doesn't exist
    if (checkError && checkError.message.includes('relation "ai_chat_history" does not exist')) {
      console.log('Creating AI Chat History table...');
      
      try {
        // We'll try using raw SQL with exec_sql RPC first
        const createTableSQL = `
          CREATE TABLE IF NOT EXISTS public.ai_chat_history (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            messages JSONB NOT NULL,
            conversation_history JSONB,
            summary TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
          );
          
          -- Add RLS policies if they don't exist
          DO $$ 
          BEGIN
            IF NOT EXISTS (
              SELECT FROM pg_policies 
              WHERE tablename = 'ai_chat_history' AND policyname = 'Users can view their own chat history'
            ) THEN
              ALTER TABLE public.ai_chat_history ENABLE ROW LEVEL SECURITY;
              
              CREATE POLICY "Users can view their own chat history" 
                ON public.ai_chat_history FOR SELECT 
                USING (auth.uid() = user_id);
              
              CREATE POLICY "Users can insert their own chat history" 
                ON public.ai_chat_history FOR INSERT 
                WITH CHECK (auth.uid() = user_id);
            END IF;
          END $$;
        `;
        
        const { error } = await rawSupabase.rpc('exec_sql', { sql: createTableSQL });
        
        if (error) {
          console.error('Failed to create table with RPC, falling back to standard method:', error);
          throw error;
        } else {
          console.log('AI Chat History table created successfully with RPC');
        }
      } catch (rpcError) {
        // Fallback to using the create_ai_chat_history_table RPC if available
        console.log('Falling back to create_ai_chat_history_table RPC');
        const { error } = await rawSupabase.rpc('create_ai_chat_history_table', {});
        
        if (error) {
          console.error('Error creating AI Chat History table with fallback:', error);
        } else {
          console.log('AI Chat History table created successfully with fallback RPC');
        }
      }
    } else {
      console.log('AI Chat History table already exists');
    }
  } catch (error) {
    console.error('Error during AI Chat History setup:', error);
  }
};

// Call this function when the app initializes
createAIChatHistoryTable();

// Initialize the AI chat history table and run a check to ensure it exists
setTimeout(() => {
  createAIChatHistoryTable();
}, 500);