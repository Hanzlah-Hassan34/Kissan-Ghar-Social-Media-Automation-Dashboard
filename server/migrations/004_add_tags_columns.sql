-- Add tags columns to publishedVideo table
ALTER TABLE publishedVideo 
ADD COLUMN IF NOT EXISTS tags TEXT,
ADD COLUMN IF NOT EXISTS tags_status VARCHAR(50) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS tags_generated_count INT DEFAULT 0;
