-- Complete Database Setup Script for Medic AI Connect
-- Run this script in Supabase SQL Editor to fix authentication issues

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

-- 2. Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_profiles ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS policies for profiles table
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- 4. Create RLS policies for doctor_profiles
DROP POLICY IF EXISTS "Users can view doctor profiles" ON public.doctor_profiles;
CREATE POLICY "Users can view doctor profiles"
  ON public.doctor_profiles FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Doctors can update their own profile" ON public.doctor_profiles;
CREATE POLICY "Doctors can update their own profile"
  ON public.doctor_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- 5. Create RLS policies for patient_profiles
DROP POLICY IF EXISTS "Users can view their own patient profile" ON public.patient_profiles;
CREATE POLICY "Users can view their own patient profile"
  ON public.patient_profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own patient profile" ON public.patient_profiles;
CREATE POLICY "Users can update their own patient profile"
  ON public.patient_profiles FOR UPDATE
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own patient profile" ON public.patient_profiles;
CREATE POLICY "Users can insert their own patient profile"
  ON public.patient_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Doctors can view patient profiles of their patients" ON public.patient_profiles;
CREATE POLICY "Doctors can view patient profiles of their patients"
  ON public.patient_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.appointments
      WHERE appointments.patient_id = patient_profiles.id
      AND appointments.doctor_id = auth.uid()
    )
  );

-- 6. Create the trigger function for new user signup
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

-- 7. Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 8. Create missing patient profiles for existing users
INSERT INTO public.patient_profiles (id, blood_type, allergies, chronic_conditions)
SELECT 
  p.id,
  NULL,
  ARRAY[]::text[],
  ARRAY[]::text[]
FROM public.profiles p
LEFT JOIN public.patient_profiles pp ON p.id = pp.id
WHERE p.role = 'patient' AND pp.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- 9. Verify the setup
SELECT 'Setup completed successfully!' as status;
