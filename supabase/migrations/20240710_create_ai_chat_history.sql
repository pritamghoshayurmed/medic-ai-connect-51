-- Create the ai_chat_history table
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

-- Create stored procedure for creating the ai_chat_history table
CREATE OR REPLACE FUNCTION public.create_ai_chat_history_table()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the table exists
  IF NOT EXISTS (
    SELECT FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename = 'ai_chat_history'
  ) THEN
    -- Create the table
    CREATE TABLE public.ai_chat_history (
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
  END IF;
END;
$$; 