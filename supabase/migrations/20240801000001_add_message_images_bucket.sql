-- Create a message_images bucket for storing chat images
INSERT INTO storage.buckets (id, name, public)
VALUES ('message_images', 'message_images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload and read message images
INSERT INTO storage.policies (name, definition, bucket_id)
VALUES 
  ('Authenticated users can upload message images', 
   '(bucket_id = ''message_images'' AND auth.role() = ''authenticated'')', 
   'message_images')
ON CONFLICT (name, bucket_id) DO NOTHING;

INSERT INTO storage.policies (name, definition, bucket_id)
VALUES 
  ('Authenticated users can read message images', 
   '(bucket_id = ''message_images'' AND auth.role() = ''authenticated'')', 
   'message_images')
ON CONFLICT (name, bucket_id) DO NOTHING; 