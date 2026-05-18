-- Add parent_id to helper_articles for tree structure
ALTER TABLE helper_articles ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES directions(id) ON DELETE SET NULL;

-- Add image_url to sections for lecture images
ALTER TABLE sections ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Create index for faster parent_id lookups
CREATE INDEX IF NOT EXISTS idx_helper_articles_parent ON helper_articles(parent_id);
