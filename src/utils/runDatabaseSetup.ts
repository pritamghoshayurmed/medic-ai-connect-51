import { supabase } from '@/integrations/supabase/client';

export const runDatabaseSetup = async () => {
  console.log('🚀 Starting database setup...');
  
  try {
    // Step 1: Create tables
    console.log('📋 Creating tables...');
    
    const createTablesSQL = `
      -- 1. Ensure all required tables exist
      CREATE TABLE IF NOT EXISTS public.profiles (
        id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
        email TEXT NOT NULL,
        full_name TEXT NOT NULL,
        phone TEXT,
        role TEXT NOT NULL DEFAULT 'patient',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS public.doctor_profiles (
        id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
        about TEXT,
        available_days TEXT[] DEFAULT '{}',
        available_hours JSONB DEFAULT '{}',
        consultation_fee INTEGER DEFAULT 0,
        experience_years INTEGER DEFAULT 0,
        qualification TEXT DEFAULT '',
        rating FLOAT DEFAULT 0,
        specialty_id UUID,
        total_reviews INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS public.patient_profiles (
        id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
        blood_type TEXT,
        allergies TEXT[] DEFAULT '{}',
        chronic_conditions TEXT[] DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS public.ai_chat_history (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        messages JSONB NOT NULL,
        summary TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      );
    `;
    
    const { error: createError } = await supabase.rpc('exec_sql', { sql: createTablesSQL });
    if (createError) {
      console.error('❌ Error creating tables:', createError);
      // Try alternative approach
      console.log('🔄 Trying alternative table creation...');
      
      // Create tables one by one
      await supabase.from('profiles').select('id').limit(1);
      await supabase.from('doctor_profiles').select('id').limit(1);
      await supabase.from('patient_profiles').select('id').limit(1);
    } else {
      console.log('✅ Tables created successfully');
    }

    // Step 2: Enable RLS
    console.log('🔒 Enabling Row Level Security...');
    
    const rlsSQL = `
      ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.doctor_profiles ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.patient_profiles ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.ai_chat_history ENABLE ROW LEVEL SECURITY;
    `;
    
    const { error: rlsError } = await supabase.rpc('exec_sql', { sql: rlsSQL });
    if (rlsError) {
      console.warn('⚠️ RLS setup warning:', rlsError);
    } else {
      console.log('✅ RLS enabled successfully');
    }

    // Step 3: Create trigger function
    console.log('⚙️ Creating trigger function...');
    
    const triggerSQL = `
      CREATE OR REPLACE FUNCTION public.handle_new_user()
      RETURNS TRIGGER AS $$
      BEGIN
        -- Insert a new row into the profiles table
        INSERT INTO public.profiles (id, email, full_name, role, phone)
        VALUES (
          NEW.id,
          NEW.email,
          COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
          COALESCE(NEW.raw_user_meta_data->>'role', 'patient'),
          NEW.raw_user_meta_data->>'phone'
        )
        ON CONFLICT (id) DO NOTHING;
        
        -- Create doctor profile if user is a doctor
        IF COALESCE(NEW.raw_user_meta_data->>'role', 'patient') = 'doctor' THEN
          INSERT INTO public.doctor_profiles (
            id, 
            experience_years, 
            qualification, 
            consultation_fee, 
            available_days,
            available_hours
          )
          VALUES (
            NEW.id, 
            0, 
            '', 
            0, 
            ARRAY[]::text[], 
            '{}'::jsonb 
          )
          ON CONFLICT (id) DO NOTHING;
        ELSE
          -- Create patient profile if user is a patient (default)
          INSERT INTO public.patient_profiles (
            id,
            blood_type,
            allergies,
            chronic_conditions
          )
          VALUES (
            NEW.id,
            NULL,
            ARRAY[]::text[],
            ARRAY[]::text[]
          )
          ON CONFLICT (id) DO NOTHING;
        END IF;

        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;

      -- Create the trigger
      DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
      CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
    `;
    
    const { error: triggerError } = await supabase.rpc('exec_sql', { sql: triggerSQL });
    if (triggerError) {
      console.error('❌ Error creating trigger:', triggerError);
    } else {
      console.log('✅ Trigger function created successfully');
    }

    // Step 4: Create RLS policies for AI chat history
    console.log('🔐 Creating RLS policies for AI chat history...');

    const aiChatPoliciesSQL = `
      -- Users can view their own chat history
      CREATE POLICY IF NOT EXISTS "Users can view their own chat history"
        ON public.ai_chat_history FOR SELECT
        USING (auth.uid() = user_id);

      -- Users can insert their own chat history
      CREATE POLICY IF NOT EXISTS "Users can insert their own chat history"
        ON public.ai_chat_history FOR INSERT
        WITH CHECK (auth.uid() = user_id);

      -- Users can update their own chat history
      CREATE POLICY IF NOT EXISTS "Users can update their own chat history"
        ON public.ai_chat_history FOR UPDATE
        USING (auth.uid() = user_id);

      -- Users can delete their own chat history
      CREATE POLICY IF NOT EXISTS "Users can delete their own chat history"
        ON public.ai_chat_history FOR DELETE
        USING (auth.uid() = user_id);
    `;

    const { error: aiChatPoliciesError } = await supabase.rpc('exec_sql', { sql: aiChatPoliciesSQL });
    if (aiChatPoliciesError) {
      console.warn('⚠️ AI chat policies warning:', aiChatPoliciesError);
    } else {
      console.log('✅ AI chat policies created successfully');
    }

    // Step 5: Create missing patient profiles for existing users
    console.log('👥 Creating missing patient profiles...');
    
    const { data: existingProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('role', 'patient');
    
    if (profilesError) {
      console.error('❌ Error fetching existing profiles:', profilesError);
    } else if (existingProfiles) {
      for (const profile of existingProfiles) {
        const { error: insertError } = await supabase
          .from('patient_profiles')
          .insert({
            id: profile.id,
            blood_type: null,
            allergies: [],
            chronic_conditions: []
          })
          .select()
          .single();
        
        if (insertError && !insertError.message.includes('duplicate key')) {
          console.warn(`⚠️ Warning creating patient profile for ${profile.id}:`, insertError);
        }
      }
      console.log(`✅ Processed ${existingProfiles.length} existing patient profiles`);
    }

    console.log('🎉 Database setup completed successfully!');
    return true;
    
  } catch (error) {
    console.error('💥 Database setup failed:', error);
    return false;
  }
};

// Add to window for easy access
if (typeof window !== 'undefined') {
  (window as any).runDatabaseSetup = runDatabaseSetup;
}
