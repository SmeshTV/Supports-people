-- Enhanced Admin System for flexible test management
-- 1. Add points to categories
-- 2. Add points and description to test_sets  
-- 3. Add 'unknown' difficulty to questions

-- Add points and description to categories
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS points int DEFAULT 1,
ADD COLUMN IF NOT EXISTS description text DEFAULT '';

-- Add points and description to test_sets
ALTER TABLE test_sets
ADD COLUMN IF NOT EXISTS points int DEFAULT 10,
ADD COLUMN IF NOT EXISTS description text DEFAULT '';

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS set_updated_at_on_questions ON questions;

-- Add updated_at handling manually in app or keep existing

-- Note: difficulty is already a check constraint, we handle 'unknown' at app level
-- The check constraint allows: easy, medium, hard
-- We'll allow any value at DB level and validate at app level