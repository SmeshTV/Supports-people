-- Create trash table if not exists
CREATE TABLE IF NOT EXISTS trash (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content_type TEXT NOT NULL,
  content_id UUID NOT NULL,
  content_data JSONB,
  parent_id UUID,
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_restored BOOLEAN DEFAULT FALSE,
  restored_at TIMESTAMP WITH TIME ZONE,
  restored_by UUID
);

-- Add source_description to test_sets
ALTER TABLE test_sets ADD COLUMN IF NOT EXISTS source_description TEXT DEFAULT '';

-- Add new columns to questions for different question types
ALTER TABLE questions ADD COLUMN IF NOT EXISTS correct_text TEXT;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS correct_order JSONB DEFAULT '[]'::jsonb;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS correct_pairs JSONB DEFAULT '[]'::jsonb;

-- Add parent_id to helper_articles
ALTER TABLE helper_articles ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES directions(id) ON DELETE SET NULL;

-- Add image_url to sections
ALTER TABLE sections ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_trash_content ON trash(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_trash_expires ON trash(expires_at);
CREATE INDEX IF NOT EXISTS idx_helper_articles_parent ON helper_articles(parent_id);
