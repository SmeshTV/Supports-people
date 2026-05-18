-- Fix questions table constraints
-- Remove constraints that block flexible values

-- Drop existing check constraint on points
ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_points_check;

-- Add new check allowing any positive value
ALTER TABLE questions ADD CONSTRAINT questions_points_check CHECK (points > 0);

-- Drop existing check constraint on difficulty
ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_difficulty_check;

-- Allow unknown difficulty
ALTER TABLE questions ADD CONSTRAINT questions_difficulty_check CHECK (difficulty IN ('easy', 'medium', 'hard', 'unknown'));