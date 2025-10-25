-- Migration: Add missing columns for n8n automation flow

-- Add language column to generatedVideos
ALTER TABLE generatedVideos ADD COLUMN IF NOT EXISTS language languageType DEFAULT 'Urdu';

-- Add product_snapshot JSONB column to store product data at creation time
ALTER TABLE generatedVideos ADD COLUMN IF NOT EXISTS product_snapshot JSONB;

-- Add video_id column to scripts table to link scripts to videos
ALTER TABLE scripts ADD COLUMN IF NOT EXISTS video_id INT REFERENCES generatedVideos(id) ON DELETE CASCADE;

-- Add created_at and updated_at timestamps to scripts table
ALTER TABLE scripts ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT now();
ALTER TABLE scripts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Add created_at timestamp to generatedVideos table
ALTER TABLE generatedVideos ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Update the updated_at trigger for generatedVideos if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for generatedVideos
DROP TRIGGER IF EXISTS update_generatedvideos_updated_at ON generatedVideos;
CREATE TRIGGER update_generatedvideos_updated_at
    BEFORE UPDATE ON generatedVideos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for scripts
DROP TRIGGER IF EXISTS update_scripts_updated_at ON scripts;
CREATE TRIGGER update_scripts_updated_at
    BEFORE UPDATE ON scripts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add created_at timestamp to publishedVideo table
ALTER TABLE publishedVideo ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Create trigger for publishedVideo
DROP TRIGGER IF EXISTS update_publishedvideo_updated_at ON publishedVideo;
CREATE TRIGGER update_publishedvideo_updated_at
    BEFORE UPDATE ON publishedVideo
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
