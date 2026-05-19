-- ============================================
-- MIGRATION: Fix questions CHECK constraints
-- Run this in Supabase SQL Editor
-- ============================================

-- Drop old check constraints
ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_type_check;
ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_difficulty_check;
ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_points_check;

-- Add new check constraints with all 12 question types
ALTER TABLE questions ADD CONSTRAINT questions_type_check 
  CHECK (type IN ('single', 'multiple', 'truefalse', 'fill', 'numeric', 'short_answer', 'matching', 'ordering', 'dropdown', 'cloze', 'essay', 'hotspot'));

ALTER TABLE questions ADD CONSTRAINT questions_difficulty_check 
  CHECK (difficulty IN ('easy', 'medium', 'hard', 'unknown'));

ALTER TABLE questions ADD CONSTRAINT questions_points_check 
  CHECK (points >= 1 AND points <= 100);

-- Also ensure RLS is disabled
ALTER TABLE questions DISABLE ROW LEVEL SECURITY;

SELECT 'Questions constraints updated successfully!' as status;
