-- Add source_description to test_sets for intro modal
ALTER TABLE test_sets ADD COLUMN IF NOT EXISTS source_description TEXT DEFAULT '';

-- Add new columns to questions for different question types
ALTER TABLE questions ADD COLUMN IF NOT EXISTS correct_text TEXT;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS correct_order JSONB DEFAULT '[]'::jsonb;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS correct_pairs JSONB DEFAULT '[]'::jsonb;
