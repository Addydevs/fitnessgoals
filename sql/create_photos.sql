-- Supabase SQL: Create photos table for user-specific progress
CREATE TABLE IF NOT EXISTS photos (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
    url text NOT NULL,
    timestamp timestamptz NOT NULL DEFAULT now(),
    analysis text,
    -- Add more fields as needed
    created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own photos
CREATE POLICY "Users can view their own photos" ON photos
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own photos" ON photos
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own photos" ON photos
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own photos" ON photos
    FOR DELETE USING (auth.uid() = user_id);
