-- Fix authentication triggers to properly create patient profiles
-- This migration ensures that both doctor and patient profiles are created correctly

-- Ensure patient_profiles table exists
CREATE TABLE IF NOT EXISTS public.patient_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  blood_type TEXT,
  allergies TEXT[] DEFAULT '{}',
  chronic_conditions TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on patient_profiles
ALTER TABLE public.patient_profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for patient_profiles
DROP POLICY IF EXISTS "Users can view their own patient profile" ON public.patient_profiles;
CREATE POLICY "Users can view their own patient profile"
  ON public.patient_profiles
  FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own patient profile" ON public.patient_profiles;
CREATE POLICY "Users can update their own patient profile"
  ON public.patient_profiles
  FOR UPDATE
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own patient profile" ON public.patient_profiles;
CREATE POLICY "Users can insert their own patient profile"
  ON public.patient_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Allow doctors to view patient profiles for their patients (via appointments)
DROP POLICY IF EXISTS "Doctors can view patient profiles of their patients" ON public.patient_profiles;
CREATE POLICY "Doctors can view patient profiles of their patients"
  ON public.patient_profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.appointments
      WHERE appointments.patient_id = patient_profiles.id
      AND appointments.doctor_id = auth.uid()
    )
  );

-- Update the trigger function to create patient profiles
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

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create missing patient profiles for existing users
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
