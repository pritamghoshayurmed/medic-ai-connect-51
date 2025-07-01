-- Create a sequence for potentially shorter, user-friendly IDs if needed, though UUID is fine.
-- CREATE SEQUENCE articles_short_id_seq;

CREATE TABLE public.articles (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    title text NOT NULL,
    slug text NOT NULL,
    content text NOT NULL, -- Can store markdown here
    author_id uuid NULL, -- FK to profiles table
    author_name text NULL, -- Denormalized author name for display
    image_url text NULL, -- URL for a header image or thumbnail
    tags text[] NULL, -- Array of tags for categorization
    estimated_read_time integer NULL, -- In minutes
    published_at timestamptz NULL DEFAULT now(), -- Allows for scheduled publishing
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT articles_pkey PRIMARY KEY (id),
    CONSTRAINT articles_slug_key UNIQUE (slug),
    CONSTRAINT articles_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE SET NULL -- Or ON DELETE CASCADE if appropriate
);

-- Add RLS policies
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public read access to published articles
CREATE POLICY "Allow public read access to published articles"
ON public.articles
FOR SELECT
USING (published_at <= now());

-- Policy: Allow admin users to perform all operations (assuming an 'admin' role or specific user IDs)
-- Example: CREATE POLICY "Allow admin full access" ON public.articles FOR ALL USING (auth.role() = 'admin');
-- For now, we'll rely on service_role key for inserts/updates from backend or a trusted client.
-- If articles are to be created/managed by specific users (e.g. doctors), more granular policies are needed.

-- Optional: Trigger to update `updated_at` timestamp
CREATE OR REPLACE FUNCTION public.set_current_timestamp_updated_at()
RETURNS TRIGGER AS $$
DECLARE
  _new record;
BEGIN
  _new := NEW;
  _new."updated_at" = NOW();
  RETURN _new;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_articles_updated_at
BEFORE UPDATE ON public.articles
FOR EACH ROW
EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- Add some sample data (optional, for testing)
INSERT INTO public.articles (title, slug, content, author_name, estimated_read_time, tags, published_at) VALUES
('Understanding Your Heart Health', 'understanding-heart-health', '# Understanding Your Heart Health\n\nYour heart is one of the most important organs in your body. Keeping it healthy is crucial for overall well-being...\n\n## Tips for a Healthy Heart\n\n* Eat a balanced diet\n* Exercise regularly\n* Manage stress\n* Get enough sleep', 'Dr. Cardio', 5, '{"heart", "health", "tips"}', NOW() - interval '1 day'),
('The Importance of Regular Check-ups', 'regular-check-ups', '# The Importance of Regular Check-ups\n\nRegular medical check-ups can help detect problems early, before they become serious...\n\n## What to Expect\n\n* Physical exam\n* Blood tests\n* Discussion about lifestyle', 'Kabiraj Health Team', 3, '{"preventive care", "health"}', NOW() - interval '2 days'),
('Managing Stress in a Hectic World', 'managing-stress', '# Managing Stress in a Hectic World\n\nStress is a common experience, but chronic stress can take a toll on your health...\n\n## Techniques\n\n* Mindfulness meditation\n* Deep breathing exercises\n* Physical activity', 'Dr. Wellness', 7, '{"stress", "mental health", "well-being"}', NOW());

-- Note: Replace YYYYMMDDHHMMSS in the filename with the current timestamp before applying.
-- Example: 20231027103000_create_articles_table.sql
