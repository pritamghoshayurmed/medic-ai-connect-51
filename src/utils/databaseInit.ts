
import { supabase } from "@/integrations/supabase/client";

export async function initializeDatabase() {
  try {
    console.log("Initializing database...");
    
    // Create profiles table if it doesn't exist
    const { error: profilesError } = await supabase.query(`
      CREATE TABLE IF NOT EXISTS profiles (
        id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
        full_name TEXT,
        email TEXT UNIQUE,
        phone TEXT,
        role TEXT CHECK (role IN ('patient', 'doctor')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    
    if (profilesError) {
      console.error("Error creating profiles table:", profilesError);
    }
    
    // Create doctor_profiles table
    const { error: doctorProfilesError } = await supabase.query(`
      CREATE TABLE IF NOT EXISTS doctor_profiles (
        id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
        specialty TEXT,
        experience_years INTEGER DEFAULT 0,
        qualification TEXT,
        consultation_fee NUMERIC DEFAULT 0,
        available_days TEXT[],
        available_hours JSONB DEFAULT '{}'::JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    
    if (doctorProfilesError) {
      console.error("Error creating doctor_profiles table:", doctorProfilesError);
    }
    
    // Create appointments table
    const { error: appointmentsError } = await supabase.query(`
      CREATE TABLE IF NOT EXISTS appointments (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        doctor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        appointment_date DATE NOT NULL,
        appointment_time TEXT NOT NULL,
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
        symptoms TEXT,
        diagnosis TEXT,
        prescription TEXT,
        cancellation_reason TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    
    if (appointmentsError) {
      console.error("Error creating appointments table:", appointmentsError);
    }
    
    // Create messages table
    const { error: messagesError } = await supabase.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        receiver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        timestamp TIMESTAMPTZ DEFAULT NOW(),
        read BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    
    if (messagesError) {
      console.error("Error creating messages table:", messagesError);
    }
    
    // Create medications table
    const { error: medicationsError } = await supabase.query(`
      CREATE TABLE IF NOT EXISTS medications (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        dosage TEXT NOT NULL,
        frequency TEXT NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE,
        prescribed_by TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    
    if (medicationsError) {
      console.error("Error creating medications table:", medicationsError);
    }
    
    console.log("Database initialization complete.");
    
  } catch (error) {
    console.error("Error initializing database:", error);
  }
}

export async function initializeUserTriggers() {
  try {
    console.log("Initializing user triggers...");
    
    // Create trigger function to automatically create profile when user signs up
    const { error: triggerFuncError } = await supabase.query(`
      CREATE OR REPLACE FUNCTION public.handle_new_user()
      RETURNS TRIGGER AS $$
      BEGIN
        INSERT INTO public.profiles (id, full_name, email, phone, role)
        VALUES (
          NEW.id,
          NEW.raw_user_meta_data->>'full_name',
          NEW.email,
          COALESCE(NEW.raw_user_meta_data->>'phone', ''),
          COALESCE(NEW.raw_user_meta_data->>'role', 'patient')
        );
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `);
    
    if (triggerFuncError) {
      console.error("Error creating trigger function:", triggerFuncError);
    }
    
    // Create trigger
    const { error: triggerError } = await supabase.query(`
      DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
      CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
    `);
    
    if (triggerError) {
      console.error("Error creating trigger:", triggerError);
    }
    
    console.log("User triggers initialization complete.");
    
  } catch (error) {
    console.error("Error initializing user triggers:", error);
  }
}
