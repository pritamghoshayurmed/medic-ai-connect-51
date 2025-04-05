
CREATE TABLE IF NOT EXISTS patient_medical_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES profiles(id) NOT NULL,
  blood_type TEXT,
  allergies TEXT[],
  chronic_conditions TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(patient_id)
);

-- Add RLS policies
ALTER TABLE patient_medical_info ENABLE ROW LEVEL SECURITY;

-- Allow users to see only their own medical info
CREATE POLICY "Users can view their own medical info"
  ON patient_medical_info
  FOR SELECT
  USING (auth.uid() = patient_id);

-- Allow users to insert their own medical info
CREATE POLICY "Users can insert their own medical info"
  ON patient_medical_info
  FOR INSERT
  WITH CHECK (auth.uid() = patient_id);

-- Allow users to update their own medical info
CREATE POLICY "Users can update their own medical info"
  ON patient_medical_info
  FOR UPDATE
  USING (auth.uid() = patient_id);

-- Allow users to delete their own medical info
CREATE POLICY "Users can delete their own medical info"
  ON patient_medical_info
  FOR DELETE
  USING (auth.uid() = patient_id);
