-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create doctor_profiles table if it doesn't exist
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

-- Create a trigger function to handle new user signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert a new row into the profiles table
  INSERT INTO public.profiles (id, email, full_name, role, phone)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    COALESCE(NEW.raw_user_meta_data->>'role', 'patient'),
    NEW.raw_user_meta_data->>'phone'
  );

  -- Create doctor profile if user is a doctor
  IF NEW.raw_user_meta_data->>'role' = 'doctor' THEN
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
      0, -- Default experience years
      '', -- Default qualification
      0, -- Default consultation fee
      ARRAY[]::text[], -- Default available days (empty array)
      '{}'::jsonb -- Default available hours (empty JSON)
    );
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
      NULL, -- Default blood type
      ARRAY[]::text[], -- Default allergies (empty array)
      ARRAY[]::text[] -- Default chronic conditions (empty array)
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to call the function on user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable Row Level Security on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles table
CREATE POLICY "Users can view all profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id); 