-- Create patient_profiles table
CREATE TABLE IF NOT EXISTS public.patient_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  blood_type TEXT,
  allergies TEXT[] DEFAULT '{}',
  chronic_conditions TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Set up RLS (Row Level Security)
ALTER TABLE public.patient_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for patient_profiles
-- Allow users to view their own profile
CREATE POLICY "Users can view their own patient profile"
  ON public.patient_profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update their own patient profile"
  ON public.patient_profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Allow users to insert their own profile
CREATE POLICY "Users can insert their own patient profile"
  ON public.patient_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Allow doctors to view patient profiles for their patients (via appointments)
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