-- Add prescription_url and is_ai columns to messages table
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS prescription_url TEXT,
ADD COLUMN IF NOT EXISTS is_ai BOOLEAN DEFAULT FALSE;

-- Create a prescriptions bucket for storing prescription files
INSERT INTO storage.buckets (id, name, public)
VALUES ('prescriptions', 'prescriptions', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload and read prescriptions
INSERT INTO storage.policies (name, definition, bucket_id)
VALUES 
  ('Authenticated users can upload prescriptions', 
   '(bucket_id = ''prescriptions'' AND auth.role() = ''authenticated'')', 
   'prescriptions')
ON CONFLICT (name, bucket_id) DO NOTHING;

INSERT INTO storage.policies (name, definition, bucket_id)
VALUES 
  ('Authenticated users can read prescriptions', 
   '(bucket_id = ''prescriptions'' AND auth.role() = ''authenticated'')', 
   'prescriptions')
ON CONFLICT (name, bucket_id) DO NOTHING;